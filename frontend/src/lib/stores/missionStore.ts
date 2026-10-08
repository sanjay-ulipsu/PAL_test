import { create } from "zustand";

export type RuahBlock = "R" | "U" | "A" | "H";

export interface Question {
  id: string;
  type: "mcq_3" | "true_false" | "mcq_multi_4" | "fib" | "reorder" | "scenario_set";
  question: string;
  context?: string;            // scenario banner shown above question (for expanded scenario_set)
  options?: string[];          // answer choices (mcq_3, true_false, fib word-bank, scenario_set)
  items?: string[];            // display list for reorder drag-and-drop
  answer_index?: number | number[]; // number for single-select; number[] for reorder correct sequence
  correct_indices?: number[];  // for mcq_multi_4
  answer?: string;             // for text-input fib (no options)
  correct_order?: number[];    // legacy reorder (1-indexed position per item)
  explanation: string;
  bloom_level?: string;
  ruah_phase: RuahBlock;
  source: "content_bank" | "rag_gemini" | "fallback";
}

export interface AnswerResult {
  is_correct: boolean;
  explanation: string;
  correct_answer: string | number | number[];
  block_advanced: boolean;
  mission_complete: boolean;
  applet_required: boolean;
  next_block: RuahBlock | null;
}

export interface AppletSpec {
  type: "concept_mapper" | "step_sequencer" | "scenario_sorter" | "fill_the_gap" | "misconception_drill";
  title: string;
  description: string;
  content: Record<string, unknown>;
}

interface MissionState {
  missionId: string | null;
  ilmId: string | null;
  rank: string | null;

  // RUAH state
  currentBlock: RuahBlock;
  blockCorrectStreak: number;
  ruCount: number;
  aCount: number;
  hCount: number;
  totalAnswered: number;
  score: number;
  idealReached: boolean;

  // Current question
  currentQuestion: Question | null;
  lastAnswerResult: AnswerResult | null;

  // Applet
  appletSpec: AppletSpec | null;
  appletCompleted: boolean;

  // UI state
  phase: "question" | "feedback" | "applet" | "complete" | "idle";

  // Actions
  initMission: (missionId: string, ilmId: string, rank: string) => void;
  setCurrentQuestion: (q: Question) => void;
  setAnswerResult: (result: AnswerResult, block: RuahBlock, ru: number, a: number, h: number, total: number, score: number, ideal: boolean) => void;
  setAppletSpec: (spec: AppletSpec) => void;
  setAppletCompleted: () => void;
  setPhase: (phase: MissionState["phase"]) => void;
  reset: () => void;
}

const initialRuahState = {
  currentBlock: "R" as RuahBlock,
  blockCorrectStreak: 0,
  ruCount: 0,
  aCount: 0,
  hCount: 0,
  totalAnswered: 0,
  score: 0,
  idealReached: false,
};

export const useMissionStore = create<MissionState>((set) => ({
  missionId: null,
  ilmId: null,
  rank: null,
  ...initialRuahState,

  currentQuestion: null,
  lastAnswerResult: null,
  appletSpec: null,
  appletCompleted: false,
  phase: "idle",

  initMission: (missionId, ilmId, rank) =>
    set({
      missionId,
      ilmId,
      rank,
      ...initialRuahState,
      currentQuestion: null,
      lastAnswerResult: null,
      appletSpec: null,
      appletCompleted: false,
      phase: "question",
    }),

  setCurrentQuestion: (q) => set({ currentQuestion: q, phase: "question" }),

  setAnswerResult: (result, block, ru, a, h, total, score, ideal) =>
    set({
      lastAnswerResult: result,
      currentBlock: block,
      ruCount: ru,
      aCount: a,
      hCount: h,
      totalAnswered: total,
      score,
      idealReached: ideal,
      phase: "feedback",
    }),

  setAppletSpec: (spec) => set({ appletSpec: spec, phase: "applet" }),

  setAppletCompleted: () => set({ appletCompleted: true, phase: "complete" }),

  setPhase: (phase) => set({ phase }),

  reset: () =>
    set({
      missionId: null,
      ilmId: null,
      rank: null,
      ...initialRuahState,
      currentQuestion: null,
      lastAnswerResult: null,
      appletSpec: null,
      appletCompleted: false,
      phase: "idle",
    }),
}));
