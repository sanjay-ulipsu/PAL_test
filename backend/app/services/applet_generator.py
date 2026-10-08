"""
Dynamic Applet Generator (F9) — matches FD4 exactly.

Pipeline:
  Mission End (non-ideal RUAH, applet_triggered=true)
  → Read Context  (RUAH distribution + wrong question texts)
  → Select Type   (RU→concept_mapper, A→step_sequencer, H→scenario_sorter)
  → Gemini Generate (applet spec JSON, schema-constrained)
  → [Gemini fail?] → applet_bank collection (static FE fallback)
  → Render (DynamicApplet component)
  → Student Interacts (drag/select/fill — no score)
  → Rank Unlocked (applet_completed=true → upsert rank)
"""
from __future__ import annotations

import json
import logging
from typing import Any

import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings
from app.models.schemas import AppletSpec, AppletType
from app.services.ruah_engine import RuahState

logger = logging.getLogger(__name__)


def _get_model():
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel("gemini-3.6-flash")


# ─── Stuck-block → applet type (per diagram) ─────────────────────────────────

def _choose_applet_type(state: RuahState) -> AppletType:
    """
    Select applet type by where the student got stuck.
    Matches FD4 mapping exactly:
      RU stuck   → concept_mapper   (recall/understand reinforcement)
      A  stuck   → step_sequencer   (application reinforcement)
      H  partial → scenario_sorter  (higher-order thinking reinforcement)
    """
    # ru_count > 2 means student needed extra R/U pairs (retried)
    if state.ru_count > 2:
        return AppletType.concept_mapper
    # a_count > 2 means student needed extra A pairs (retried)
    if state.a_count > 2:
        return AppletType.step_sequencer
    # Reached H but didn't get 6 H questions → mixed/partial
    return AppletType.scenario_sorter


# ─── Applet JSON schemas for Gemini ──────────────────────────────────────────

APPLET_SCHEMAS = {
    AppletType.concept_mapper: """{
  "type": "concept_mapper",
  "title": "short title",
  "description": "one-line instruction for the student",
  "content": {
    "question": "Which concept is the central idea that connects the others?",
    "target_concept": "c2",
    "concepts": [
      {"id": "c1", "label": "Term A"},
      {"id": "c2", "label": "Central Term"},
      {"id": "c3", "label": "Term C"},
      {"id": "c4", "label": "Term D"}
    ],
    "connections": [
      {"from": "c1", "to": "c2", "label": "leads to"},
      {"from": "c2", "to": "c3", "label": "enables"}
    ]
  }
}""",
    AppletType.step_sequencer: """{
  "type": "step_sequencer",
  "title": "short title",
  "description": "one-line instruction for the student",
  "content": {
    "instruction": "Drag the steps into the correct order:",
    "steps": [
      {"id": "s1", "text": "Launch the product and collect feedback", "correct_order": 3},
      {"id": "s2", "text": "Identify a customer need or problem", "correct_order": 1},
      {"id": "s3", "text": "Test the idea with a small group", "correct_order": 2},
      {"id": "s4", "text": "Scale the business based on feedback", "correct_order": 4}
    ]
  }
}""",
    AppletType.scenario_sorter: """{
  "type": "scenario_sorter",
  "title": "short title",
  "description": "one-line instruction for the student",
  "content": {
    "instruction": "Sort each scenario into the correct category:",
    "categories": [
      {"id": "cat1", "label": "Category A"},
      {"id": "cat2", "label": "Category B"}
    ],
    "scenarios": [
      {"id": "sc1", "text": "Scenario description 1", "category": "cat1"},
      {"id": "sc2", "text": "Scenario description 2", "category": "cat2"},
      {"id": "sc3", "text": "Scenario description 3", "category": "cat1"},
      {"id": "sc4", "text": "Scenario description 4", "category": "cat2"}
    ]
  }
}""",
    AppletType.fill_the_gap: """{
  "type": "fill_the_gap",
  "title": "short title",
  "description": "one-line instruction for the student",
  "content": {
    "sentence_template": "The [BLANK] helps you [BLANK] your money wisely.",
    "blanks": [
      {"id": "b1", "correct_answer": "budget", "hint": "spending plan"},
      {"id": "b2", "correct_answer": "manage", "hint": "control"}
    ],
    "options": ["budget", "manage", "invest", "borrow"]
  }
}""",
}


# ─── Gemini generation ────────────────────────────────────────────────────────

