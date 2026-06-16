import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { executeLocationAction } from "@/game/locationActionEngine";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; actionId: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id, actionId } = await params;

  try {
    const result = await executeLocationAction(id, actionId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "行动执行失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
