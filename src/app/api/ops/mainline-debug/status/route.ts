import { NextResponse } from "next/server";
import { requireOpsDebugAccess } from "@/lib/opsDebugAccess";
import { getMainlineDebugStatus } from "@/game/mainlineDebugEngine";

export async function GET() {
  const auth = await requireOpsDebugAccess();
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
