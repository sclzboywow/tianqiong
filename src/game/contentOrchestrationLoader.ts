import fs from "fs";
import path from "path";
import type { ContentStudioData } from "./contentStudioLoader";
import { loadContentStudioData } from "./contentStudioLoader";
import { CONSTRUCTION_PROJECT_MAINLINE_TASKS } from "@/data/constructionProjectMainlineTasks";
import { CONSTRUCTION_PROJECT_EVENTS } from "@/data/constructionProjectEvents";
import { CONSTRUCTION_PROJECT_LOCATION_ACTIONS } from "@/data/constructionProjectLocationActions";
import { ARTIFACT_DEFINITIONS } from "@/data/artifactDefinitions";
import {
  LEGACY_CHAPTER1_EVENT_SLUGS,
  LEGACY_CHAPTER1_INK_FILES,
  LEGACY_CHAPTER1_LOCATION_ACTION_SLUGS,
  LEGACY_CHAPTER1_STORY_ENTRY_SLUGS,
  LEGACY_CHAPTER1_TASK_SLUGS,
} from "@/data/legacyChapter1Slugs";
import { PROJECT_STAGES, type ProjectStageId } from "./projectStages";
import type { TaskTemplateData, EventTemplateData, StoryEntryData } from "./types";
import type { LocationAction } from "@/data/locationActions";

const MAINLINE_STAGES: ProjectStageId[] = [
  "INITIATION",
  "APPROVAL",
  "DESIGN",
  "PROCUREMENT",
  "CONSTRUCTION",
];

const GENERIC_INK_FILES = [
  "project_document_task",
  "project_meeting_task",
  "project_submit_review_task",
  "project_correction_task",
];

const STORIES_DIR = path.join(process.cwd(), "src/ink/stories");

export type CleanupItem = {
  slug: string;
  kind: string;
  source: "payload" | "filesystem";
  found: boolean;
};

export type OrchestrationTask = {
  slug: string;
  title: string;
  category?: string;
  stage?: string;
  stageProgress?: number;
  prerequisiteTaskSlugs: string[];
  requiredMilestones: string[];
  inputArtifacts: string[];
  outputArtifacts: string[];
  milestoneEffects: string[];
  relatedActionSlugs: string[];
  relatedStorySlug?: string;
  relatedEventSlugs: string[];
  enabled?: boolean;
  payloadDocId?: string | number;
  storyEntryDocId?: string | number;
  seedOnly: boolean;
};

export type OrchestrationArtifact = {
  slug: string;
  name: string;
  stage?: string;
  defaultStatus?: string;
  allowedStatuses: string[];
  usedByMainline: boolean;
  producedBy: string[];
  requiredBy: string[];
  affectedByEvents: string[];
  undefinedRefs: string[];
  payloadDocId?: string | number;
};

export type OrchestrationAction = {
  slug: string;
  label: string;
  locationSlug: string;
  unlockStage?: string;
  unlockMilestones: string[];
  triggerTaskSlugs: string[];
  relatedNpcNames: string[];
  sortOrder?: number;
  enabled?: boolean;
  payloadDocId?: string | number;
  risks: string[];
};

export type OrchestrationEvent = {
  slug: string;
  title: string;
  category?: string;
  enabled?: boolean;
  triggerStage?: string;
  triggerLocationSlugs: string[];
  triggerTaskSlugs: string[];
  artifactEffects: string[];
  taskEffects: string[];
  metricEffects: string[];
  storySlug?: string;
  inkFile?: string;
  kind: "construction" | "site" | "other";
  payloadDocId?: string | number;
  risks: string[];
};

export type OrchestrationStoryEntry = {
  slug: string;
  title: string;
  storyType?: string;
  status?: string;
  enabled?: boolean;
  inkFile?: string;
  compiledFile?: string;
  relatedTaskSlugs: string[];
  relatedEventSlugs: string[];
  payloadDocId?: string | number;
  risks: string[];
};

export type OrchestrationStage = {
  stageId: string;
  stageName: string;
  requiredMilestones: string[];
  tasks: OrchestrationTask[];
  correctionTasks: OrchestrationTask[];
  artifacts: OrchestrationArtifact[];
  actions: OrchestrationAction[];
  events: OrchestrationEvent[];
  stageProgressSum: number;
  stageGateReady: boolean;
  warnings: string[];
};

