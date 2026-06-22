import { NextResponse } from "next/server";
import { loadContentStudioData } from "@/game/contentStudioLoader";
import { loadProjectFlowNode } from "@/game/projectFlowLoader";
import { requireOpsAccess } from "@/lib/opsDebugAccess";

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const access = await requireOpsAccess();
  if (access.error) return access.error;

  const { slug } = await params;
  const detail = await loadProjectFlowNode(slug);
  if (!detail) {
    return NextResponse.json({ error: "流程节点不存在" }, { status: 404 });
  }

  return NextResponse.json(detail);
}

export async function resolveMainlineNode(slug: string) {
  const studio = await loadContentStudioData();
  const detail = await loadProjectFlowNode(slug);
  if (!detail) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "流程节点不存在" }, { status: 404 }),
    };
  }
  const existingTask = studio.taskTemplates.find((task) => task.slug === slug);
  if (existingTask && existingTask.category !== "mainline") {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "该标识已被非主线任务占用，不能通过流程编排编辑" },
        { status: 400 },
      ),
    };
  }
  return { ok: true as const, studio, detail, existingTask };
}
