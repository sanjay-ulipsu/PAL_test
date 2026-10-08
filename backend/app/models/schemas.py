from __future__ import annotations
from enum import Enum
from typing import Any, Literal
from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────
# Shared enums
# ─────────────────────────────────────────────────────────

class Rank(str, Enum):
    Cadet = "Cadet"
    Agent = "Agent"
    Specialist = "Specialist"
    Operator = "Operator"
    Commander = "Commander"


class RuahBlock(str, Enum):
    R = "R"
    U = "U"
    A = "A"
    H = "H"


class QuestionType(str, Enum):
    mcq_3 = "mcq_3"
    mcq_multi_4 = "mcq_multi_4"
    fib = "fib"
    reorder = "reorder"
    scenario_set = "scenario_set"


class QuestionSource(str, Enum):
    content_bank = "content_bank"
    rag_gemini = "rag_gemini"
    fallback = "fallback"


class AppletType(str, Enum):
    concept_mapper = "concept_mapper"
    step_sequencer = "step_sequencer"
    scenario_sorter = "scenario_sorter"
    fill_the_gap = "fill_the_gap"


# ─────────────────────────────────────────────────────────
# Auth schemas
# ─────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    display_name: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class OnboardRequest(BaseModel):
    handle: str | None = None
    display_name: str | None = None
    selected_skill_ids: list[str] | None = None


class ProfileResponse(BaseModel):
    id: str
    email: str
    display_name: str
    handle: str | None = None
    yol: int = 1
    content_focus: str = "global"
    avatar_url: str | None = None
    selected_skill_ids: list[str] = Field(default_factory=list)
    onboarded: bool = False


# ─────────────────────────────────────────────────────────
# Mission schemas
# ─────────────────────────────────────────────────────────

class StartMissionRequest(BaseModel):
    ilm_id: str
    rank: Rank


class StartMissionResponse(BaseModel):
    mission_id: str
    rank: Rank
    ilm_id: str
    current_block: RuahBlock = RuahBlock.R


# ─────────────────────────────────────────────────────────
# Question schemas
# ─────────────────────────────────────────────────────────

class Question(BaseModel):
    id: str
    type: QuestionType
    question: str
    options: list[str] | None = None
    items: list[str] | None = None        # reorder
    answer_index: int | None = None       # mcq_3
    correct_indices: list[int] | None = None  # mcq_multi_4
    answer: str | None = None             # fib
    correct_order: list[int] | None = None    # reorder
    explanation: str
    bloom_level: str | None = None
    ruah_phase: RuahBlock
    source: QuestionSource


# ─────────────────────────────────────────────────────────
# Answer schemas
# ─────────────────────────────────────────────────────────

class SubmitAnswerRequest(BaseModel):
    question_id: str
    answer: str | int | list[int]


class RuahState(BaseModel):
    block: RuahBlock
    ru: int
    a: int
    h: int
    total: int
    score: int
    ideal: bool


class SubmitAnswerResponse(BaseModel):
    is_correct: bool
    explanation: str
    correct_answer: str | int | list[int]
    block_advanced: bool
    mission_complete: bool
    applet_required: bool
    next_block: RuahBlock | None
    ruah_state: RuahState


# ─────────────────────────────────────────────────────────
# Applet schemas
# ─────────────────────────────────────────────────────────

class ConceptMapperContent(BaseModel):
    concepts: list[dict[str, str]]
    connections: list[dict[str, str]]
    question: str
    target_concept: str


class StepSequencerContent(BaseModel):
    steps: list[dict[str, Any]]
    instruction: str


class ScenarioSorterContent(BaseModel):
    scenarios: list[dict[str, str]]
    categories: list[dict[str, str]]
    instruction: str


class FillTheGapContent(BaseModel):
    sentence_template: str
    blanks: list[dict[str, str]]
    options: list[str]


class AppletSpec(BaseModel):
    type: AppletType
    title: str
    description: str
    content: dict[str, Any]


class GenerateAppletResponse(AppletSpec):
    applet_session_id: str
    source: Literal["gemini", "fallback_bank"]


class CompleteAppletResponse(BaseModel):
    rank_unlocked: bool
    rank: Rank
    score: int
