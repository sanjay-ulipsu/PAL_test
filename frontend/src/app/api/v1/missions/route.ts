import { NextResponse } from "next/server";
import { createMission } from "@/lib/mock/missionEngine";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ilmId: string = body?.ilm_id ?? "L2AI02";
  const missionId = `demo-mission-${Date.now()}`;
  createMission(missionId, ilmId);
  return NextResponse.json({ mission_id: missionId });
}
