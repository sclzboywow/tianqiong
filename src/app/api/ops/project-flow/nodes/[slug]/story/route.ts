import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOpsPayloadContext,
  refreshProjectFlowCaches,
  upsertPayloadDoc,
  validateProjectFlowReferences,
  validationErrorResponse,
} from "@/game/projectFlowNodeMutations";
import { resolveMainlineNode } from "../route";
import { requireOpsAccess } from "@/lib/opsDebugAccess";

const schema = z.object({
  storySlug: z.string().trim().optional(),
  title: z.string().trim().min(2, "请填写剧情标题"),
  description: z.string().trim(),
  inkFile: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]+$/, "Ink 文件名只能包含小写字母、数字和下划线")
    .optional(),
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

  const primaryStory = detail.node.stories[0];
  const storySlug = input.storySlug || primaryStory?.slug || `story_${slug}`;
  const existingStory = studio.storyEntries.find((story) => story.slug === storySlug);
  const primaryAction = detail.node.actionSlugs[0];
  const locationSlug = primaryAction
    ? studio.locationActions.find((action) => action.id === primaryAction.slug)?.locationId
    : undefined;
  const eventSlugs = detail.node.events
    .filter((event) => event.enabled !== false)
    .map((event) => event.slug);

  const issues = validateProjectFlowReferences(studio, {
    slug,
    stage: detail.node.stage || detail.stageId,
    locationSlug: locationSlug || undefined,
    npcNames: detail.node.npcNames,
    inputArtifacts: [],
    outputArtifacts: [],
    milestoneKeys: [],
    storySlug,
  });
  if (issues.length) {
    return NextResponse.json(validationErrorResponse(issues), { status: 400 });
  }

  const inkFile = input.inkFile || existingStory?.inkFile || primaryStory?.inkFile || slug;
  const ctx = await getOpsPayloadContext();
  try {
    const storyResult = await upsertPayloadDoc(
      ctx.payload,
      ctx.req,
      "story-entries",
      storySlug,
      {
        slug: storySlug,
        title: input.title,
        description: input.description,
        storyType: existingStory?.storyType || "task_story",
        status: existingStory?.status || "draft",
        inkFile,
        stage: detail.node.stage || detail.stageId,
        relatedLocationSlugs: locationSlug ? [{ slug: locationSlug }] : [],
        relatedTaskSlugs: [{ slug }],
        relatedEventSlugs: eventSlugs.map((eventSlug) => ({ slug: eventSlug })),
        relatedNpcNames: detail.node.npcNames.map((name) => ({ name })),
        previewText: input.description || detail.node.description,
        enabled: true,
      },
    );

    await upsertPayloadDoc(ctx.payload, ctx.req, "task-templates", slug, {
      storySlug,
      inkFile,
    });

    if (ctx.transactionStarted) await ctx.commitTransaction(ctx.req);
    refreshProjectFlowCaches(slug);
    return NextResponse.json({ ok: true, story: storyResult, inkFile });
  } catch (error) {
    if (ctx.transactionStarted) await ctx.killTransaction(ctx.req);
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存剧情片段失败" },
      { status: 500 },
    );
  }
}
