import { NextResponse } from "next/server";
import { z } from "zod";
import {
  artifactDefaults,
  getOpsPayloadContext,
  refreshProjectFlowCaches,
  resolveTaskArea,
  upsertPayloadDoc,
  validateProjectFlowReferences,
  validationErrorResponse,
} from "@/game/projectFlowNodeMutations";
import { resolveMainlineNode } from "@/game/projectFlowNodeResolver";
import { requireOpsAccess } from "@/lib/opsDebugAccess";

const schema = z.object({
  title: z.string().trim().min(2, "请填写流程任务名称"),
  description: z.string().trim().min(2, "请填写任务说明"),
  stage: z.string().trim(),
  npcNames: z.array(z.string().trim()).default([]),
  inputArtifacts: z
    .array(
      z.object({
        artifactSlug: z.string().trim(),
        minStatus: z.string().trim(),
      }),
    )
    .default([]),
  outputArtifacts: z
    .array(
      z.object({
        artifactSlug: z.string().trim(),
        status: z.string().trim(),
      }),
    )
    .default([]),
  milestoneKeys: z.array(z.string().trim()).default([]),
  prerequisiteTaskSlugs: z.array(z.string().trim()).default([]),
  storySlug: z.string().trim().optional(),
  inkFile: z.string().trim().optional(),
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
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const { studio, detail, existingTask } = resolved;

  const primaryStory = detail.node.stories[0];
  const storySlug =
    input.storySlug || primaryStory?.slug || existingTask?.storySlug || `story_${slug}`;
  const issues = validateProjectFlowReferences(studio, {
    slug,
    stage: input.stage,
    npcNames: input.npcNames,
    inputArtifacts: input.inputArtifacts,
    outputArtifacts: input.outputArtifacts,
    milestoneKeys: input.milestoneKeys,
    prerequisiteTaskSlugs: input.prerequisiteTaskSlugs,
    storySlug,
  });
  if (issues.length) {
    return NextResponse.json(validationErrorResponse(issues), { status: 400 });
  }

  const primaryAction = detail.node.actionSlugs[0];
  const locationSlug = primaryAction
    ? studio.locationActions.find((action) => action.id === primaryAction.slug)?.locationId
    : undefined;
  const taskArea = locationSlug
    ? resolveTaskArea(studio, slug, locationSlug)
    : existingTask?.area;

  const { inputArtifacts, outputArtifacts } = artifactDefaults(
    studio,
    input.inputArtifacts,
    input.outputArtifacts,
  );

  const ctx = await getOpsPayloadContext();
  try {
    const result = await upsertPayloadDoc(
      ctx.payload,
      ctx.req,
      "task-templates",
      slug,
      {
        category: "mainline",
        slug,
        title: input.title,
        description: input.description,
        rarity: existingTask?.rarity || "R",
        stage: input.stage,
        sourceType: existingTask?.sourceType || "project_flow",
        sourceName: existingTask?.sourceName || "项目流程编排器",
        area: taskArea,
        npcList: input.npcNames.map((npc) => ({ npc })),
        requiredCount: existingTask?.requiredCount || 1,
        inkFile: input.inkFile || existingTask?.inkFile || primaryStory?.inkFile,
        storySlug,
        baseSuccessRate: existingTask?.baseSuccessRate ?? 100,
        successEffects: existingTask?.successEffects || { stageProgress: 5 },
        milestoneEffects: Object.fromEntries(
          input.milestoneKeys.map((key) => [key, true]),
        ),
        milestoneEffectList: input.milestoneKeys.map((milestone) => ({
          milestone,
          value: true,
        })),
        prerequisiteTaskSlugs: input.prerequisiteTaskSlugs.map((taskSlug) => ({
          slug: taskSlug,
        })),
        inputArtifacts,
        outputArtifacts,
        blockPolicy: existingTask?.blockPolicy || "hard_block",
        enabled: true,
      },
    );

    if (ctx.transactionStarted) await ctx.commitTransaction(ctx.req);
    refreshProjectFlowCaches(slug);
    return NextResponse.json({ ok: true, task: result });
  } catch (error) {
    if (ctx.transactionStarted) await ctx.killTransaction(ctx.req);
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存流程任务失败" },
      { status: 500 },
    );
  }
}
