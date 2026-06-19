import { NextResponse } from "next/server";
import { requireOpsDebugAccess } from "@/lib/opsDebugAccess";
import { resetMainlineDebugState } from "@/game/mainlineDebugEngine";

export async function POST() {
  const auth = await requireOpsDebugAccess();
  if ("error" in auth) return auth.error;

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