export type ContentOrchestrationData = {
  studio: ContentStudioData;
  stages: OrchestrationStage[];
  overview: {
    mainlineTaskCount: number;
    correctionTaskCount: number;
    artifactCount: number;
    constructionActionCount: number;
    constructionEventCount: number;
    genericInkCount: number;
  };
  cleanup: {
    oldTasks: CleanupItem[];
    oldEvents: CleanupItem[];
    oldStoryEntries: CleanupItem[];
    oldLocationActions: CleanupItem[];
    oldInkFiles: CleanupItem[];
    clean: boolean;
  };
  artifacts: OrchestrationArtifact[];
  allTasks: OrchestrationTask[];
  allActions: OrchestrationAction[];
  allEvents: OrchestrationEvent[];
  allStoryEntries: OrchestrationStoryEntry[];
  terminalTask: OrchestrationTask | null;
  health: {
    errors: string[];
    warnings: string[];
    summary: string;
  };
};

function inkExists(name: string): boolean {
  return fs.existsSync(path.join(STORIES_DIR, `${name}.ink`));
}

function inkCompiled(name: string): boolean {
  return fs.existsSync(path.join(STORIES_DIR, `${name}.json`));
}

function buildTaskRow(
  seed: TaskTemplateData,
  studio: ContentStudioData,
  allTaskSlugs: Set<string>,
  actionIndex: Map<string, string[]>,
  eventIndex: Map<string, string[]>,
): OrchestrationTask {
  const payload = studio.taskTemplates.find((t) => t.slug === seed.slug);
  const storySlug = seed.storySlug || payload?.storySlug;
  const storyEntry = storySlug
    ? studio.storyEntries.find((s) => s.slug === storySlug)
    : undefined;

  return {
    slug: seed.slug,
    title: seed.title,
    category: seed.category || payload?.category,
    stage: seed.stage || payload?.stage,
    stageProgress: seed.successEffects?.stageProgress,
    prerequisiteTaskSlugs: seed.prerequisiteTaskSlugs || [],
    requiredMilestones: seed.requiredMilestones || [],
    inputArtifacts: (seed.inputArtifacts || []).map((a) => a.artifactSlug),
    outputArtifacts: (seed.outputArtifacts || []).map((a) => `${a.artifactSlug}:${a.status}`),
    milestoneEffects: Object.keys(seed.milestoneEffects || {}),
    relatedActionSlugs: actionIndex.get(seed.slug) || [],
    relatedStorySlug: storySlug,
    relatedEventSlugs: eventIndex.get(seed.slug) || [],
    enabled: (payload as { enabled?: boolean } | undefined)?.enabled ?? true,
    payloadDocId: studio.taskTemplateDocIds[seed.slug],
    storyEntryDocId: storySlug ? studio.storyEntryDocIds[storySlug] : undefined,
    seedOnly: !payload,
  };
}

function classifyEvent(event: EventTemplateData): "construction" | "site" | "other" {
  const slug = event.slug || "";
  if (CONSTRUCTION_PROJECT_EVENTS.some((e) => e.slug === slug)) return "construction";
  const constructionSlugs = new Set(
    CONSTRUCTION_PROJECT_MAINLINE_TASKS.map((t) => t.slug),
  );
  const triggers = event.triggerTaskSlugs || [];
  if (triggers.some((s) => constructionSlugs.has(s))) return "construction";
  const siteKeywords = ["fire", "quality", "merchant", "material", "sprinkler", "corridor"];
  const eventCategory = (event as { category?: string }).category;
  if (
    siteKeywords.some((k) => slug.includes(k)) ||
    (eventCategory && ["site", "fire", "quality"].includes(eventCategory))
  ) {
    return "site";
  }
  return "other";
}

function buildCleanupItems(
  slugs: readonly string[],
  kind: string,
  studioSet: Set<string>,
  fsCheck?: (slug: string) => boolean,
): CleanupItem[] {
  return slugs.map((slug) => {
    const inPayload = studioSet.has(slug);
    const inFs = fsCheck ? fsCheck(slug) : false;
    return {
      slug,
      kind,
      source: inPayload ? "payload" : inFs ? "filesystem" : "payload",
      found: inPayload || inFs,
    };
  });
}

