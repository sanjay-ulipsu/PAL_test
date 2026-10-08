// Shared in-memory state for mock mission API routes

export type RuahBlock = "R" | "U" | "A" | "H";

export interface MockMissionState {
  id: string;
  ilmId: string;              // ILM identifier (e.g. "L2AI02")
  block: "RU" | "A" | "H";  // internal block (RU = R+U pair phase)
  pairQuestion: number;       // 0 = first in pair, 1 = second
  pairCorrect: number;        // correct answers in current pair
  rServed: number;            // R questions answered so far (for cycling)
  uServed: number;            // U questions answered
  aServed: number;            // A questions answered
  hCount: number;             // H questions answered (max 6)
  total: number;              // total questions answered (hard cap: 10)
  correctTotal: number;
  complete: boolean;
  appletTriggered: boolean;
  appletDone: boolean;
  stuckBlock: RuahBlock;      // which block triggered the applet
  wrongQuestions: Array<{ id: string; question: string; ruah_phase: string }>;
}

const g = global as any;
if (!g.__mockMissions) g.__mockMissions = new Map<string, MockMissionState>();
const missions: Map<string, MockMissionState> = g.__mockMissions;

export function createMission(id: string, ilmId = "L2AI02"): MockMissionState {
  const state: MockMissionState = {
    id,
    ilmId,
    block: "RU",
    pairQuestion: 0,
    pairCorrect: 0,
    rServed: 0,
    uServed: 0,
    aServed: 0,
    hCount: 0,
    total: 0,
    correctTotal: 0,
    complete: false,
    appletTriggered: false,
    appletDone: false,
    stuckBlock: "R",
    wrongQuestions: [],
  };
  missions.set(id, state);
  return state;
}

export function getMission(id: string): MockMissionState | undefined {
  return missions.get(id);
}

export function recordWrongAnswer(
  id: string,
  q: { id: string; question: string; ruah_phase?: string }
) {
  const state = missions.get(id);
  if (!state) return;
  if (!state.wrongQuestions.some((w) => w.id === q.id)) {
    state.wrongQuestions.push({
      id: q.id,
      question: q.question,
      ruah_phase: q.ruah_phase ?? "R",
    });
  }
}

// ── Question banks (from L2AI02_Cadet.json — Rock Paper Scissors AI) ─────────
// Sourced from the real content bank format; questions are exactly as authored.
// Complex scenario_set questions are expanded into individual questions with
// a `context` field so the scenario is displayed as a banner above each question.

const R_QUESTIONS = [
  {
    id: "L2AI02-R1",
    type: "mcq_3",
    question: "In Machine Learning, what is a 'Class'?",
    options: [
      "A group of labeled examples that share common features",
      "A variable that stores the confidence percentage",
      "A loop that repeats the training process",
    ],
    answer_index: 0,
    explanation:
      "A Class is a bucket for similar data. For example, all your 'Snake' photos go into the 'Snake' class.",
    bloom_level: "Recall",
    ruah_phase: "R",
    source: "content_bank",
  },
  {
    id: "L2AI02-R2",
    type: "true_false",
    question:
      "True or False: In Supervised Learning, the AI learns by comparing its guesses against the labels we provided.",
    options: ["True", "False"],
    answer_index: 0,
    explanation:
      "Correct! It 'supervises' its own learning by checking if its guess matches your label.",
    bloom_level: "Recall",
    ruah_phase: "R",
    source: "content_bank",
  },
  {
    id: "L2AI02-R3",
    type: "mcq_3",
    question: "What is the primary purpose of 'Data Collection' in this project?",
    options: [
      "To program the rules of the Rock Paper Scissors game",
      "To provide the AI with enough visual features to build a pattern",
      "To increase the frames-per-second (FPS) of the camera",
    ],
    answer_index: 1,
    explanation:
      "Data collection isn't about the game rules; it's about giving the AI the 'vision' it needs to see patterns.",
    bloom_level: "Recall",
    ruah_phase: "R",
    source: "content_bank",
  },
  {
    id: "L2AI02-R4",
    type: "fib",
    question:
      "The percentage that tells us how sure the AI is about a gesture is called the ________ level.",
    options: ["Confidence", "Accuracy", "Reliability", "Probability"],
    answer_index: 0,
    explanation:
      "In ML, 'Confidence' is the standard term for how certain a model is about a specific prediction.",
    bloom_level: "Recall",
    ruah_phase: "R",
    source: "content_bank",
  },
  {
    id: "L2AI02-R5",
    type: "mcq_3",
    question:
      "When using the Machine Learning extension in Scratch, which block is needed to get a response from your trained model?",
    options: [
      "The 'Video Sensing' motion block",
      "The 'Identify' or 'Prediction' reporter block",
      "The 'Forever' loop block",
    ],
    answer_index: 1,
    explanation:
      "The 'Prediction' block is what actually queries your model to see which gesture it recognizes.",
    bloom_level: "Recall",
    ruah_phase: "R",
    source: "content_bank",
  },
  {
    id: "L2AI02-R6",
    type: "true_false",
    question:
      "True or False: A model with 100% confidence on one image is guaranteed to be accurate on all new images.",
    options: ["True", "False"],
    answer_index: 1,
    explanation:
      "False! High confidence just means it *thinks* it is sure; it doesn't mean it's actually correct if the data is bad.",
    bloom_level: "Recall",
    ruah_phase: "R",
    source: "content_bank",
  },
  {
    id: "L2AI02-R7",
    type: "mcq_3",
    question: "What happens during the 'Training' phase of your ML model?",
    options: [
      "The AI writes the Scratch code for the game",
      "The AI creates a mathematical pattern from the features in your images",
      "The camera takes photos automatically at random intervals",
    ],
    answer_index: 1,
    explanation:
      "Training is when the computer builds the 'Logic' or 'Pattern' based on the pixels it sees.",
    bloom_level: "Recall",
    ruah_phase: "R",
    source: "content_bank",
  },
  {
    id: "L2AI02-R8",
    type: "mcq_3",
    question: "Which gesture in our project is represented by a flat hand?",
    options: ["Snake", "Water", "Gun"],
    answer_index: 1,
    explanation:
      "In this specific project, Water is often represented by a flat, horizontal hand.",
    bloom_level: "Recall",
    ruah_phase: "R",
    source: "content_bank",
  },
] as const;

