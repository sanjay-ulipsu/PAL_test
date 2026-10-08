"""
Three-tier question generation cascade:
  1. kidsbot.questions (MongoDB — real pre-authored questions)
  2. RAG + Gemini (lesson content chunks + Gemini 2.0 Flash)
  3. Local fallback library (offline-safe)

RUAH → question type mapping:
  R / U blocks  →  true_false  (recall & understand)
  A / H blocks  →  mcq         (apply & higher-order)
"""
from __future__ import annotations

import json
import logging
import uuid
from typing import Any

import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.config import settings
from app.models.schemas import Question, QuestionType, QuestionSource, RuahBlock
from app.db.client import get_db

logger = logging.getLogger(__name__)

# ─── RUAH → kidsbot question-type mapping ────────────────────────────────────

_RUAH_TO_QTYPE: dict[RuahBlock, list[str]] = {
    RuahBlock.R: ["true_false"],
    RuahBlock.U: ["true_false"],
    RuahBlock.A: ["mcq"],
    RuahBlock.H: ["mcq"],
}


# ─── Tier 1: kidsbot.questions (MongoDB) ─────────────────────────────────────

async def _fetch_from_kidsbot(
    ilm_id: str, phase: RuahBlock, history_ids: list[str]
) -> Question | None:
    """Query kidsbot.questions for a fresh question matching the ILM and RUAH block."""
    try:
        db = get_db()
    except RuntimeError:
        return None

    q_types = _RUAH_TO_QTYPE.get(phase, ["mcq"])
    query: dict = {
        "theme": ilm_id,
        "type": {"$in": q_types},
    }
    if history_ids:
        query["question_id"] = {"$nin": history_ids}

    # Random document from matching pool via $sample
    pipeline = [
        {"$match": query},
        {"$sample": {"size": 1}},
    ]
    cursor = db["kidsbot.questions"].aggregate(pipeline)
    docs = await cursor.to_list(1)
    if not docs:
        # Retry without history exclusion (all questions used up)
        pipeline_retry = [
            {"$match": {"theme": ilm_id, "type": {"$in": q_types}}},
            {"$sample": {"size": 1}},
        ]
        cursor_r = db["kidsbot.questions"].aggregate(pipeline_retry)
        docs = await cursor_r.to_list(1)

    if not docs:
        logger.warning("No kidsbot questions for theme=%s types=%s", ilm_id, q_types)
        return None

    return _normalise_kidsbot(docs[0], phase)


def _normalise_kidsbot(doc: dict, phase: RuahBlock) -> Question:
    """Convert a kidsbot.questions document into the shared Question schema."""
    q_type = doc.get("type", "mcq")
    qid = doc.get("question_id") or str(uuid.uuid4())
    question_text = doc.get("question", "")
    explanation = doc.get("explanation", "")

    if q_type == "true_false":
        correct_answer = str(doc.get("answer", "True"))
        options = ["True", "False"]
        answer_index = 0 if correct_answer.lower() == "true" else 1
        return Question(
            id=qid,
            type=QuestionType.mcq_3,
            question=question_text,
            options=options,
            answer_index=answer_index,
            explanation=explanation,
            bloom_level=phase.value,
            ruah_phase=phase,
            source=QuestionSource.content_bank,
        )

    # mcq — options stored as [{"A": "..."}, {"B": "..."}, ...]
    raw_opts: list[dict] = doc.get("options", [])
    option_keys = [list(o.keys())[0] for o in raw_opts if o]
    option_vals = [list(o.values())[0] for o in raw_opts if o]
    correct_key = doc.get("correct_option") or doc.get("answer", "")
    try:
        answer_index = option_keys.index(correct_key)
    except ValueError:
        answer_index = 0

    return Question(
        id=qid,
        type=QuestionType.mcq_3,
        question=question_text,
        options=option_vals,
        answer_index=answer_index,
        explanation=explanation,
        bloom_level=phase.value,
        ruah_phase=phase,
        source=QuestionSource.content_bank,
    )


