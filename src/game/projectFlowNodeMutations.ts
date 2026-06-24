import { revalidatePath } from "next/cache";
import type { ContentStudioData } from "./contentStudioLoader";
import { MILESTONE_LABELS, PROJECT_STAGES } from "./projectStages";
import { clearStoryEntryCache } from "./storyEntryLoader";
import { bustContentOrchestrationCache } from "@/lib/contentOrchestrationCache";
import { bustOpsDataCache } from "@/lib/opsDataCache";
import { LEGACY_NPC_NAME_ALIASES } from "@/data/npcProfiles";
import {
  buildPrerequisiteTaskMap,
  findPrerequisiteCyclePath,
  formatPrerequisiteCycleIssue,
} from "./projectFlowNodeUtils";
import type { Payload, PayloadRequest } from "payload";

export type ArtifactInput = { artifactSlug: string; minStatus: string };
export type ArtifactOutput = { artifactSlug: string; status: string };

export function validateProjectFlowReferences(
  studio: ContentStudioData,
  input: {
    slug: string;
    stage: string;
    locationSlug?: string;
    npcNames: string[];
    inputArtifacts: ArtifactInput[];
    outputArtifacts: ArtifactOutput[];
    milestoneKeys: string[];
    prerequisiteTaskSlugs?: string[];
    storySlug?: string;
    storyBindingMode?: "bind" | "update" | "clone";
    actionSlug?: string;
    eventSlug?: string;
    allowExistingNonMainline?: boolean;
  },
): string[] {
  const issues: string[] = [];
  const existingTask = studio.taskTemplates.find((task) => task.slug === input.slug);

  if (!PROJECT_STAGES.some((stage) => stage.id === input.stage)) {
    issues.push("所属项目阶段不存在");
  }
  if (input.stage === "OPENING") {
    issues.push("开业结算为终态阶段，当前运行规则不允许修改可生成的流程任务");
  }

  if (input.locationSlug) {
    const location = studio.mapLocations.find((item) => item.id === input.locationSlug);
    if (!location) {
      issues.push("办理地点不存在");
    } else {
      const validAreaNames = new Set(studio.areas.map((area) => area.name));
      const taskArea =
        (existingTask?.area && validAreaNames.has(existingTask.area)
          ? existingTask.area
          : undefined) ||
        location.relatedAreaNames?.find((area) => validAreaNames.has(area));
      if (!taskArea) {
        issues.push(
          "办理地点尚未关联业务区域，请先在地图地点中补充关联区域后再保存",
        );
      }
    }
  }

  const npcNames = new Set(studio.npcs.map((npc) => npc.name));
  for (const name of input.npcNames) {
    if (!npcNames.has(name) && !LEGACY_NPC_NAME_ALIASES[name]) {
      issues.push(`协同对象不存在：${name}`);
    }
  }

  const artifactMap = new Map(
    studio.artifactDefinitions.map((artifact) => [artifact.slug, artifact]),
  );
  for (const slug of [
    ...input.inputArtifacts.map((item) => item.artifactSlug),
    ...input.outputArtifacts.map((item) => item.artifactSlug),
  ]) {
    const artifact = artifactMap.get(slug);
    if (!artifact) {
      issues.push(`成果物定义不存在：${slug}，请先补充成果物定义`);
    } else {
      const allowed = (artifact.allowedStatuses || []).map((status) => status.status);
      const defaultStatus = artifact.defaultStatus || "draft";
      if (allowed.length > 0 && !allowed.includes(defaultStatus)) {
        issues.push(
          `成果物 ${artifact.name} 的默认状态 ${defaultStatus} 不在允许状态中`,
        );
      }
    }
  }

  for (const item of input.inputArtifacts) {
    const artifact = artifactMap.get(item.artifactSlug);
    if (!artifact || !item.minStatus) continue;
    const allowed = (artifact.allowedStatuses || []).map((status) => status.status);
    if (allowed.length > 0 && !allowed.includes(item.minStatus)) {
      issues.push(`成果物 ${artifact.name} 的前置状态 ${item.minStatus} 不合法`);
    }
  }

  for (const item of input.outputArtifacts) {
    const artifact = artifactMap.get(item.artifactSlug);
    if (!artifact || !item.status) continue;
    const allowed = (artifact.allowedStatuses || []).map((status) => status.status);
    if (allowed.length > 0 && !allowed.includes(item.status)) {
      issues.push(`成果物 ${artifact.name} 的产出状态 ${item.status} 不合法`);
    }
  }

  for (const key of input.milestoneKeys) {
    if (!MILESTONE_LABELS[key]) issues.push(`关键节点不存在：${key}`);
  }

  const taskSlugs = new Set(studio.taskTemplates.map((task) => task.slug));
  for (const prereqSlug of input.prerequisiteTaskSlugs || []) {
    if (prereqSlug === input.slug) {
      issues.push("不能将当前任务设为自己的前置任务");
    } else if (!taskSlugs.has(prereqSlug)) {
      issues.push(`前置任务不存在：${prereqSlug}`);
    }
  }

  const prerequisiteMap = buildPrerequisiteTaskMap(
    studio.taskTemplates,
    input.slug,
    input.prerequisiteTaskSlugs || [],
  );
  const cyclePath = findPrerequisiteCyclePath(input.slug, prerequisiteMap);
  if (cyclePath) {
    issues.push(formatPrerequisiteCycleIssue(cyclePath));
  }

  if (existingTask && existingTask.category !== "mainline" && !input.allowExistingNonMainline) {
    issues.push(`任务标识 ${input.slug} 已被非主线任务使用，不能通过流程编排覆盖`);
  }

  if (input.storySlug && input.storyBindingMode !== "bind") {
    const existingStory = studio.storyEntries.find((story) => story.slug === input.storySlug);
    if (
      existingStory &&
      !(existingStory.relatedTaskSlugs || []).includes(input.slug) &&
      existingStory.slug !== existingTask?.storySlug &&
      input.storyBindingMode !== "clone"
    ) {
      issues.push(`剧情标识 ${input.storySlug} 已关联其他任务，请使用新的剧情标识`);
    }
  }

  if (input.actionSlug) {
    const existingAction = studio.locationActions.find((action) => action.id === input.actionSlug);
    if (
      existingAction &&
      !(existingAction.triggerTaskSlugs || []).includes(input.slug)
    ) {
      issues.push(`地点行动标识 ${input.actionSlug} 已触发其他任务，不能覆盖`);
    }
  }

  if (input.eventSlug) {
    const existingEvent = studio.eventTemplates.find((event) => event.slug === input.eventSlug);
    if (
      existingEvent &&
      !(existingEvent.triggerTaskSlugs || []).includes(input.slug) &&
      !(existingEvent.taskEffects || []).some((effect) => effect.taskSlug === input.slug)
    ) {
      issues.push(`事件标识 ${input.eventSlug} 已触发其他任务，不能覆盖`);
    }
  }

  return issues;
}

