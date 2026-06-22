import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOpsPayloadContext,
  refreshProjectFlowCaches,
  resolveTaskArea,
  upsertPayloadDoc,
  validateProjectFlowReferences,
  validationErrorResponse,
} from "@/game/projectFlowNodeMutations";
import { resolveMainlineNode } from "../route";
import { requireOpsAccess } from "@/lib/opsDebugAccess";

const schema = z.object({
  actionSlug: z.string().trim().optional(),
  label: z.string().trim().min(2, "请填写地点行动名称"),
  description: z.string().trim().min(2, "请填写地点行动说明"),
  locationSlug: z.string().trim().min(1, "请选择办理地点"),
  npcNames: z.array(z.string().trim()).default([]),
});

type RouteParams = { params: Promise<{ slug: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const access = await requireOpsAccess();
  if (access.error) return access.error;

  const { slug } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "保存前校验未通过",
        issues: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const resolved = await resolveMainlineNode(slug);
  if (!resolved.ok) return resolved.response;
  const { studio, detail, existingTask } = resolved;

  const actionSlug =
    input.actionSlug || detail.node.actionSlugs[0]?.slug || `action_${slug}`;
  const existingAction = studio.locationActions.find((action) => action.id === actionSlug);
  const primaryStory = detail.node.stories[0];

  const issues = validateProjectFlowReferences(studio, {
    slug,
    stage: detail.node.stage || detail.stageId,
    locationSlug: input.locationSlug,
    npcNames: input.npcNames,
    inputArtifacts: [],
    outputArtifacts: [],
    milestoneKeys: [],
    actionSlug,
    storySlug: primaryStory?.slug || existingTask?.storySlug,
  });
  if (issues.length) {
    return NextResponse.json(validationErrorResponse(issues), { status: 400 });
  }

  const taskArea = resolveTaskArea(studio, slug, input.locationSlug);
  const ctx = await getOpsPayloadContext();
  try {
    const result = await upsertPayloadDoc(
      ctx.payload,
      ctx.req,
      "location-actions",
      actionSlug,
      {
        slug: actionSlug,
        label: input.label,
        description: input.description,
        locationSlug: input.locationSlug,
        unlockStage: detail.node.stage || detail.stageId,
        triggerTaskSlugs: [{ slug }],
        storySlug: primaryStory?.slug || existingTask?.storySlug,
        relatedNpcNames: input.npcNames.map((name) => ({ name })),
        resultText: existingAction?.resultText || `已发起“${detail.node.title}”流程任务。`,
        noTaskText:
          existingAction?.noTaskText || "该流程任务已在推进中，无需重复发起。",
        enabled: true,
      },
    );

    if (existingTask && taskArea && existingTask.area !== taskArea) {
      await upsertPayloadDoc(ctx.payload, ctx.req, "task-templates", slug, {
        area: taskArea,
      });
    }

    if (ctx.transactionStarted) await ctx.commitTransaction(ctx.req);
    refreshProjectFlowCaches(slug);
    return NextResponse.json({ ok: true, action: result });
  } catch (error) {
    if (ctx.transactionStarted) await ctx.killTransaction(ctx.req);
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存地点行动失败" },
      { status: 500 },
    );
  }
}
