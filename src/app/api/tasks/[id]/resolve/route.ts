import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { resolveChoice } from "@/game/taskEngine";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json();
    const choiceId = body?.choiceId;
    if (!choiceId || typeof choiceId !== "string") {
      return NextResponse.json({ error: "缺少 choiceId" }, { status: 400 });
    }

    const result = await resolveChoice(id, userId, choiceId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "结算失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
