import { NextResponse } from "next/server";
import { z } from "zod";
import { loadProjectFlowNode } from "@/game/projectFlowLoader";
import {
  deleteProjectFlowNode,
  disableProjectFlowNode,
  enableProjectFlowNode,
  getProjectFlowNodeDeletePreview,
} from "@/game/projectFlowNodeDelete";
import { requireOpsAccess } from "@/lib/opsDebugAccess";

type RouteParams = { params: Promise<{ slug: string }> };

const patchSchema = z.object({
  enabled: z.boolean(),
  scope: z.literal("node"),
});

const deleteSchema = z.object({
  confirmSlug: z.string().trim(),
  deleteStories: z.boolean().optional().default(false),
});

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

export async function PATCH(request: Request, { params }: RouteParams) {
  const access = await requireOpsAccess();
  if (access.error) return access.error;

  const { slug } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "请求参数无效",
        issues: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  try {
    const result = parsed.data.enabled
      ? await enableProjectFlowNode(slug)
      : await disableProjectFlowNode(slug);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "操作失败" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const access = await requireOpsAccess();
  if (access.error) return access.error;

  const { slug } = await params;
  const parsed = deleteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "请求参数无效",
        issues: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  if (parsed.data.confirmSlug !== slug) {
    return NextResponse.json(
      { error: "确认标识与当前节点不一致，无法删除" },
      { status: 400 },
    );
  }

  try {
    const preview = await getProjectFlowNodeDeletePreview(slug);
    if (!preview.validation.ok) {
      return NextResponse.json(
        {
          error: "存在引用，无法删除",
          blockers: preview.validation.blockers,
          warnings: preview.validation.warnings,
        },
        { status: 400 },
      );
    }

    const result = await deleteProjectFlowNode(slug, {
      deleteStories: parsed.data.deleteStories,
    });
    return NextResponse.json(result);
  } catch (error) {
    const blockers =
      error instanceof Error
        ? (error as Error & { blockers?: unknown }).blockers
        : undefined;
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "删除失败",
        blockers,
      },
      { status: 400 },
    );
  }
}
