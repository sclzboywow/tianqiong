import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOpsPayloadContext,
  refreshProjectFlowCaches,
  upsertPayloadDoc,
  validateProjectFlowReferences,
  validationErrorResponse,
} from "@/game/projectFlowNodeMutations";
import { resolveMainlineNode, type ResolveMainlineNodeSuccess } from "@/game/projectFlowNodeResolver";
import { loadOpsStudioSnapshot } from "@/game/opsStudioLoader";
import { requireOpsAccess } from "@/lib/opsDebugAccess";
import type { StoryEntryData } from "@/game/types";

const schema = z.object({
  mode: z.enum(["bind", "update", "clone"]).optional().default("update"),
  storySlug: z.string().trim().optional(),
  title: z.string().trim().min(2, "请填写剧情标题").optional(),
  description: z.string().trim().optional(),
  inkFile: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]+$/, "Ink 文件名只能包含小写字母、数字和下划线")
    .optional(),
  status: z.enum(["draft", "published"]).optional(),
  estimatedMinutes: z.number().int().min(0).optional(),
  tags: z.array(z.string().trim()).optional(),
  relatedNpcNames: z.array(z.string().trim()).optional(),
  updateStoryEntryOnBind: z.boolean().optional().default(false),
  cloneFromStorySlug: z.string().trim().optional(),
});

type RouteParams = { params: Promise<{ slug: string }> };

function toSlugPayload(slugs: string[]) {
  return slugs.map((slug) => ({ slug }));
}

function toNamePayload(names: string[]) {
  return names.map((name) => ({ name }));
}

function toTagPayload(tags: string[]) {
  return tags.map((tag) => ({ tag }));
}

function buildStoryRelations(
  detail: ResolveMainlineNodeSuccess["detail"],
  studio: ResolveMainlineNodeSuccess["studio"],
  slug: string,
  npcNames: string[],
) {
  const primaryAction = detail.node.actionSlugs[0];
  const locationSlug = primaryAction
    ? studio.locationActions.find((action) => action.id === primaryAction.slug)
        ?.locationId
    : undefined;
  const eventSlugs = detail.node.events
    .filter((event) => event.enabled !== false)
    .map((event) => event.slug);

  return {
    locationSlug,
    eventSlugs,
    npcNames: npcNames.length ? npcNames : detail.node.npcNames,
    stage: detail.node.stage || detail.stageId,
  };
}

function storyPayloadFromSource(
  source: StoryEntryData,
  storySlug: string,
  relations: ReturnType<typeof buildStoryRelations>,
  slug: string,
  overrides: {
    title?: string;
    description?: string;
    inkFile?: string;
    status?: StoryEntryData["status"];
    estimatedMinutes?: number;
    tags?: string[];
    relatedNpcNames?: string[];
  },
) {
  return {
    slug: storySlug,
    title: overrides.title ?? source.title,
    description: overrides.description ?? source.description ?? "",
    storyType: source.storyType || "task_story",
    status: overrides.status ?? source.status ?? "draft",
    inkFile: overrides.inkFile ?? source.inkFile,
    stage: relations.stage,
    relatedLocationSlugs: relations.locationSlug
      ? [{ slug: relations.locationSlug }]
      : (source.relatedLocationSlugs || []).map((item) => ({ slug: item })),
    relatedTaskSlugs: [{ slug }],
    relatedEventSlugs: relations.eventSlugs.map((eventSlug) => ({ slug: eventSlug })),
    relatedNpcNames: toNamePayload(
      overrides.relatedNpcNames ?? relations.npcNames,
    ),
    tags: toTagPayload(overrides.tags ?? source.tags ?? []),
    estimatedMinutes: overrides.estimatedMinutes ?? source.estimatedMinutes,
    previewText: overrides.description ?? source.description ?? detailPreview(source),
    enabled: source.enabled !== false,
  };
}