const U_QUESTIONS = [
  {
    id: "L2AI02-U1",
    type: "mcq_multi_4",
    question: "Why should we use different backgrounds when taking photos of our hand gestures?",
    options: [
      "To make the photos look pretty",
      "To help the AI focus on the hand, not the room",
      "To prevent the AI from getting confused by wall colors",
      "To make the game harder",
    ],
    correct_indices: [1, 2],
    answer_index: [1, 2],
    explanation:
      "Varied backgrounds ensure the AI learns the hand features, not the environment.",
    bloom_level: "Understanding",
    ruah_phase: "U",
    source: "content_bank",
  },
  // scenario_set L2AI02-U2 expanded into two individual questions with shared context
  {
    id: "L2AI02-U2-0",
    type: "mcq_3",
    context:
      "Your AI identifies your hand as 'Snake' with 90% confidence, but when your friend tries, the confidence drops to 40%.",
    question: "Why did the confidence drop?",
    options: [
      "The AI is tired",
      "Your friend's hand looks different from your training data",
      "The Scratch cat is blocking the camera",
    ],
    answer_index: 1,
    explanation:
      "AI models are only as good as the diversity of their training data!",
    bloom_level: "Understanding",
    ruah_phase: "U",
    source: "content_bank",
  },
  {
    id: "L2AI02-U2-1",
    type: "mcq_3",
    context:
      "Your AI identifies your hand as 'Snake' with 90% confidence, but when your friend tries, the confidence drops to 40%.",
    question: "How can you fix this for all users?",
    options: [
      "Only let you play the game",
      "Add training images of different hands (sizes/colors)",
      "Increase the volume of the game",
    ],
    answer_index: 1,
    explanation:
      "Adding diverse training images makes the model generalise to different users.",
    bloom_level: "Understanding",
    ruah_phase: "U",
    source: "content_bank",
  },
  {
    id: "L2AI02-U3",
    type: "mcq_3",
    question:
      "If you add 500 images of 'Rock' but only 5 images of 'Paper', what will happen?",
    options: [
      "The AI will be better at 'Paper'",
      "The AI will be biased toward 'Rock'",
      "The AI will crash",
    ],
    answer_index: 1,
    explanation:
      "This is called Data Bias. The AI will assume almost everything is a 'Rock' because it saw it more often.",
    bloom_level: "Understanding",
    ruah_phase: "U",
    source: "content_bank",
  },
] as const;

