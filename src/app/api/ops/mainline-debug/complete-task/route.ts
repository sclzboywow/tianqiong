import { NextResponse } from "next/server";
import { requireOpsDebugAccess } from "@/lib/opsDebugAccess";
import { completeMainlineTaskBySlug } from "@/game/mainlineDebugEngine";

export async function POST(request: Request) {
  const auth = await requireOpsDebugAccess();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const taskSlug = body?.taskSlug?.trim();
    if (!taskSlug) {
      return NextResponse.json({ error: "缺少 taskSlug" }, { status: 400 });
    }

    const result = await completeMainlineTaskBySlug(taskSlug, auth.userId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "完成任务失败" },
      { status: 400 },
    );
  }
}
