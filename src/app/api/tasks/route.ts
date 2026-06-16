import { NextResponse } from "next/server";
import { listTasks } from "@/game/taskEngine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const tasks = await listTasks(status || undefined);
  return NextResponse.json({ tasks });
}