const A_QUESTIONS = [
  {
    id: "L2AI02-A1",
    type: "mcq_3",
    question:
      "According to the logic rules: 'Snake drinks Water, Water drowns Gun, and Gun shoots Snake'. If the AI chooses Water, what should you choose to win?",
    options: ["Gun", "Snake", "Water"],
    answer_index: 1,
    explanation: "Snake drinks Water, so Snake wins against Water!",
    bloom_level: "Application",
    ruah_phase: "A",
    source: "content_bank",
  },
  {
    id: "L2AI02-A2",
    type: "reorder",
    question:
      "Place the steps of the ML cycle in the correct order for this project:",
    // items are shown shuffled; correct sequence: Define → Collect → Train → Test
    items: [
      "Train the Model",
      "Collect Data (Images)",
      "Test and Integrate in Scratch",
      "Define Classes (Snake / Water / Gun)",
    ],
    // answer_index[i] = the display index of the item that belongs at position i
    answer_index: [3, 1, 0, 2],
    explanation:
      "First Define your classes, then Collect data, then Train the model, and finally Test and integrate!",
    bloom_level: "Application",
    ruah_phase: "A",
    source: "content_bank",
  },
] as const;

// Content bank has only 1 H question for L2AI02 Cadet; pad with AI-level questions
// so the engine can serve 6 H questions without repeating too quickly.
const H_QUESTIONS = [
  {
    id: "L2AI02-H1",
    type: "mcq_3",
    question:
      "Your game logic works, but the AI is too predictable because it uses a simple 'Pick Random' block. How would you make it 'Strategic'?",
    options: [
      "Make it pick 'Gun' every single time",
      "Have it look at the player's past moves and pick the counter-move",
      "Tell the player what the AI is going to choose",
    ],
    answer_index: 1,
    explanation:
      "Strategic AI uses data (player history) to make smarter decisions rather than pure randomness.",
    bloom_level: "Higher Order Thinking",
    ruah_phase: "H",
    source: "content_bank",
  },
  {
    id: "L2AI02-H2",
    type: "mcq_3",
    question:
      "Your AI model works well in good lighting but fails in dim light. What is the root cause?",
    options: [
      "The Scratch extension has a bug",
      "The training images were all taken in bright lighting — the model never saw dim-light hands",
      "The camera quality is too low",
    ],
    answer_index: 1,
    explanation:
      "The model learned features from bright images only. Collecting images in varied lighting conditions would fix this.",
    bloom_level: "Higher Order Thinking",
    ruah_phase: "H",
    source: "rag_gemini",
  },
  {
    id: "L2AI02-H3",
    type: "mcq_3",
    question:
      "A classmate suggests adding a 4th gesture ('Scissors') to the game. What is the FIRST thing you must do?",
    options: [
      "Immediately update the Scratch game logic",
      "Create a new class in the ML model and collect training images for it",
      "Retrain all existing classes from scratch",
    ],
    answer_index: 1,
    explanation:
      "You must define the new class and collect representative images before any retraining can happen.",
    bloom_level: "Higher Order Thinking",
    ruah_phase: "H",
    source: "rag_gemini",
  },
  {
    id: "L2AI02-H4",
    type: "true_false",
    question:
      "True or False: If a student has only one hand, they cannot build a gesture-based ML project.",
    options: ["True", "False"],
    answer_index: 1,
    explanation:
      "False! The model learns whatever visual pattern you provide. You can train it on any consistent gesture — even feet or face positions.",
    bloom_level: "Higher Order Thinking",
    ruah_phase: "H",
    source: "rag_gemini",
  },
  {
    id: "L2AI02-H5",
    type: "mcq_3",
    question:
      "After training, your 'Snake' class has 95% accuracy but 'Water' has only 55%. What should you do FIRST?",
    options: [
      "Delete the 'Water' class and start again",
      "Add more diverse training images specifically for the 'Water' class",
      "Lower the confidence threshold in Scratch so 'Water' is easier to trigger",
    ],
    answer_index: 1,
    explanation:
      "Poor accuracy on one class almost always means insufficient or non-diverse training data for that class.",
    bloom_level: "Higher Order Thinking",
    ruah_phase: "H",
    source: "rag_gemini",
  },
  {
    id: "L2AI02-H6",
    type: "mcq_3",
    question:
      "You want to teach your AI to recognize 20 different objects. Why is this harder than recognising 3 gestures?",
    options: [
      "Scratch can only handle 3 classes",
      "More classes means the AI needs far more training data per class and the decision boundary becomes more complex",
      "Machine Learning only works with hand gestures",
    ],
    answer_index: 1,
    explanation:
      "With 20 classes the model must learn finer distinctions between categories, requiring exponentially more varied examples to avoid confusion.",
    bloom_level: "Higher Order Thinking",
    ruah_phase: "H",
    source: "rag_gemini",
  },
] as const;

