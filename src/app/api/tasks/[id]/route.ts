import { NextResponse } from "next/server";
import { getTaskById } from "@/game/taskEngine";
import { createStory, getStoryState } from "@/ink/inkRunner";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTaskById(id);
  if (!task) return NextResponse.json({ error: "任务不存在" }, { status: 404 });

  let story = null;
  try {
    const inkStory = createStory(task.inkFile);
    const choiceEffects = JSON.parse(task.choiceEffects || "{}") as Record<string, unknown>;
    const choiceIds = Object.keys(choiceEffects);
    story = getStoryState(inkStory, choiceIds);
  } catch {
    story = { lines: [task.description || "暂无剧情"], choices: [], ended: true };
  }

  return NextResponse.json({ task, story });
}
