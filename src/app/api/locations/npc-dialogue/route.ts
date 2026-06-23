import { NextResponse } from "next/server";
import { resolveNpcInkDialogue } from "@/game/npcDialogueService";
import { getCurrentUserId } from "@/lib/session";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }

  const body = (await request.json()) as {
    locationId?: string;
    npcId?: string;
    choicePath?: number[];
  };

  const locationId = typeof body.locationId === "string" ? body.locationId.trim() : "";
  const npcId = typeof body.npcId === "string" ? body.npcId.trim() : "";
  const choicePath = Array.isArray(body.choicePath)
    ? body.choicePath.filter((value): value is number => typeof value === "number" && Number.isInteger(value))
    : [];

  if (!locationId || !npcId) {
    return NextResponse.json({ ok: false, message: "缺少 locationId 或 npcId" }, { status: 400 });
  }

  const result = await resolveNpcInkDialogue({
    locationId,
    npcId,
    choicePath,
    userId,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
