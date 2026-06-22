import { loadContentStudioData } from "./contentStudioLoader";
import { loadProjectFlowNode } from "./projectFlowLoader";
import type { TaskTemplateData } from "./types";

export type ResolveMainlineNodeSuccess = {
  ok: true;
  studio: Awaited<ReturnType<typeof loadContentStudioData>>;
  detail: NonNullable<Awaited<ReturnType<typeof loadProjectFlowNode>>>;
  existingTask?: TaskTemplateData;
};

export type ResolveMainlineNodeFailure = {
  ok: false;
  status: 404 | 400;
  error: string;
};

export type ResolveMainlineNodeResult =
  | ResolveMainlineNodeSuccess
  | ResolveMainlineNodeFailure;

export async function resolveMainlineNode(
  slug: string,
): Promise<ResolveMainlineNodeResult> {
  const studio = await loadContentStudioData();
  const detail = await loadProjectFlowNode(slug);
  if (!detail) {
    return { ok: false, status: 404, error: "流程节点不存在" };
  }

  const existingTask = studio.taskTemplates.find((task) => task.slug === slug);
  if (existingTask && existingTask.category !== "mainline") {
    return {
      ok: false,
      status: 400,
      error: "该标识已被非主线任务占用，不能通过流程编排编辑",
    };
  }

  return { ok: true, studio, detail, existingTask };
}
