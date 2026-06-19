import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { completeMainlineTaskBySlug } from "@/game/mainlineDebugEngine";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await request.json();
    const taskSlug = body?.taskSlug?.trim();
    if (!taskSlug) {
      return NextResponse.json({ error: "缺少 taskSlug" }, { status: 400 });
    }

    const result = await completeMainlineTaskBySlug(taskSlug, userId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "完成任务失败" },
      { status: 400 },
    );
  }
}
