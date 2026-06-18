import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { executeNpcInteraction } from "@/game/npcInteractionService";
import { sanitizePlayerLogContent } from "@/game/taskEffectPlayerDisplay";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }

  const body = (await request.json()) as {
    locationId?: string;
    npcId?: string;
    interaction?: string;
  };

  const locationId = typeof body.locationId === "string" ? body.locationId.trim() : "";
  const npcId = typeof body.npcId === "string" ? body.npcId.trim() : "";
  const interaction = typeof body.interaction === "string" ? body.interaction.trim() : "";

  if (!locationId || !npcId || !interaction) {
    return NextResponse.json({ ok: false, message: "缺少 locationId、npcId 或 interaction" }, { status: 400 });
  }

  const result = await executeNpcInteraction({
    locationId,
    npcId,
    interaction,
    userId,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: result.entries?.length ? 200 : 400 });
  }

  if (result.log) {
    return NextResponse.json({
      ...result,
      log: {
        ...result.log,
        content: sanitizePlayerLogContent(result.log.content),
      },
    });
  }

  return NextResponse.json(result);
}