function detailPreview(source: StoryEntryData) {
  return source.previewText || source.description || "";
}

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
  const { studio, detail } = resolved;
  const opsStudio = await loadOpsStudioSnapshot();

  const primaryStory = detail.node.stories[0];
  const mode = input.mode;
  const storySlug =
    input.storySlug || primaryStory?.slug || `story_${slug}`;
  const relations = buildStoryRelations(detail, studio, slug, input.relatedNpcNames || []);

  const issues = validateProjectFlowReferences(studio, {
    slug,
    stage: relations.stage,
    locationSlug: relations.locationSlug,
    npcNames: relations.npcNames,
    inputArtifacts: [],
    outputArtifacts: [],
    milestoneKeys: [],
    storySlug,
    storyBindingMode: mode,
  });
  if (issues.length) {
    return NextResponse.json(validationErrorResponse(issues), { status: 400 });
  }

  const ctx = await getOpsPayloadContext();

  try {
    if (mode === "bind") {
      const targetStory = opsStudio.storyEntries.find((story) => story.slug === storySlug);
      const storyDocId = opsStudio.storyEntryDocIds[storySlug];
      if (!targetStory || storyDocId == null) {
        return NextResponse.json({ error: "剧情入口不存在" }, { status: 400 });
      }

      const relatedTaskSlugs = [
        ...new Set([...(targetStory.relatedTaskSlugs || []), slug]),
      ];

      if (input.updateStoryEntryOnBind) {
        if (!input.title?.trim()) {
          return NextResponse.json({ error: "绑定并更新时需要填写剧情标题" }, { status: 400 });
        }
        await ctx.payload.update({
          collection: "story-entries",
          id: storyDocId,
          data: {
            ...storyPayloadFromSource(targetStory, storySlug, relations, slug, {
              title: input.title,
              description: input.description,
              inkFile: input.inkFile,
              status: input.status,
              estimatedMinutes: input.estimatedMinutes,
              tags: input.tags,
              relatedNpcNames: input.relatedNpcNames,
            }),
            relatedTaskSlugs: toSlugPayload(relatedTaskSlugs),
          },
          req: ctx.req,
        });
      } else {
        await ctx.payload.update({
          collection: "story-entries",
          id: storyDocId,
          data: { relatedTaskSlugs: toSlugPayload(relatedTaskSlugs) },
          req: ctx.req,
        });
      }

      await upsertPayloadDoc(ctx.payload, ctx.req, "task-templates", slug, {
        storySlug,
        inkFile: input.inkFile || targetStory.inkFile,
      });
    } else if (mode === "clone") {
      const sourceSlug =
        input.cloneFromStorySlug || primaryStory?.slug || storySlug;
      const source =
        opsStudio.storyEntries.find((story) => story.slug === sourceSlug) ||
        opsStudio.storyEntries.find((story) => story.slug === storySlug);
      if (!source) {
        return NextResponse.json({ error: "找不到要复制的剧情入口" }, { status: 400 });
      }
      if (!input.title?.trim()) {
        return NextResponse.json({ error: "请填写剧情标题" }, { status: 400 });
      }
      const newSlug = storySlug;
      if (
        opsStudio.storyEntries.some(
          (story) => story.slug === newSlug && story.slug !== source.slug,
        )
      ) {
        return NextResponse.json(
          { error: `剧情入口 ${newSlug} 已存在，请修改剧情入口标识` },
          { status: 400 },
        );
      }

      const inkFile = input.inkFile || source.inkFile;
      await upsertPayloadDoc(
        ctx.payload,
        ctx.req,
        "story-entries",
        newSlug,
        storyPayloadFromSource(source, newSlug, relations, slug, {
          title: input.title,
          description: input.description,
          inkFile,
          status: input.status,
          estimatedMinutes: input.estimatedMinutes,
          tags: input.tags,
          relatedNpcNames: input.relatedNpcNames,
        }),
      );

      await upsertPayloadDoc(ctx.payload, ctx.req, "task-templates", slug, {
        storySlug: newSlug,
        inkFile,
      });
    } else {
      const existingStory = opsStudio.storyEntries.find((story) => story.slug === storySlug);
      if (!input.title?.trim()) {
        return NextResponse.json({ error: "请填写剧情标题" }, { status: 400 });
      }
      const inkFile =
        input.inkFile || existingStory?.inkFile || primaryStory?.inkFile || slug;

      await upsertPayloadDoc(
        ctx.payload,
        ctx.req,
        "story-entries",
        storySlug,
        {
          slug: storySlug,
          title: input.title,
          description: input.description ?? "",
          storyType: existingStory?.storyType || "task_story",
          status: input.status || existingStory?.status || "draft",
          inkFile,
          stage: relations.stage,
          relatedLocationSlugs: relations.locationSlug
            ? [{ slug: relations.locationSlug }]
            : [],
          relatedTaskSlugs: toSlugPayload([slug]),
          relatedEventSlugs: relations.eventSlugs.map((eventSlug) => ({ slug: eventSlug })),
          relatedNpcNames: toNamePayload(relations.npcNames),
          tags: toTagPayload(input.tags || existingStory?.tags || []),
          estimatedMinutes: input.estimatedMinutes ?? existingStory?.estimatedMinutes,
          previewText: input.description || detail.node.description,
          enabled: true,
        },
      );

      await upsertPayloadDoc(ctx.payload, ctx.req, "task-templates", slug, {
        storySlug,
        inkFile,
      });
    }

    if (ctx.transactionStarted) await ctx.commitTransaction(ctx.req);
    refreshProjectFlowCaches(slug);
    return NextResponse.json({ ok: true, storySlug, mode });
  } catch (error) {
    if (ctx.transactionStarted) await ctx.killTransaction(ctx.req);
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存剧情调用失败" },
      { status: 500 },
    );
  }
}
