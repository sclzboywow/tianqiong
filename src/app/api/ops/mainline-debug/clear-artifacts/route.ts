import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { clearMainlineArtifacts } from "@/game/mainlineDebugEngine";

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

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
