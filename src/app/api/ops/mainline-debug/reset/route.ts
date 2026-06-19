import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { resetMainlineDebugState } from "@/game/mainlineDebugEngine";

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const result = await resetMainlineDebugState();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "重置失败" },
      { status: 500 },
    );
  }
}
