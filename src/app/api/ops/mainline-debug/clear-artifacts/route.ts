import { NextResponse } from "next/server";
import { requireOpsDebugAccess } from "@/lib/opsDebugAccess";
import { clearMainlineArtifacts } from "@/game/mainlineDebugEngine";

export async function POST() {
  const auth = await requireOpsDebugAccess();
  if ("error" in auth) return auth.error;

  try {
    const result = await clearMainlineArtifacts();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "清空成果物失败" },
      { status: 500 },
    );
  }
}
