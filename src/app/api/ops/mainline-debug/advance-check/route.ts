import { NextResponse } from "next/server";
import { requireOpsDebugAccess } from "@/lib/opsDebugAccess";
import { getMainlineAdvanceCheck } from "@/game/mainlineDebugEngine";

export async function GET() {
  const auth = await requireOpsDebugAccess();
  if ("error" in auth) return auth.error;

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
