import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { loadContentStudioData } from "@/game/contentStudioLoader";
import { MILESTONE_LABELS, PROJECT_STAGES } from "@/game/projectStages";
import { clearStoryEntryCache } from "@/game/storyEntryLoader";
import { bustContentOrchestrationCache } from "@/lib/contentOrchestrationCache";
import { bustOpsDataCache } from "@/lib/opsDataCache";
import { requireOpsAccess } from "@/lib/opsDebugAccess";
import { LEGACY_NPC_NAME_ALIASES } from "@/data/npcProfiles";
import type { Payload, PayloadRequest } from "payload";

const schema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]+$/, "流程节点标识只能包含小写字母、数字和下划线"),
  stage: z.string().trim(),
  title: z.string().trim().min(2, "请填写流程任务名称"),
  description: z.string().trim().min(2, "请填写任务说明"),
  locationSlug: z.string().trim().min(1, "请选择办理地点"),
  npcNames: z.array(z.string().trim()).default([]),
  inputArtifactSlugs: z.array(z.string().trim()).default([]),
  outputArtifactSlugs: z.array(z.string().trim()).default([]),
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
      z.object({ artifactSlug: z.string().trim(), status: z.string().trim() }),
    )
    .default([]),
  milestoneKeys: z.array(z.string().trim()).default([]),
  action: z.object({
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9_]+$/)
      .optional(),
    label: z.string().trim().min(2),
    description: z.string().trim().min(2),
  }),
  story: z.object({
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9_]+$/),
    title: z.string().trim().min(2),
    description: z.string().trim(),
    inkFile: z
      .string()
      .trim()
      .regex(/^[a-z0-9_]+$/, "Ink 文件名只能包含小写字母、数字和下划线"),
  }),
  event: z.object({
    enabled: z.boolean(),
    title: z.string().trim(),
    description: z.string().trim(),
    eventType: z.string().trim(),
    riskTags: z.array(z.string().trim()),
    weight: z.number().int().min(1),
    onceOnly: z.boolean(),
    cooldownDays: z.number().int().min(0),
  }),
});

async function upsert(
  payload: Payload,
  req: PayloadRequest,
  collection:
    | "task-templates"
    | "location-actions"
    | "story-entries"
    | "event-templates",
  slug: string,
  data: Record<string, unknown>,
) {
  const found = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    req,
  });
  const doc = found.docs[0];
  if (doc) {
    await payload.update({ collection, id: doc.id, data, req });
    return { id: doc.id, action: "updated" as const };
  }
  const created = await payload.create({ collection, data, req });
  return { id: created.id, action: "created" as const };
}

