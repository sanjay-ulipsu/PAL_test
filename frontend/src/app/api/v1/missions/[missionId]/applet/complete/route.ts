import { NextResponse } from "next/server";
import { getMission } from "@/lib/mock/missionEngine";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ missionId: string }> }
) {
  const { missionId } = await params;
  const state = getMission(missionId);
  if (state) {
    state.appletDone = true;
    state.complete = true;
  }
  return NextResponse.json({ success: true });
}