export async function loadContentOrchestrationData(): Promise<ContentOrchestrationData> {
  const studio = await loadContentStudioData();
  const { buildOrchestrationHealth } = await import("./contentOrchestrationHealth");

  const seedMainline = CONSTRUCTION_PROJECT_MAINLINE_TASKS.filter(
    (t) => t.category === "mainline",
  );
  const seedCorrection = CONSTRUCTION_PROJECT_MAINLINE_TASKS.filter(
    (t) => t.category === "correction",
  );
  const allSeedTasks = [...seedMainline, ...seedCorrection];
  const allTaskSlugs = new Set(studio.taskTemplates.map((t) => t.slug));

  const actionIndex = new Map<string, string[]>();
  for (const action of [...CONSTRUCTION_PROJECT_LOCATION_ACTIONS, ...studio.locationActions]) {
    for (const slug of action.triggerTaskSlugs || []) {
      const list = actionIndex.get(slug) || [];
      if (!list.includes(action.id)) list.push(action.id);
      actionIndex.set(slug, list);
    }
  }

  const eventIndex = new Map<string, string[]>();
  for (const event of studio.eventTemplates) {
    for (const slug of event.triggerTaskSlugs || []) {
      const list = eventIndex.get(slug) || [];
      if (event.slug && !list.includes(event.slug)) list.push(event.slug);
      eventIndex.set(slug, list);
    }
  }

  const allTasks = allSeedTasks.map((seed) =>
    buildTaskRow(seed, studio, allTaskSlugs, actionIndex, eventIndex),
  );

  const artifactProducers = new Map<string, string[]>();
  const artifactConsumers = new Map<string, string[]>();
  for (const task of allSeedTasks) {
    for (const out of task.outputArtifacts || []) {
      const list = artifactProducers.get(out.artifactSlug) || [];
      list.push(task.slug);
      artifactProducers.set(out.artifactSlug, list);
    }
    for (const inp of task.inputArtifacts || []) {
      const list = artifactConsumers.get(inp.artifactSlug) || [];
      list.push(task.slug);
      artifactConsumers.set(inp.artifactSlug, list);
    }
  }

  const artifactEventMap = new Map<string, string[]>();
  for (const event of studio.eventTemplates) {
    for (const eff of event.artifactEffects || []) {
      const slug = eff.artifactSlug;
      if (!slug) continue;
      const list = artifactEventMap.get(slug) || [];
      if (event.slug && !list.includes(event.slug)) list.push(event.slug);
      artifactEventMap.set(slug, list);
    }
  }

  const mainlineArtifactSlugs = new Set<string>();
  for (const task of allSeedTasks) {
    for (const out of task.outputArtifacts || []) mainlineArtifactSlugs.add(out.artifactSlug);
    for (const inp of task.inputArtifacts || []) mainlineArtifactSlugs.add(inp.artifactSlug);
  }

  const artifacts: OrchestrationArtifact[] = ARTIFACT_DEFINITIONS.map((def) => {
    const payload = studio.artifactDefinitions.find((a) => a.slug === def.slug);
    const undefinedRefs: string[] = [];
    if (!studio.artifactDefinitionDocIds[def.slug] && !payload) {
      undefinedRefs.push("payload 未注册");
    }
    return {
      slug: def.slug,
      name: def.name,
      stage: def.stage,
      defaultStatus: def.defaultStatus,
      allowedStatuses: (def.allowedStatuses || []).map((s) =>
        typeof s === "string" ? s : s.status,
      ),
      usedByMainline: mainlineArtifactSlugs.has(def.slug),
      producedBy: artifactProducers.get(def.slug) || [],
      requiredBy: artifactConsumers.get(def.slug) || [],
      affectedByEvents: artifactEventMap.get(def.slug) || [],
      undefinedRefs,
      payloadDocId: studio.artifactDefinitionDocIds[def.slug],
    };
  });

  const mapLocationIds = new Set(studio.mapLocations.map((l) => l.id));
  const legacyTaskSet = new Set<string>(LEGACY_CHAPTER1_TASK_SLUGS);

  const allActions: OrchestrationAction[] = studio.locationActions.map((action) => {
    const seed = CONSTRUCTION_PROJECT_LOCATION_ACTIONS.find((a) => a.id === action.id);
    const risks: string[] = [];
    const triggers = action.triggerTaskSlugs || [];
    const actionEnabled = (action as { enabled?: boolean }).enabled;
    if (actionEnabled !== false && triggers.length === 0) {
      risks.push("enabled 但无 triggerTaskSlugs");
    }
    for (const slug of triggers) {
      if (legacyTaskSet.has(slug)) risks.push(`触发旧 Chapter1 任务 ${slug}`);
      if (!allTaskSlugs.has(slug) && !allSeedTasks.some((t) => t.slug === slug)) {
        risks.push(`触发不存在的任务 ${slug}`);
      }
    }
    if (action.locationId && !mapLocationIds.has(action.locationId)) {
      risks.push(`引用不存在的地图地点 ${action.locationId}`);
    }
    return {
      slug: action.id,
      label: action.label,
      locationSlug: action.locationId,
      unlockStage: action.unlockStage || seed?.unlockStage,
      unlockMilestones: action.unlockMilestones || seed?.unlockMilestones || [],
      triggerTaskSlugs: triggers,
      relatedNpcNames: action.relatedNpcNames || seed?.relatedNpcNames || [],
      sortOrder: action.sortOrder ?? seed?.sortOrder,
      enabled: actionEnabled ?? true,
      payloadDocId: studio.locationActionDocIds[action.id],
      risks,
    };
  });

  const constructionEventSlugs = new Set(
    CONSTRUCTION_PROJECT_EVENTS.map((e) => String(e.slug)),
  );

  const allEvents: OrchestrationEvent[] = studio.eventTemplates.map((event) => {
    const risks: string[] = [];
    const slug = event.slug || "";
    if (LEGACY_CHAPTER1_EVENT_SLUGS.includes(slug as (typeof LEGACY_CHAPTER1_EVENT_SLUGS)[number])) {
      risks.push("旧 Chapter1 事件仍存在");
    }
    if (constructionEventSlugs.has(slug) && event.enabled === false) {
      risks.push("正式建设项目事件被禁用");
    }
    for (const tslug of event.triggerTaskSlugs || []) {
      if (!allTaskSlugs.has(tslug) && !allSeedTasks.some((t) => t.slug === tslug)) {
        risks.push(`triggerTaskSlugs 引用不存在任务 ${tslug}`);
      }
    }
    for (const eff of event.artifactEffects || []) {
      if (eff.artifactSlug && !ARTIFACT_DEFINITIONS.some((a) => a.slug === eff.artifactSlug)) {
        risks.push(`artifactEffects 引用不存在成果物 ${eff.artifactSlug}`);
      }
    }
    if (event.storySlug && !studio.storyEntries.some((s) => s.slug === event.storySlug)) {
      risks.push(`storySlug ${event.storySlug} 无 StoryEntry`);
    }
    if (
      event.enabled !== false &&
      !event.triggerStage &&
      !(event.triggerLocationSlugs || []).length &&
      !(event.triggerTaskSlugs || []).length
    ) {
      risks.push("enabled 但无触发条件，可能全局乱触发");
    }
    return {
      slug,
      title: event.title || slug,
      category: (event as { category?: string }).category,
      enabled: event.enabled,
      triggerStage: event.triggerStage,
      triggerLocationSlugs: event.triggerLocationSlugs || [],
      triggerTaskSlugs: event.triggerTaskSlugs || [],
      artifactEffects: (event.artifactEffects || []).map(
        (e) => `${e.artifactSlug}:${e.status}`,
      ),
      taskEffects: (event.taskEffects || []).map((e) => e.taskSlug || ""),
      metricEffects: Object.keys(event.metricEffects || {}),
      storySlug: event.storySlug,
      inkFile: event.inkFile,
      kind: classifyEvent(event),
      payloadDocId: event.slug ? studio.eventTemplateDocIds[event.slug] : undefined,
      risks,
    };
  });

  const allStoryEntries: OrchestrationStoryEntry[] = studio.storyEntries.map((entry) => {
    const risks: string[] = [];
    if (
      LEGACY_CHAPTER1_STORY_ENTRY_SLUGS.includes(
        entry.slug as (typeof LEGACY_CHAPTER1_STORY_ENTRY_SLUGS)[number],
      )
    ) {
      risks.push("旧 Chapter1 StoryEntry");
    }
    if (entry.inkFile && !inkCompiled(entry.inkFile)) {
      risks.push(`inkFile ${entry.inkFile} 无编译产物`);
    }
    for (const tslug of entry.relatedTaskSlugs || []) {
      if (!allTaskSlugs.has(tslug) && !allSeedTasks.some((t) => t.slug === tslug)) {
        risks.push(`relatedTaskSlugs 引用不存在任务 ${tslug}`);
      }
    }
    for (const eslug of entry.relatedEventSlugs || []) {
      if (!studio.eventTemplates.some((e) => e.slug === eslug)) {
        risks.push(`relatedEventSlugs 引用不存在事件 ${eslug}`);
      }
    }
    return {
      slug: entry.slug,
      title: entry.title,
      storyType: entry.storyType,
      status: entry.status,
      enabled: entry.enabled,
      inkFile: entry.inkFile,
      compiledFile: entry.compiledFile,
      relatedTaskSlugs: entry.relatedTaskSlugs || [],
      relatedEventSlugs: entry.relatedEventSlugs || [],
      payloadDocId: studio.storyEntryDocIds[entry.slug],
      risks,
    };
  });

  const stages: OrchestrationStage[] = MAINLINE_STAGES.map((stageId) => {
    const config = PROJECT_STAGES.find((s) => s.id === stageId);
    const tasks = allTasks.filter(
      (t) => t.stage === stageId && t.category === "mainline",
    );
    const correctionTasks = allTasks.filter(
      (t) => t.stage === stageId && t.category === "correction",
    );
    const stageArtifacts = artifacts.filter((a) => a.stage === stageId || a.usedByMainline);
    const actions = allActions.filter(
      (a) =>
        a.unlockStage === stageId ||
        CONSTRUCTION_PROJECT_LOCATION_ACTIONS.some(
          (s) => s.id === a.slug && s.unlockStage === stageId,
        ),
    );
    const events = allEvents.filter(
      (e) => e.triggerStage === stageId || (e.kind === "construction" && e.triggerStage === stageId),
    );
    const stageProgressSum = tasks.reduce((sum, t) => sum + (t.stageProgress || 0), 0);
    const warnings: string[] = [];
    if (Math.abs(stageProgressSum - 100) > 1 && tasks.length > 0) {
      warnings.push(`阶段 stageProgress 总和 ${stageProgressSum}，期望约 100`);
    }
    for (const task of tasks) {
      if (task.relatedActionSlugs.length === 0) {
        warnings.push(`主线任务 ${task.slug} 无地点行动入口`);
      }
      if (!task.relatedStorySlug && !task.storyEntryDocId) {
        warnings.push(`主线任务 ${task.slug} 无 StoryEntry`);
      }
    }
    return {
      stageId,
      stageName: config?.name || stageId,
      requiredMilestones: config?.requiredMilestones || [],
      tasks,
      correctionTasks,
      artifacts: stageArtifacts,
      actions,
      events,
      stageProgressSum,
      stageGateReady: stageProgressSum >= 99 && tasks.length > 0,
      warnings,
    };
  });

  const taskSlugSet = new Set(studio.taskTemplates.map((t) => t.slug));
  const eventSlugSet = new Set(studio.eventTemplates.map((e) => e.slug));
  const storySlugSet = new Set(studio.storyEntries.map((s) => s.slug));
  const actionSlugSet = new Set(studio.locationActions.map((a) => a.id));

  const cleanup = {
    oldTasks: buildCleanupItems(LEGACY_CHAPTER1_TASK_SLUGS, "task", taskSlugSet),
    oldEvents: buildCleanupItems(LEGACY_CHAPTER1_EVENT_SLUGS, "event", eventSlugSet),
    oldStoryEntries: buildCleanupItems(
      LEGACY_CHAPTER1_STORY_ENTRY_SLUGS,
      "story-entry",
      storySlugSet,
    ),
    oldLocationActions: buildCleanupItems(
      LEGACY_CHAPTER1_LOCATION_ACTION_SLUGS,
      "location-action",
      actionSlugSet,
    ),
    oldInkFiles: LEGACY_CHAPTER1_INK_FILES.map((slug) => ({
      slug,
      kind: "ink",
      source: "filesystem" as const,
      found: inkExists(slug) || inkCompiled(slug),
    })),
    clean: false,
  };
  cleanup.clean = ![
    ...cleanup.oldTasks,
    ...cleanup.oldEvents,
    ...cleanup.oldStoryEntries,
    ...cleanup.oldLocationActions,
    ...cleanup.oldInkFiles,
  ].some((item) => item.found);

  const terminalTask =
    allTasks.find((t) => t.slug === "submit_construction_permit_application") || null;

  const health = buildOrchestrationHealth({
    stages,
    cleanup,
    allTasks,
    allActions,
    allEvents,
    allStoryEntries,
    terminalTask,
    artifacts,
  });

  return {
    studio,
    stages,
    overview: {
      mainlineTaskCount: seedMainline.length,
      correctionTaskCount: seedCorrection.length,
      artifactCount: ARTIFACT_DEFINITIONS.length,
      constructionActionCount: CONSTRUCTION_PROJECT_LOCATION_ACTIONS.length,
      constructionEventCount: CONSTRUCTION_PROJECT_EVENTS.length,
      genericInkCount: GENERIC_INK_FILES.length,
    },
    cleanup,
    artifacts,
    allTasks,
    allActions,
    allEvents,
    allStoryEntries,
    terminalTask,
    health,
  };
}

export type { StoryEntryData };