export async function upsertPayloadDoc(
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

export async function getOpsPayloadContext() {
  const {
    commitTransaction,
    createLocalReq,
    getPayload,
    initTransaction,
    killTransaction,
  } = await import("payload");
  const config = (await import("@payload-config")).default;
  const payload = await getPayload({ config });
  const req = await createLocalReq({}, payload);
  const transactionStarted = await initTransaction(req);
  return { payload, req, transactionStarted, commitTransaction, killTransaction };
}

export function refreshProjectFlowCaches(slug: string) {
  clearStoryEntryCache();
  bustContentOrchestrationCache();
  bustOpsDataCache();
  revalidatePath("/ops/project-flow");
  revalidatePath(`/ops/project-flow/node/${slug}`);
  revalidatePath("/ops/content-studio");
  revalidatePath("/ops/content-orchestration");
}

export function validationErrorResponse(issues: string[]) {
  return { error: "保存前校验未通过", issues };
}

export function artifactDefaults(
  studio: ContentStudioData,
  inputArtifacts: ArtifactInput[],
  outputArtifacts: ArtifactOutput[],
) {
  const artifactMap = new Map(
    studio.artifactDefinitions.map((artifact) => [artifact.slug, artifact]),
  );
  return {
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
        item.status || artifactMap.get(item.artifactSlug)?.defaultStatus || "draft",
      versionBump: false,
    })),
  };
}

export function resolveTaskArea(
  studio: ContentStudioData,
  slug: string,
  locationSlug: string,
) {
  const existingTask = studio.taskTemplates.find((task) => task.slug === slug);
  const location = studio.mapLocations.find((item) => item.id === locationSlug);
  const validAreaNames = new Set(studio.areas.map((area) => area.name));
  return (
    (existingTask?.area && validAreaNames.has(existingTask.area)
      ? existingTask.area
      : undefined) ||
    location?.relatedAreaNames?.find((area) => validAreaNames.has(area))
  );
}