@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=8))
async def _generate_with_gemini(
    ilm: dict,
    state: RuahState,
    applet_type: AppletType,
    wrong_question_texts: list[str],
) -> AppletSpec:
    model = _get_model()
    schema = APPLET_SCHEMAS[applet_type]

    # Determine what the student struggled with (for targeted prompt)
    if state.ru_count > 2:
        struggle = "recalling and understanding basic concepts (R/U phase)"
    elif state.a_count > 2:
        struggle = "applying concepts to new situations (A phase)"
    else:
        struggle = "higher-order analysis and evaluation (H phase)"

    wrong_section = ""
    if wrong_question_texts:
        joined = "\n".join(f"  - {q}" for q in wrong_question_texts[:5])
        wrong_section = f"\nQuestions the student answered incorrectly:\n{joined}\n"

    step_sequencer_rules = ""
    if applet_type == AppletType.step_sequencer:
        step_sequencer_rules = """
step_sequencer RULES (CRITICAL — follow exactly):
- The steps array MUST be in a SHUFFLED / MIXED order — NOT in correct_order sequence.
  correct_order values reveal the intended sequence; the array order must differ so the student has to drag to reorder.
- Never use temporal/positional words in step text: no "first", "then", "next", "after", "finally", "lastly", "step 1", etc.
  Write each step as a neutral action (e.g. "Set a weekly savings target" not "First, set a savings target").
- correct_order values must form a clear, unambiguous logical sequence (1 → 2 → 3 → 4).
- The 4 steps together must tell a complete, logical story when arranged in correct_order sequence.
"""

    prompt = f"""You are creating a short interactive learning activity for a student (ages 10-15).

ILM: {ilm.get("title", "")}
Topic: {ilm.get("topic", "")}
Learning outcome: {ilm.get("learning_outcome", "")}

Student RUAH distribution: R/U={state.ru_count} A={state.a_count} H={state.h_count} (ideal: 2/2/6)
Student struggled with: {struggle}
{wrong_section}
Activity type: {applet_type.value}
Generate ONE activity about the ILM topic above. Use Finance & Entrepreneurship context.
Age-appropriate language (Grade 6-9). Keep it focused and concise.
{step_sequencer_rules}
Return raw JSON only matching this schema exactly:
{schema}"""

    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.8,
        ),
    )

    raw = json.loads(response.text)
    return AppletSpec(
        type=AppletType(raw["type"]),
        title=raw["title"],
        description=raw["description"],
        content=raw["content"],
    )


# ─── FE-specific static fallback bank ────────────────────────────────────────

_FALLBACK_BANK: dict[str, dict[str, Any]] = {
    AppletType.concept_mapper.value: {
        "type": "concept_mapper",
        "title": "Money Concept Map",
        "description": "Identify the central idea that connects these finance terms.",
        "content": {
            "question": "Which concept connects Needs, Wants, Savings, and Spending?",
            "target_concept": "c2",
            "concepts": [
                {"id": "c1", "label": "Needs"},
                {"id": "c2", "label": "Budget"},
                {"id": "c3", "label": "Savings"},
                {"id": "c4", "label": "Spending"},
            ],
            "connections": [
                {"from": "c1", "to": "c2", "label": "planned in"},
                {"from": "c2", "to": "c3", "label": "allocates to"},
                {"from": "c2", "to": "c4", "label": "controls"},
            ],
        },
    },
    AppletType.step_sequencer.value: {
        "type": "step_sequencer",
        "title": "Start Your Business",
        "description": "Drag the steps into the correct order to launch a business.",
        "content": {
            "instruction": "Put these entrepreneurship steps in the right order:",
            "steps": [
                {"id": "s1", "text": "Plan costs and expected revenue", "correct_order": 3},
                {"id": "s2", "text": "Identify a problem or need in the market", "correct_order": 1},
                {"id": "s3", "text": "Launch the product and gather customer feedback", "correct_order": 4},
                {"id": "s4", "text": "Create a business idea to solve the problem", "correct_order": 2},
            ],
        },
    },
    AppletType.scenario_sorter.value: {
        "type": "scenario_sorter",
        "title": "Need or Want?",
        "description": "Sort each item into Needs or Wants.",
        "content": {
            "instruction": "Classify each item as a Need or a Want:",
            "categories": [
                {"id": "need", "label": "Need"},
                {"id": "want", "label": "Want"},
            ],
            "scenarios": [
                {"id": "sc1", "text": "Buying food for the week", "category": "need"},
                {"id": "sc2", "text": "Buying a new video game", "category": "want"},
                {"id": "sc3", "text": "Paying school fees", "category": "need"},
                {"id": "sc4", "text": "Getting the latest sneakers", "category": "want"},
            ],
        },
    },
    AppletType.fill_the_gap.value: {
        "type": "fill_the_gap",
        "title": "Finance Fill-in",
        "description": "Complete the sentences using the correct finance terms.",
        "content": {
            "sentence_template": "A [BLANK] helps you track income and expenses, so you can reach your [BLANK].",
            "blanks": [
                {"id": "b1", "correct_answer": "budget", "hint": "spending plan"},
                {"id": "b2", "correct_answer": "financial goals", "hint": "money targets"},
            ],
            "options": ["budget", "financial goals", "loan", "profit"],
        },
    },
}


def _get_fallback_applet(applet_type: AppletType) -> AppletSpec:
    raw = _FALLBACK_BANK.get(applet_type.value, _FALLBACK_BANK[AppletType.concept_mapper.value])
    return AppletSpec(
        type=AppletType(raw["type"]),
        title=raw["title"],
        description=raw["description"],
        content=raw["content"],
    )


# ─── Public interface ─────────────────────────────────────────────────────────

async def generate_applet(
    ilm: dict,
    state: RuahState,
    wrong_question_texts: list[str] | None = None,
) -> tuple[AppletSpec, str]:
    """
    Generate a dynamic applet. Returns (AppletSpec, source).
    source is "gemini" or "fallback_bank".
    """
    applet_type = _choose_applet_type(state)
    wrong_texts = wrong_question_texts or []

    try:
        spec = await _generate_with_gemini(ilm, state, applet_type, wrong_texts)
        logger.info("Applet generated via Gemini: type=%s ilm=%s", applet_type.value, ilm.get("_id"))
        return spec, "gemini"
    except Exception as e:
        logger.warning("Gemini applet generation failed: %s — using FE fallback bank", e)
        return _get_fallback_applet(applet_type), "fallback_bank"
