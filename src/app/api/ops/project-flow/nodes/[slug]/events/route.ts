import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOpsPayloadContext,
  refreshProjectFlowCaches,
  upsertPayloadDoc,
} from "@/game/projectFlowNodeMutations";
import { resolveMainlineNode } from "@/game/projectFlowNodeResolver";
import { requireOpsAccess } from "@/lib/opsDebugAccess";

const eventSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]+$/, "事件标识只能包含小写字母、数字和下划线"),
  enabled: z.boolean(),
  title: z.string().trim().min(2, "请填写事件名称"),
  description: z.string().trim(),
  eventType: z.string().trim(),
  riskTags: z.array(z.string().trim()).default([]),
  weight: z.number().int().min(1),
  onceOnly: z.boolean(),
  cooldownDays: z.number().int().min(0),
});

const schema = z.object({
  events: z.array(eventSchema).default([]),
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

  const resolved = await resolveMainlineNode(slug);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const { studio, detail, existingTask } = resolved;

  const primaryStory = detail.node.stories[0];
  const primaryAction = detail.node.actionSlugs[0];
  const locationSlug = primaryAction
    ? studio.locationActions.find((action) => action.id === primaryAction.slug)?.locationId
    : undefined;

  for (const event of parsed.data.events) {
    const existingEvent = studio.eventTemplates.find((item) => item.slug === event.slug);
    if (existingEvent) {
      const triggersThis =
        (existingEvent.triggerTaskSlugs || []).includes(slug) ||
        (existingEvent.taskEffects || []).some((effect) => effect.taskSlug === slug);
      if (!triggersThis) {
        return NextResponse.json(
          {
            error: "保存前校验未通过",
            issues: [`事件 ${event.slug} 已触发其他任务，不能覆盖`],
          },
          { status: 400 },
        );
      }
    }
  }

  const ctx = await getOpsPayloadContext();
  try {
    const results = [];
    for (const event of parsed.data.events) {
      const existingEvent = studio.eventTemplates.find((item) => item.slug === event.slug);
      const docId = studio.eventTemplateDocIds[event.slug];

      if (!event.enabled && docId != null) {
        await ctx.payload.update({
          collection: "event-templates",
          id: docId,
          data: { enabled: false },
          req: ctx.req,
        });
        results.push({ slug: event.slug, action: "disabled" as const });
        continue;
      }

      if (!event.enabled) continue;

      const result = await upsertPayloadDoc(
        ctx.payload,
        ctx.req,
        "event-templates",
        event.slug,
        {
          category: (existingEvent as { category?: string }).category || "mainline",
          slug: event.slug,
          title: event.title,
          description: event.description,
          rarity: existingEvent?.rarity || "R",
          eventType: event.eventType,
          inkFile: existingEvent?.inkFile || primaryStory?.inkFile || existingTask?.inkFile,
          storySlug: primaryStory?.slug || existingTask?.storySlug,
          triggerStage: detail.node.stage || detail.stageId,
          triggerLocationSlugs: locationSlug ? [{ slug: locationSlug }] : [],
          triggerNpcNames: detail.node.npcNames.map((name) => ({ name })),
          triggerTaskSlugs: [{ slug }],
          riskTags: event.riskTags.map((tag) => ({ tag })),
          weight: event.weight,
          onceOnly: event.onceOnly,
          cooldownDays: event.cooldownDays,
          resultText: existingEvent?.resultText || "已触发流程补正，请按要求处理。",
          noTaskText: existingEvent?.noTaskText || "当前无需新增补正任务。",
          enabled: true,
        },
      );
      results.push({ slug: event.slug, ...result });
    }

    if (ctx.transactionStarted) await ctx.commitTransaction(ctx.req);
    refreshProjectFlowCaches(slug);
    return NextResponse.json({ ok: true, events: results });
  } catch (error) {
    if (ctx.transactionStarted) await ctx.killTransaction(ctx.req);
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存事件池失败" },
      { status: 500 },
    );
  }
}