# ─── Gemini client ────────────────────────────────────────────────────────────

_model: Any = None


def _get_model():
    global _model
    if _model is None:
        genai.configure(api_key=settings.gemini_api_key)
        _model = genai.GenerativeModel("gemini-3.6-flash")
    return _model


# ─── Tier 2: RAG + Gemini ─────────────────────────────────────────────────────

async def _fetch_rag_context(ilm_id: str, phase: RuahBlock) -> str:
    """Retrieve relevant lesson chunks via Atlas Vector Search."""
    try:
        db = get_db()
        genai.configure(api_key=settings.gemini_api_key)
        embed_model = "models/text-embedding-004"
        query = f"Explain key concepts for {ilm_id} at {phase.value} cognitive level"
        result = genai.embed_content(model=embed_model, content=query)
        embedding = result["embedding"]

        pipeline = [
            {
                "$vectorSearch": {
                    "index": "lesson_embedding_index",
                    "queryVector": embedding,
                    "path": "embedding",
                    "numCandidates": 50,
                    "limit": 4,
                    "filter": {"ilm_id": ilm_id},
                }
            },
            {"$project": {"content": 1, "_id": 0}},
        ]
        cursor = db.lesson_chunks.aggregate(pipeline)
        docs = await cursor.to_list(None)
        chunks = [d["content"] for d in docs]
        return "\n\n".join(chunks) if chunks else ""
    except Exception as e:
        logger.warning("RAG context fetch failed: %s", e)
        return ""


BLOOM_LEVEL_MAP = {
    RuahBlock.R: "Remember — recall of facts and basic concepts",
    RuahBlock.U: "Understand — explain ideas or concepts in own words",
    RuahBlock.A: "Apply — use information in new situations",
    RuahBlock.H: "Analyze/Evaluate/Create — draw connections, justify, design",
}

MCQ_EXAMPLE = '{"type":"mcq_3","question":"...","options":["A","B","C","D"],"answer_index":0,"explanation":"..."}'


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
)
async def _generate_via_gemini(
    ilm: dict,
    phase: RuahBlock,
    rag_context: str,
    history_questions: list[str],
) -> Question:
    model = _get_model()

    avoid_section = (
        f"\nAvoid repeating these questions:\n{chr(10).join(history_questions[-5:])}"
        if history_questions
        else ""
    )
    context_section = f"\nReference lesson content:\n{rag_context}" if rag_context else ""

    # R/U → true_false style (2 options), A/H → 4-option mcq
    if phase in (RuahBlock.R, RuahBlock.U):
        type_hint = 'true/false style — options must be exactly ["True", "False"]'
        example = '{"type":"mcq_3","question":"...","options":["True","False"],"answer_index":0,"explanation":"..."}'
    else:
        type_hint = "4-option multiple choice"
        example = MCQ_EXAMPLE

    prompt = f"""You are an educational question generator for students (ages 10-15).

ILM: {ilm.get("title", "")}
Topic: {ilm.get("topic", "")}
Learning outcome: {ilm.get("learning_outcome", "")}
Cognitive level: {BLOOM_LEVEL_MAP[phase]}
Question style: {type_hint}
{context_section}{avoid_section}

Generate exactly ONE question as valid JSON matching:
{example}

Rules:
- Age-appropriate language (Grade 6-9)
- explanation: 2-3 educational sentences
- No markdown, no code fences — raw JSON only
"""

    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.7,
        ),
    )

    raw = json.loads(response.text)
    raw["id"] = str(uuid.uuid4())

    return Question(
        id=raw["id"],
        type=QuestionType(raw.get("type", "mcq_3")),
        question=raw["question"],
        options=raw.get("options"),
        answer_index=raw.get("answer_index"),
        explanation=raw.get("explanation", ""),
        bloom_level=phase.value,
        ruah_phase=phase,
        source=QuestionSource.rag_gemini,
    )


