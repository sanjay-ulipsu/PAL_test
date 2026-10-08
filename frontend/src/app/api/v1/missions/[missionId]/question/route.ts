import { NextResponse } from "next/server";
import { getMission, getNextQuestion } from "@/lib/mock/missionEngine";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ missionId: string }> }
) {
  const { missionId } = await params;
  const state = getMission(missionId);

  if (!state) {
    return NextResponse.json({ detail: "Mission not found" }, { status: 404 });
  }

  return NextResponse.json(getNextQuestion(state));
}