// Flat list used by the answer route to look up a question by id
export const QUESTIONS = [
  ...R_QUESTIONS,
  ...U_QUESTIONS,
  ...A_QUESTIONS,
  ...H_QUESTIONS,
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the next question based on current block / pair position. */
export function getNextQuestion(state: MockMissionState) {
  if (state.block === "RU") {
    return state.pairQuestion === 0
      ? R_QUESTIONS[state.rServed % R_QUESTIONS.length]
      : U_QUESTIONS[state.uServed % U_QUESTIONS.length];
  }
  if (state.block === "A") {
    return A_QUESTIONS[state.aServed % A_QUESTIONS.length];
  }
  return H_QUESTIONS[state.hCount % H_QUESTIONS.length];
}

/** Maps the internal RU/A/H block to the display label shown in the UI. */
export function getDisplayBlock(state: MockMissionState): RuahBlock {
  if (state.block === "RU") return state.pairQuestion === 0 ? "R" : "U";
  return state.block as RuahBlock;
}

/**
 * Evaluates whether a student's submitted answer is correct.
 * Matches the exact format returned by the content bank (L2AI02_Cadet.json).
 */
export function checkAnswer(question: (typeof QUESTIONS)[number], answer: any): boolean {
  switch (question.type) {
    case "mcq_3":
    case "true_false":
      // answer is the selected option index
      return Number(answer) === (question as any).answer_index;

    case "fib":
      if ((question as any).options?.length) {
        // Option-based FIB: answer is the selected index
        return Number(answer) === (question as any).answer_index;
      }
      // Text-input FIB: compare normalised strings
      return (
        String(answer).toLowerCase().trim() ===
        String((question as any).answer ?? "").toLowerCase().trim()
      );

    case "mcq_multi_4":
      // In demo mode accept any selection — graded loosely
      return true;

    case "reorder":
      // In demo mode accept any ordering — graded loosely
      return true;

    default:
      return true;
  }
}

// ── RUAH engine ──────────────────────────────────────────────────────────────
//
// Flow:
//   RU phase  → 2 questions per pair (1 R + 1 U)
//               both correct → advance to A
//               0 or 1 correct → repeat RU pair
//               total = 10 without passing → applet
//
//   A phase   → 2 questions per pair
//               both correct → advance to H
//               0 or 1 correct → repeat A pair
//               total = 10 without passing → applet
//
//   H phase   → 6 questions, all play out regardless of score → mission complete

export function advanceRuah(
  state: MockMissionState,
  isCorrect: boolean
): {
  block_advanced: boolean;
  mission_complete: boolean;
  applet_required: boolean;
  display_block: RuahBlock;
} {
  const displayBlock = getDisplayBlock(state);
  state.total++;
  if (isCorrect) state.correctTotal++;

  // ── H block: play up to 6 questions, but hard-cap total at 10 ───────────
  if (state.block === "H") {
    state.hCount++;
    const mission_complete = state.hCount >= 6 || state.total >= 10;
    if (mission_complete) state.complete = true;
    return { block_advanced: false, mission_complete, applet_required: false, display_block: "H" };
  }

  // ── RU / A: pair-based ───────────────────────────────────────────────────
  const isFirstInPair = state.pairQuestion === 0;

  if (isFirstInPair) {
    if (isCorrect) state.pairCorrect++;
    if (state.block === "RU") state.rServed++;
    else state.aServed++;
    state.pairQuestion = 1;

    if (state.total >= 10 && !state.appletTriggered) {
      state.appletTriggered = true;
      state.stuckBlock = displayBlock;
      return { block_advanced: false, mission_complete: false, applet_required: true, display_block: displayBlock };
    }
    return { block_advanced: false, mission_complete: false, applet_required: false, display_block: displayBlock };
  }

  // Second question of pair
  if (isCorrect) state.pairCorrect++;
  if (state.block === "RU") state.uServed++;
  else state.aServed++;

  const bothCorrect = state.pairCorrect >= 2;
  state.pairQuestion = 0;
  state.pairCorrect = 0;

  if (bothCorrect) {
    state.block = state.block === "RU" ? "A" : "H";
    return { block_advanced: true, mission_complete: false, applet_required: false, display_block: displayBlock };
  }

  // Pair failed — trigger applet at cap, else repeat same block
  if (state.total >= 10 && !state.appletTriggered) {
    state.appletTriggered = true;
    state.stuckBlock = displayBlock;
    return { block_advanced: false, mission_complete: false, applet_required: true, display_block: displayBlock };
  }
  return { block_advanced: false, mission_complete: false, applet_required: false, display_block: displayBlock };
}

export function getScore(state: MockMissionState): number {
  if (state.total === 0) return 0;
  return Math.round((state.correctTotal / state.total) * 100);
}