export async function POST(request: Request) {
  const access = await requireOpsAccess();
  if (access.error) return access.error;
  try {
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
    const studio = await loadContentStudioData();
    const issues: string[] = [];
    const inputArtifacts =
      input.inputArtifacts.length > 0
        ? input.inputArtifacts
        : input.inputArtifactSlugs.map((artifactSlug) => ({
            artifactSlug,
            minStatus: "",
          }));
    const outputArtifacts =
      input.outputArtifacts.length > 0
        ? input.outputArtifacts
        : input.outputArtifactSlugs.map((artifactSlug) => ({
            artifactSlug,
            status: "",
          }));
    const storySlug = input.story.slug;
    const eventSlug = `event_${input.slug}`;
    const actionSlug = input.action.slug || `action_${input.slug}`;
    const existingTask = studio.taskTemplates.find(
      (task) => task.slug === input.slug,
    );
    const existingStory = studio.storyEntries.find(
      (story) => story.slug === storySlug,
    );
    const existingAction = studio.locationActions.find(
      (action) => action.id === actionSlug,
    );
    const existingEvent = studio.eventTemplates.find(
      (event) => event.slug === eventSlug,
    );
    if (!PROJECT_STAGES.some((stage) => stage.id === input.stage))
      issues.push("所属项目阶段不存在");
    if (input.stage === "OPENING")
      issues.push("开业结算为终态阶段，当前运行规则不允许新增可生成的流程任务");
    const location = studio.mapLocations.find(
      (item) => item.id === input.locationSlug,
    );
    if (!location) issues.push("办理地点不存在");
    const validAreaNames = new Set(studio.areas.map((area) => area.name));
    const taskArea =
      (existingTask?.area && validAreaNames.has(existingTask.area)
        ? existingTask.area
        : undefined) ||
      location?.relatedAreaNames?.find((area) => validAreaNames.has(area));
    if (location && !taskArea)
      issues.push(
        "办理地点尚未关联业务区域，请先在地图地点中补充关联区域后再保存",
      );
    const npcNames = new Set(studio.npcs.map((npc) => npc.name));
    for (const name of input.npcNames)
      if (!npcNames.has(name) && !LEGACY_NPC_NAME_ALIASES[name])
        issues.push(`协同对象不存在：${name}`);
    const artifactMap = new Map(
      studio.artifactDefinitions.map((artifact) => [artifact.slug, artifact]),
    );
    for (const slug of [
      ...inputArtifacts.map((item) => item.artifactSlug),
      ...outputArtifacts.map((item) => item.artifactSlug),
    ]) {
      const artifact = artifactMap.get(slug);
      if (!artifact) {
        issues.push(`成果物定义不存在：${slug}，请先补充成果物定义`);
      } else {
        const allowed = (artifact.allowedStatuses || []).map(
          (status) => status.status,
        );
        const defaultStatus = artifact.defaultStatus || "draft";
        if (allowed.length > 0 && !allowed.includes(defaultStatus)) {
          issues.push(
            `成果物 ${artifact.name} 的默认状态 ${defaultStatus} 不在允许状态中`,
          );
        }
      }
    }
    for (const item of inputArtifacts) {
      const artifact = artifactMap.get(item.artifactSlug);
      if (!artifact || !item.minStatus) continue;
      const allowed = (artifact.allowedStatuses || []).map(
        (status) => status.status,
      );
      if (allowed.length > 0 && !allowed.includes(item.minStatus)) {
        issues.push(
          `成果物 ${artifact.name} 的前置状态 ${item.minStatus} 不合法`,
        );
      }
    }
    for (const item of outputArtifacts) {
      const artifact = artifactMap.get(item.artifactSlug);
      if (!artifact || !item.status) continue;
      const allowed = (artifact.allowedStatuses || []).map(
        (status) => status.status,
      );
      if (allowed.length > 0 && !allowed.includes(item.status)) {
        issues.push(`成果物 ${artifact.name} 的产出状态 ${item.status} 不合法`);
      }
    }
    for (const key of input.milestoneKeys)
      if (!MILESTONE_LABELS[key]) issues.push(`关键节点不存在：${key}`);
    if (existingTask && existingTask.category !== "mainline") {
      issues.push(
        `任务标识 ${input.slug} 已被非主线任务使用，不能通过流程向导覆盖`,
      );
    }
    if (
      existingStory &&
      !(existingStory.relatedTaskSlugs || []).includes(input.slug)
    ) {
      issues.push(`剧情标识 ${storySlug} 已关联其他任务，请使用新的剧情标识`);
    }
    if (
      existingAction &&
      !(existingAction.triggerTaskSlugs || []).includes(input.slug)
    ) {
      issues.push(`地点行动标识 ${actionSlug} 已触发其他任务，不能覆盖`);
    }
    if (
      existingEvent &&
      !(existingEvent.triggerTaskSlugs || []).includes(input.slug)
    ) {
      issues.push(`事件标识 ${eventSlug} 已触发其他任务，不能覆盖`);
    }
    if (issues.length)
      return NextResponse.json(
        { error: "保存前校验未通过", issues },
        { status: 400 },
      );

    const {
      commitTransaction,
      createLocalReq,
      getPayload,
      initTransaction,
      killTransaction,
    } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });
    const payloadReq = await createLocalReq({}, payload);
    const transactionStarted = await initTransaction(payloadReq);
    const eventSlugs = input.event.enabled ? [eventSlug] : [];

    try {
      const storyResult = await upsert(
        payload,
        payloadReq,
        "story-entries",
        storySlug,
        {
          slug: storySlug,
          title: input.story.title,
          description: input.story.description,
          storyType: existingStory?.storyType || "task_story",
          status: existingStory?.status || "draft",
          inkFile: input.story.inkFile,
          stage: input.stage,
          relatedLocationSlugs: [{ slug: input.locationSlug }],
          relatedTaskSlugs: [{ slug: input.slug }],
          relatedEventSlugs: eventSlugs.map((slug) => ({ slug })),
          relatedNpcNames: input.npcNames.map((name) => ({ name })),
          previewText: input.description,
          enabled: true,
        },
      );

      const taskResult = await upsert(
        payload,
        payloadReq,
        "task-templates",
        input.slug,
        {
          category: "mainline",
          slug: input.slug,
          title: input.title,
          description: input.description,
          rarity: existingTask?.rarity || "R",
          stage: input.stage,
          sourceType: existingTask?.sourceType || "project_flow",
          sourceName: existingTask?.sourceName || "项目流程编排器",
          area: taskArea,
          npcList: input.npcNames.map((npc) => ({ npc })),
          requiredCount: existingTask?.requiredCount || 1,
          inkFile: input.story.inkFile,
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
          inputArtifacts: inputArtifacts.map((item) => ({
            artifactSlug: item.artifactSlug,
            minStatus:
              item.minStatus ||
              artifactMap.get(item.artifactSlug)?.defaultStatus ||
              "draft",
            quantity: 1,
          })),
          outputArtifacts: outputArtifacts.map((item) => ({
            artifactSlug: item.artifactSlug,
            status:
              item.status ||
              artifactMap.get(item.artifactSlug)?.defaultStatus ||
              "draft",
            versionBump: false,
          })),
          blockPolicy: "hard_block",
          enabled: true,
        },
      );

      const actionResult = await upsert(
        payload,
        payloadReq,
        "location-actions",
        actionSlug,
        {
          slug: actionSlug,
          label: input.action.label,
          description: input.action.description,
          locationSlug: input.locationSlug,
          unlockStage: input.stage,
          triggerTaskSlugs: [{ slug: input.slug }],
          storySlug,
          relatedNpcNames: input.npcNames.map((name) => ({ name })),
          resultText:
            existingAction?.resultText || `已发起“${input.title}”流程任务。`,
          noTaskText:
            existingAction?.noTaskText ||
            "该流程任务已在推进中，无需重复发起。",
          enabled: true,
        },
      );

      let eventResult: {
        id: string | number;
        action: "created" | "updated";
      } | null = null;
      if (input.event.enabled) {
        eventResult = await upsert(
          payload,
          payloadReq,
          "event-templates",
          eventSlug,
          {
            category: "mainline",
            slug: eventSlug,
            title: input.event.title || `${input.title}补正事件`,
            description: input.event.description,
            rarity: "R",
            eventType: input.event.eventType || "材料补正",
            inkFile: input.story.inkFile,
            storySlug,
            triggerStage: input.stage,
            triggerLocationSlugs: [{ slug: input.locationSlug }],
            triggerNpcNames: input.npcNames.map((name) => ({ name })),
            triggerTaskSlugs: [{ slug: input.slug }],
            riskTags: input.event.riskTags.map((tag) => ({ tag })),
            weight: input.event.weight,
            onceOnly: input.event.onceOnly,
            cooldownDays: input.event.cooldownDays,
            resultText:
              existingEvent?.resultText || "已触发流程补正，请按要求处理。",
            noTaskText: existingEvent?.noTaskText || "当前无需新增补正任务。",
            enabled: true,
          },
        );
      } else if (existingEvent?.payloadDocId != null) {
        await payload.update({
          collection: "event-templates",
          id: existingEvent.payloadDocId,
          data: { enabled: false },
          req: payloadReq,
        });
        eventResult = { id: existingEvent.payloadDocId, action: "updated" };
      }

      if (transactionStarted) await commitTransaction(payloadReq);

      clearStoryEntryCache();
      bustContentOrchestrationCache();
      bustOpsDataCache();
      revalidatePath("/ops/project-flow");
      revalidatePath("/ops/content-studio");
      return NextResponse.json({
        ok: true,
        slug: input.slug,
        story: storyResult,
        task: taskResult,
        action: actionResult,
        event: eventResult,
        inkNotice: `请后续补充 src/ink/stories/${input.story.inkFile}.ink 并编译。`,
      });
    } catch (error) {
      if (transactionStarted) await killTransaction(payloadReq);
      throw error;
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存流程节点失败" },
      { status: 500 },
    );
  }
}
