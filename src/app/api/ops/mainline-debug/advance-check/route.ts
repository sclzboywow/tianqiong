import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { getMainlineAdvanceCheck } from "@/game/mainlineDebugEngine";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const result = await getMainlineAdvanceCheck();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "检查失败" },
      { status: 500 },
    );
  }
}
