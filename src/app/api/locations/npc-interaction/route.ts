import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { writeGameLog } from "@/game/logEngine";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  const body = (await request.json()) as { logContent?: string };
  const logContent = typeof body.logContent === "string" ? body.logContent.trim() : "";

  if (!logContent) {
    return NextResponse.json({ ok: false, message: "无效的互动记录" }, { status: 400 });
  }

  await writeGameLog({
    userId: userId ?? undefined,
    logType: "SYSTEM",
    content: logContent,
  });

  return NextResponse.json({ ok: true, message: "互动已记录" });
}
