import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { getMainlineDebugStatus } from "@/game/mainlineDebugEngine";

async function requireAuth() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { error: NextResponse.json({ error: "未登录" }, { status: 401 }) };
  }
  return { userId };
}

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const status = await getMainlineDebugStatus();
    return NextResponse.json({ ok: true, ...status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取状态失败" },
      { status: 500 },
    );
  }
}
