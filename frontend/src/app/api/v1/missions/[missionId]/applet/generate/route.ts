import { NextResponse } from "next/server";
import { getMission } from "@/lib/mock/missionEngine";

// ILM topic descriptions used in the Gemini prompt
const ILM_TOPICS: Record<string, string> = {
  L2AI02: "Rock Paper Scissors AI — teaching a computer to recognise hand gestures (Snake / Water / Gun) using Supervised Machine Learning in Scratch",
};

const BLOCK_NAMES: Record<string, string> = {
  R: "Recall (basic vocabulary and facts)",
  U: "Understanding (applying concepts step by step)",
  A: "Application (using knowledge in a real scenario)",
  H: "Higher Order Thinking (analyse, evaluate, create)",
};

// ── Static fallback when Gemini is unavailable ───────────────────────────────
// misconception_drill: streak-based two-choice drill (generalised FractionRevisionApplet)

const ML_MISCONCEPTION_DRILL = {
  type: "misconception_drill",
  title: "AI Concept Quick Check",
  description: "Tap A or B for each question. Get 2 correct in a row to continue.",
  content: {
    misconception: "Mixing up how the AI learns from labelled data and what each ML term means",
    topic: "Rock Paper Scissors AI",
    instruction: "Read each scenario and tap A or B — which one is correct?",
    target: 2,
    questions: [
      {
        prompt: "We teach our AI to sort gestures into Snake, Water, and Gun. What is each of these called?",
        choices: [
          { label: "A Class — a labelled bucket for similar training images", tag: "A" },
          { label: "A Feature — a pixel pattern the camera picks up", tag: "B" },
        ],
        answer: "A",
        explanation: "Each gesture is a class — the category the model sorts new inputs into.",
      },
      {
        prompt: "In Supervised Learning, how does the AI improve during training?",
        choices: [
          { label: "It randomly changes its settings and hopes for the best", tag: "A" },
          { label: "It compares its predictions to the correct labels we provided", tag: "B" },
        ],
        answer: "B",
        explanation: "Supervised learning uses labelled examples — the AI sees the correct answer and adjusts.",
      },
      {
        prompt: "Your 'Snake' class gets 90% confidence but 'Water' only gets 50%. What should you do first?",
        choices: [
          { label: "Collect more varied training images specifically for the 'Water' class", tag: "A" },
          { label: "Delete 'Water' and train the model again from scratch", tag: "B" },
        ],
        answer: "A",
        explanation: "Low accuracy on one class usually means that class needs more diverse training data.",
      },
      {
        prompt: "Your model works well in bright light but fails at night. Why?",
        choices: [
          { label: "Cameras always malfunction in low light — it's a hardware problem", tag: "A" },
          { label: "The training images were all taken in bright light, so the model never learned dim-light hands", tag: "B" },
        ],
        answer: "B",
        explanation: "The model only knows what it was trained on — varied lighting in training data fixes this.",
      },
    ],
  },
};

// ── Gemini generation ────────────────────────────────────────────────────────

async function generateWithGemini(
  ilmId: string,
  stuckBlock: string,
  wrongQuestions: Array<{ id: string; question: string; ruah_phase: string }>
): Promise<object | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-new-key-here") return null;

  const topic = ILM_TOPICS[ilmId] ?? `ILM ${ilmId}`;
  const blockName = BLOCK_NAMES[stuckBlock] ?? BLOCK_NAMES.A;

  const wrongSection =
    wrongQuestions.length > 0
      ? `Questions answered INCORRECTLY (use these to identify the specific gap):\n` +
        wrongQuestions
          .slice(0, 5)
          .map((q, i) => `${i + 1}. [${q.ruah_phase}] "${q.question}"`)
          .join("\n")
      : `The student struggled in the ${blockName} block.`;

  const prompt = `You are an adaptive learning AI for PAL2, an educational platform for school students.

A student completed a mission on: "${topic}"
Block where they needed help: ${blockName}

${wrongSection}

Generate a "misconception drill" — exactly 4 short questions targeting the specific gap above.
Each question must have exactly 2 choices (tagged "A" and "B"). The student needs 2 correct-in-a-row to unlock continue.

Respond ONLY with valid JSON (no markdown fences) matching this exact schema:
{
  "type": "misconception_drill",
  "title": "<5-6 word title>",
  "description": "Tap A or B for each question. Get 2 correct in a row to continue.",
  "content": {
    "misconception": "<one sentence: the specific conceptual gap>",
    "topic": "${topic.split("—")[0].trim()}",
    "instruction": "Read each scenario and tap A or B",
    "target": 2,
    "questions": [
      {
        "prompt": "<clear, specific question — max 30 words>",
        "choices": [
          { "label": "<option A — max 15 words>", "tag": "A" },
          { "label": "<option B — max 15 words>", "tag": "B" }
        ],
        "answer": "A",
        "explanation": "<one sentence: why this answer is correct>"
      }
    ]
  }
}

Make it appropriate for 12–13 year olds. Keep language concrete and simple. Make exactly 4 questions.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 1200 },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const clean = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ missionId: string }> }
) {
  const { missionId } = await params;
  const state = getMission(missionId);
  const stuckBlock = state?.stuckBlock ?? "A";
  const ilmId = state?.ilmId ?? "L2AI02";
  const wrongQuestions = state?.wrongQuestions ?? [];

  const geminiApplet = await generateWithGemini(ilmId, stuckBlock, wrongQuestions);
  const applet = geminiApplet ?? ML_MISCONCEPTION_DRILL;

  return NextResponse.json(applet);
}
