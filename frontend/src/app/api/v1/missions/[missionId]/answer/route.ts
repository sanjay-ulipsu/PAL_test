import { NextResponse } from "next/server";
import {
  getMission,
  QUESTIONS,
  checkAnswer,
  advanceRuah,
  getScore,
  recordWrongAnswer,
} from "@/lib/mock/missionEngine";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ missionId: string }> }
) {
  const { missionId } = await params;
  const state = getMission(missionId);

  if (!state) {
    return NextResponse.json({ detail: "Mission not found" }, { status: 404 });
  }

  const body = await req.json();
  const { question_id, answer } = body;

  const question = QUESTIONS.find((q) => q.id === question_id) ?? QUESTIONS[0];
  const isCorrect = checkAnswer(question as any, answer);
  if (!isCorrect) {
    recordWrongAnswer(missionId, {
      id: question.id,
      question: question.question,
      ruah_phase: (question as any).ruah_phase ?? "R",
    });
  }
  const { block_advanced, mission_complete, applet_required, display_block } =
    advanceRuah(state, isCorrect);

  const correctAnswer =
    (question as any).answer_index ??
    (question as any).correct_indices ??
    (question as any).answer ??
    (question as any).correct_order ??
    0;

  return NextResponse.json({
    is_correct: isCorrect,
    explanation: question.explanation,
    correct_answer: correctAnswer,
    block_advanced,
    mission_complete,
    applet_required,
    ruah_state: {
      block: display_block,
      ru: state.rServed + state.uServed,
      a: state.aServed,
      h: state.hCount,
      total: state.total,
      score: getScore(state),
      ideal: block_advanced,
    },
  });
}
