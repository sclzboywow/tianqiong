import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { joinTask } from "@/game/taskEngine";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  try {
    const participant = await joinTask(id, userId);
    return NextResponse.json({ participant });
  } catch (error) {
    const message = error instanceof Error ? error.message : "加入失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
