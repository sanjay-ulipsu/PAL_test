"""
Mission API — RUAH adaptive assessment endpoints (Motor/MongoDB)
"""
from __future__ import annotations

import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import current_user
from app.db.client import get_db
from app.models.schemas import (
    StartMissionRequest, StartMissionResponse,
    SubmitAnswerRequest, SubmitAnswerResponse, RuahState as RuahStateSchema,
    GenerateAppletResponse, CompleteAppletResponse, Rank, RuahBlock,
)
from app.services.ruah_engine import RuahState, process_answer, determine_question_phase
from app.services.question_generator import generate_question
from app.services.applet_generator import generate_applet

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/missions", tags=["missions"])


# ─── Helpers ─────────────────────────────────────────────────────────────────

async def _load_mission(db, mission_id: str) -> dict:
    doc = await db.missions.find_one({"_id": mission_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Mission not found")
    return doc


async def _load_ilm(db, ilm_id: str) -> dict:
    doc = await db.ilms.find_one({"_id": ilm_id})
    if not doc:
        raise HTTPException(status_code=404, detail="ILM not found")
    return doc


async def _get_history_ids(db, mission_id: str) -> list[str]:
    cursor = db.mission_answers.find({"mission_id": mission_id}, {"question_id": 1})
    docs = await cursor.to_list(None)
    return [d["question_id"] for d in docs]


def _mission_to_ruah_state(mission: dict) -> RuahState:
    total = mission.get("total_questions_answered", 0)
    score_pct = mission.get("score", 0)
    return RuahState(
        current_block=RuahBlock(mission.get("current_ruah_block", "R")),
        ru_count=mission.get("ru_count", 0),
        a_count=mission.get("a_count", 0),
        h_count=mission.get("h_count", 0),
        total_answered=total,
        score=score_pct,
        total_correct=round(score_pct * total / 100) if total else 0,
        # Pair state
        ru_pair_correct=mission.get("ru_pair_correct", 0),
        a_pair_idx=mission.get("a_pair_idx", 0),
        a_pair_correct=mission.get("a_pair_correct", 0),
    )


async def _unlock_rank(db, student_id: str, ilm_id: str, rank: str, score: int):
    existing = await db.rank_progress.find_one(
        {"student_id": student_id, "ilm_id": ilm_id, "rank": rank}
    )
    if existing:
        updates: dict = {"unlocked": True, "attempts": existing.get("attempts", 0) + 1}
        if score > existing.get("best_score", 0):
            updates["best_score"] = score
        await db.rank_progress.update_one({"_id": existing["_id"]}, {"$set": updates})
    else:
        await db.rank_progress.insert_one({
            "_id": str(uuid.uuid4()),
            "student_id": student_id,
            "ilm_id": ilm_id,
            "rank": rank,
            "unlocked": True,
            "best_score": score,
            "attempts": 1,
        })


async def _validate_answer(db, mission_id: str, question_id: str, answer) -> tuple[bool, str, int | None]:
    """
    Look up stored question snapshot and validate the submitted answer.

    Returns (is_correct, explanation, correct_index_or_none).
    Falls back to is_correct=True if question not found (graceful degradation).
    """
    stored = await db.mission_questions.find_one(
        {"mission_id": mission_id, "question_id": question_id}
    )
    if not stored:
        return True, "", None

    correct_idx = stored.get("answer_index")
    explanation = stored.get("explanation", "")

    if correct_idx is None:
        return True, explanation, None

    try:
        submitted = int(answer)
    except (TypeError, ValueError):
        return False, explanation, correct_idx

    return submitted == correct_idx, explanation, correct_idx


# ─── POST /missions ───────────────────────────────────────────────────────────

@router.post("", response_model=StartMissionResponse, status_code=201)
async def start_mission(body: StartMissionRequest, user: dict = Depends(current_user)):
    db = get_db()
    await _load_ilm(db, body.ilm_id)

    ranks_order = ["Cadet", "Agent", "Specialist", "Operator", "Commander"]
    rank_idx = ranks_order.index(body.rank.value)

    if rank_idx > 0:
        prev_rank = ranks_order[rank_idx - 1]
        prev = await db.rank_progress.find_one({
            "student_id": user["_id"],
            "ilm_id": body.ilm_id,
            "rank": prev_rank,
            "unlocked": True,
        })
        if not prev:
            raise HTTPException(
                status_code=403,
                detail=f"Must unlock {prev_rank} before attempting {body.rank.value}",
            )

    mission_id = str(uuid.uuid4())
    await db.missions.insert_one({
        "_id": mission_id,
        "student_id": user["_id"],
        "ilm_id": body.ilm_id,
        "rank": body.rank.value,
        "status": "active",
        "current_ruah_block": "R",
        "ru_count": 0,
        "a_count": 0,
        "h_count": 0,
        "total_questions_answered": 0,
        "score": 0,
        "ideal_distribution_reached": False,
        "applet_triggered": False,
        "applet_completed": False,
        # Pair tracking
        "ru_pair_correct": 0,
        "a_pair_idx": 0,
        "a_pair_correct": 0,
    })

    return StartMissionResponse(
        mission_id=mission_id,
        rank=body.rank,
        ilm_id=body.ilm_id,
        current_block=RuahBlock.R,
    )


# ─── POST /missions/{id}/question ─────────────────────────────────────────────

@router.post("/{mission_id}/question")
async def get_next_question(mission_id: str, user: dict = Depends(current_user)):
    db = get_db()
    mission = await _load_mission(db, mission_id)

    if mission["student_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if mission["status"] != "active":
        raise HTTPException(status_code=400, detail=f"Mission is {mission['status']}, not active")

    ilm = await _load_ilm(db, mission["ilm_id"])
    state = _mission_to_ruah_state(mission)
    phase = determine_question_phase(state)
    history_ids = await _get_history_ids(db, mission_id)

    q = await generate_question(
        ilm=ilm,
        phase=phase,
        history_ids=history_ids,
        question_number=state.total_answered + 1,
    )

    # Store question snapshot for server-side answer validation
    await db.mission_questions.update_one(
        {"mission_id": mission_id, "question_id": q.id},
        {"$set": {
            "mission_id": mission_id,
            "question_id": q.id,
            "answer_index": q.answer_index,
            "explanation": q.explanation,
            "ruah_phase": phase.value,
        }},
        upsert=True,
    )

    return q


# ─── POST /missions/{id}/answer ───────────────────────────────────────────────

@router.post("/{mission_id}/answer", response_model=SubmitAnswerResponse)
async def submit_answer(
    mission_id: str, body: SubmitAnswerRequest, user: dict = Depends(current_user)
):
    db = get_db()
    mission = await _load_mission(db, mission_id)

    if mission["student_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if mission["status"] != "active":
        raise HTTPException(status_code=400, detail="Mission is not active")

    # Validate answer against stored question snapshot
    is_correct, explanation, correct_idx = await _validate_answer(
        db, mission_id, body.question_id, body.answer
    )
    correct_answer: str | int | list[int] = correct_idx if correct_idx is not None else body.answer
    if not explanation:
        explanation = "Correct!" if is_correct else "Not quite — keep going!"

    state = _mission_to_ruah_state(mission)
    new_state, block_advanced, mission_done = process_answer(state, is_correct)

    await db.mission_answers.insert_one({
        "_id": str(uuid.uuid4()),
        "mission_id": mission_id,
        "question_id": body.question_id,
        "ruah_phase": state.current_block.value,
        "student_answer": str(body.answer),
        "is_correct": is_correct,
        "block_num": new_state.total_answered,
    })

    applet_required = new_state.mission_complete and not new_state.ideal_reached
    if new_state.ideal_reached:
        new_status = "completed"
    elif applet_required:
        new_status = "applet_pending"
    else:
        new_status = "active"

    await db.missions.update_one({"_id": mission_id}, {"$set": {
        "current_ruah_block": new_state.current_block.value,
        "ru_count": new_state.ru_count,
        "a_count": new_state.a_count,
        "h_count": new_state.h_count,
        "total_questions_answered": new_state.total_answered,
        "score": new_state.score,
        "ideal_distribution_reached": new_state.ideal_reached,
        "applet_triggered": applet_required,
        "status": new_status,
        # Pair state
        "ru_pair_correct": new_state.ru_pair_correct,
        "a_pair_idx": new_state.a_pair_idx,
        "a_pair_correct": new_state.a_pair_correct,
    }})

    if new_status == "completed":
        await _unlock_rank(db, user["_id"], mission["ilm_id"], mission["rank"], new_state.score)

    return SubmitAnswerResponse(
        is_correct=is_correct,
        explanation=explanation,
        correct_answer=correct_answer,
        block_advanced=block_advanced,
        mission_complete=new_state.mission_complete,
        applet_required=applet_required,
        next_block=new_state.current_block if not new_state.mission_complete else None,
        ruah_state=RuahStateSchema(
            block=new_state.current_block,
            ru=new_state.ru_count,
            a=new_state.a_count,
            h=new_state.h_count,
            total=new_state.total_answered,
            score=new_state.score,
            ideal=new_state.ideal_reached,
        ),
    )


# ─── POST /missions/{id}/applet/generate ─────────────────────────────────────

async def _get_wrong_question_texts(db, mission_id: str) -> list[str]:
    """Fetch question texts the student answered incorrectly — context for Gemini applet prompt."""
    wrong_answers = await db.mission_answers.find(
        {"mission_id": mission_id, "is_correct": False},
        {"question_id": 1},
    ).to_list(10)
    if not wrong_answers:
        return []

    question_ids = [a["question_id"] for a in wrong_answers]

    # Look up question text from stored snapshots
    snapshots = await db.mission_questions.find(
        {"mission_id": mission_id, "question_id": {"$in": question_ids}},
        {"question_id": 1},
    ).to_list(None)
    snapshot_ids = {s["question_id"] for s in snapshots}

    # Also try kidsbot.questions for any not in snapshots
    texts: list[str] = []
    kb_docs = await db["kidsbot.questions"].find(
        {"question_id": {"$in": question_ids}},
        {"question_id": 1, "question": 1},
    ).to_list(None)
    kb_map = {d["question_id"]: d["question"] for d in kb_docs}

    for qid in question_ids:
        if qid in kb_map:
            texts.append(kb_map[qid])

    return texts[:5]  # cap at 5 for prompt length


@router.post("/{mission_id}/applet/generate", response_model=GenerateAppletResponse)
async def generate_mission_applet(mission_id: str, user: dict = Depends(current_user)):
    db = get_db()
    mission = await _load_mission(db, mission_id)

    if mission["student_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if mission["status"] not in ("applet_pending", "active"):
        raise HTTPException(status_code=400, detail="Applet not applicable for this mission")

    ilm = await _load_ilm(db, mission["ilm_id"])
    state = _mission_to_ruah_state(mission)

    # Fetch wrong question texts to give Gemini targeted context (FD4 "Read Context" step)
    wrong_texts = await _get_wrong_question_texts(db, mission_id)

    spec, source = await generate_applet(ilm, state, wrong_question_texts=wrong_texts)

    session_id = str(uuid.uuid4())
    await db.applet_sessions.insert_one({
        "_id": session_id,
        "mission_id": mission_id,
        "applet_type": spec.type.value,
        "applet_spec_json": spec.model_dump(),
        "stuck_block": state.current_block.value,
        "ruah_distribution": {"ru": state.ru_count, "a": state.a_count, "h": state.h_count},
        "source": source,
    })

    return GenerateAppletResponse(
        applet_session_id=session_id,
        source=source,
        **spec.model_dump(),
    )


# ─── POST /missions/{id}/applet/complete ─────────────────────────────────────

@router.post("/{mission_id}/applet/complete", response_model=CompleteAppletResponse)
async def complete_mission_applet(mission_id: str, user: dict = Depends(current_user)):
    db = get_db()
    mission = await _load_mission(db, mission_id)

    if mission["student_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    await db.applet_sessions.update_many(
        {"mission_id": mission_id, "completed_at": {"$exists": False}},
        {"$currentDate": {"completed_at": True}},
    )

    final_score = mission.get("score", 0)
    await _unlock_rank(db, user["_id"], mission["ilm_id"], mission["rank"], final_score)

    await db.missions.update_one({"_id": mission_id}, {"$set": {
        "status": "completed",
        "applet_completed": True,
        "ideal_distribution_reached": True,
    }})

    return CompleteAppletResponse(
        rank_unlocked=True,
        rank=Rank(mission["rank"]),
        score=final_score,
    )