# ─── Tier 3: Fallback library ─────────────────────────────────────────────────

_FALLBACK: dict[str, list[dict]] = {
    "R": [
        {
            "id": "fb_r_1",
            "type": "mcq_3",
            "question": "True or False: A budget helps you plan how to spend your money.",
            "options": ["True", "False"],
            "answer_index": 0,
            "explanation": "A budget is a financial plan that helps you track income and expenses so you spend wisely.",
        },
        {
            "id": "fb_r_2",
            "type": "mcq_3",
            "question": "True or False: Entrepreneurs never face any risks when starting a business.",
            "options": ["True", "False"],
            "answer_index": 1,
            "explanation": "Every business involves risk. Entrepreneurs manage these risks through planning and research.",
        },
    ],
    "U": [
        {
            "id": "fb_u_1",
            "type": "mcq_3",
            "question": "True or False: Saving money means spending less than you earn.",
            "options": ["True", "False"],
            "answer_index": 0,
            "explanation": "Saving is the practice of setting aside money you do not spend now for future use.",
        },
    ],
    "A": [
        {
            "id": "fb_a_1",
            "type": "mcq_3",
            "question": "You earn ₹500 and spend ₹350. How much can you save?",
            "options": ["₹100", "₹150", "₹200", "₹350"],
            "answer_index": 1,
            "explanation": "Savings = Income − Expenses = 500 − 350 = ₹150.",
        },
    ],
    "H": [
        {
            "id": "fb_h_1",
            "type": "mcq_3",
            "question": "Which strategy would best help a young entrepreneur reduce financial risk?",
            "options": [
                "Spend all capital on marketing immediately",
                "Start small, test the idea, then scale gradually",
                "Borrow as much money as possible upfront",
                "Ignore customer feedback to save time",
            ],
            "answer_index": 1,
            "explanation": "Starting small reduces exposure. Testing before scaling lets you learn without large losses.",
        },
    ],
}


def _get_fallback_question(phase: RuahBlock, history_ids: list[str]) -> Question:
    bank = _FALLBACK.get(phase.value, _FALLBACK["R"])
    unused = [q for q in bank if q["id"] not in history_ids]
    raw = dict(unused[0] if unused else bank[0])
    return Question(
        id=raw.get("id", str(uuid.uuid4())),
        type=QuestionType(raw["type"]),
        question=raw["question"],
        options=raw.get("options"),
        answer_index=raw.get("answer_index"),
        explanation=raw.get("explanation", ""),
        bloom_level=phase.value,
        ruah_phase=phase,
        source=QuestionSource.fallback,
    )


# ─── Public interface ─────────────────────────────────────────────────────────

async def generate_question(
    ilm: dict,
    phase: RuahBlock,
    history_ids: list[str],
    question_number: int = 1,
) -> Question:
    """
    Three-tier cascade:
      1. kidsbot.questions (MongoDB pre-authored questions)
      2. RAG + Gemini
      3. Fallback library
    """
    ilm_id = ilm.get("ilm_id", "")

    # Tier 1: kidsbot.questions
    q = await _fetch_from_kidsbot(ilm_id, phase, history_ids)
    if q is not None:
        logger.debug("Tier 1 hit: kidsbot theme=%s phase=%s", ilm_id, phase.value)
        return q

    # Tier 2: RAG + Gemini
    try:
        rag_context = await _fetch_rag_context(ilm_id, phase)
        history_questions = [f"[{i}]" for i in history_ids]
        q = await _generate_via_gemini(ilm, phase, rag_context, history_questions)
        logger.debug("Tier 2 hit: Gemini theme=%s phase=%s", ilm_id, phase.value)
        return q
    except Exception as e:
        logger.warning("Gemini generation failed: %s — using fallback", e)

    # Tier 3: fallback
    logger.debug("Tier 3 hit: fallback phase=%s", phase.value)
    return _get_fallback_question(phase, history_ids)
