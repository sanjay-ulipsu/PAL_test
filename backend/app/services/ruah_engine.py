"""
RUAH Block-Adaptive Engine — matches the flow diagram exactly.

Flow:
  R/U Phase (2 Qs as a pair, both true_false)
    → Both correct? YES → A Phase
    → Both correct? NO  → retry R/U pair  ─┐
                                            │ 10 Q global cap
  A Phase (2 Qs as a pair, both mcq)        │
    → Both correct? YES → H Phase          │
    → Both correct? NO  → retry A pair  ───┘

  H Phase — remaining questions up to Q10 (all mcq)

  At Q10 — evaluate distribution:
    Ideal 2+2+6? YES → Rank Unlocked (no applet)
    Ideal 2+2+6? NO  → Generate Applet (F9) → Rank Unlocked
"""

from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass, field

from app.models.schemas import RuahBlock

MISSION_TOTAL = 10
IDEAL = {"ru": 2, "a": 2, "h": 6}


@dataclass
class RuahState:
    current_block: RuahBlock = RuahBlock.R

    # Phase counters (cumulative)
    ru_count: int = 0
    a_count: int = 0
    h_count: int = 0
    total_answered: int = 0
    total_correct: int = 0
    score: int = 0

    # Pair tracking — R/U pair
    # R is Q1, U is Q2; evaluated after U is answered
    ru_pair_correct: int = 0   # correct count in current RU pair (reset after eval)

    # Pair tracking — A pair
    a_pair_idx: int = 0        # 0 = first A question, 1 = second A question
    a_pair_correct: int = 0    # correct count in current A pair (reset after eval)

    @property
    def ideal_reached(self) -> bool:
        return (
            self.ru_count == IDEAL["ru"]
            and self.a_count == IDEAL["a"]
            and self.h_count == IDEAL["h"]
        )

    @property
    def mission_complete(self) -> bool:
        return self.total_answered >= MISSION_TOTAL

    @property
    def applet_required(self) -> bool:
        return self.mission_complete and not self.ideal_reached


def process_answer(state: RuahState, is_correct: bool) -> tuple[RuahState, bool, bool]:
    """
    Advance RUAH state after one answer.

    Returns (new_state, block_advanced, mission_done).
    """
    s = deepcopy(state)
    s.total_answered += 1
    if is_correct:
        s.total_correct += 1
    s.score = round((s.total_correct / s.total_answered) * 100) if s.total_answered else 0

    block_advanced = False

    # ── R/U Phase ─────────────────────────────────────────
    if s.current_block == RuahBlock.R:
        s.ru_count += 1
        if is_correct:
            s.ru_pair_correct += 1
        # Always advance to U (second question of the pair)
        s.current_block = RuahBlock.U

    elif s.current_block == RuahBlock.U:
        s.ru_count += 1
        if is_correct:
            s.ru_pair_correct += 1
        # RU pair complete — evaluate
        if s.ru_pair_correct == 2:
            s.current_block = RuahBlock.A
            block_advanced = True
        else:
            s.current_block = RuahBlock.R   # retry — new pair
        s.ru_pair_correct = 0               # reset pair tracker

    # ── A Phase ────────────────────────────────────────────
    elif s.current_block == RuahBlock.A:
        s.a_count += 1
        if is_correct:
            s.a_pair_correct += 1

        if s.a_pair_idx == 0:
            # First A question — stay in A, wait for second
            s.a_pair_idx = 1
        else:
            # Second A question — evaluate pair
            if s.a_pair_correct == 2:
                s.current_block = RuahBlock.H
                block_advanced = True
            # else stay in A (retry new pair)
            s.a_pair_correct = 0
            s.a_pair_idx = 0

    # ── H Phase ────────────────────────────────────────────
    elif s.current_block == RuahBlock.H:
        s.h_count += 1
        # No gate — just fill remaining questions to 10

    mission_done = s.total_answered >= MISSION_TOTAL
    return s, block_advanced, mission_done


def determine_question_phase(state: RuahState) -> RuahBlock:
    """
    Return which RUAH block the next question should come from.

    Budget guard: if retry loops exhaust one phase, force forward so
    the 10 Q cap doesn't trap the student forever.
    Budget is soft: leave at least 2 Qs for each remaining phase.
    """
    if state.mission_complete:
        return state.current_block

    remaining = MISSION_TOTAL - state.total_answered

    if state.current_block in (RuahBlock.R, RuahBlock.U):
        # Force to A if < 4 questions left (need 2A + 6H minimum)
        if remaining <= 4:
            return RuahBlock.A
        return state.current_block

    if state.current_block == RuahBlock.A:
        # Force to H if < 2 questions left (need at least 1H)
        if remaining <= 1:
            return RuahBlock.H
        return state.current_block

    return RuahBlock.H
