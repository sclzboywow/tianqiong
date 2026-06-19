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
import {
  LEGACY_STAGE_MAINLINE_TASK_SLUGS,
  LEGACY_STAGE_STORY_ENTRY_SLUGS,
} from "@/data/legacyStageTaskSlugs";
import { PROJECT_STAGES, type ProjectStageId } from "./projectStages";
import type { OrchestrationCleanupPayload } from "./contentOrchestrationCleanupPayload";
import type { TaskTemplateData, EventTemplateData, StoryEntryData } from "./types";
import type { ArtifactDefinitionData } from "./types";

export const ORCHESTRATION_MAINLINE_STAGES: ProjectStageId[] = [
  "INITIATION",
  "APPROVAL",
  "DESIGN",
  "PROCUREMENT",
  "CONSTRUCTION",
];

const MAINLINE_STAGES = ORCHESTRATION_MAINLINE_STAGES;

const GENERIC_INK_FILES = [
  "project_document_task",
  "project_meeting_task",
  "project_submit_review_task",
  "project_correction_task",
];

const STORIES_DIR = path.join(process.cwd(), "src/ink/stories");

export type ConfigSource = "payload" | "seedFallback" | "mismatch";

export type CleanupItem = {
  slug: string;
  kind: string;
  source: "payload" | "filesystem";
  found: boolean;
  detail?: string;
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
  source: ConfigSource;
  mismatchFields: string[];
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
  source: ConfigSource;
  mismatchFields: string[];
  enabled?: boolean;
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
    oldStageTasks: CleanupItem[];
    oldStageStoryEntries: CleanupItem[];
    clean: boolean;
    payloadCheckAvailable: boolean;
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

function sortedStrings(values: string[]): string[] {
  return [...values].sort();
}

function sameStringArrays(a: string[], b: string[]): boolean {
  return JSON.stringify(sortedStrings(a)) === JSON.stringify(sortedStrings(b));
}

function formatArtifactRefs(
  refs: Array<{ artifactSlug: string; status?: string; minStatus?: string }> | undefined,
): string[] {
  return (refs || []).map((ref) => {
    const status = ref.status || ref.minStatus;
    return status ? `${ref.artifactSlug}:${status}` : ref.artifactSlug;
  });
}

function detectTaskMismatch(seed: TaskTemplateData, payload: TaskTemplateData): string[] {
  const fields: string[] = [];
  if (seed.title !== payload.title) fields.push("title");
  if ((seed.category || "mainline") !== (payload.category || "mainline")) fields.push("category");
  if (seed.stage !== payload.stage) fields.push("stage");
  if (seed.successEffects?.stageProgress !== payload.successEffects?.stageProgress) {
    fields.push("stageProgress");
  }
  if (!sameStringArrays(formatArtifactRefs(seed.inputArtifacts), formatArtifactRefs(payload.inputArtifacts))) {
    fields.push("inputArtifacts");
  }
  if (!sameStringArrays(formatArtifactRefs(seed.outputArtifacts), formatArtifactRefs(payload.outputArtifacts))) {
    fields.push("outputArtifacts");
  }
  if (
    !sameStringArrays(
      Object.keys(seed.milestoneEffects || {}),
      Object.keys(payload.milestoneEffects || {}),
    )
  ) {
    fields.push("milestoneEffects");
  }
  if (!sameStringArrays(seed.prerequisiteTaskSlugs || [], payload.prerequisiteTaskSlugs || [])) {
    fields.push("prerequisiteTaskSlugs");
  }
  if (!sameStringArrays(seed.requiredMilestones || [], payload.requiredMilestones || [])) {
    fields.push("requiredMilestones");
  }
  const seedStory = seed.storySlug || `story_${seed.slug}`;
  const payloadStory = payload.storySlug || `story_${payload.slug}`;
  if (seedStory !== payloadStory) fields.push("storySlug");
  return fields;
}

export function buildTaskRow(
  seed: TaskTemplateData,
  studio: ContentStudioData,
  actionIndex: Map<string, string[]>,
  eventIndex: Map<string, string[]>,
): OrchestrationTask {
  const payload = studio.taskTemplates.find((t) => t.slug === seed.slug);
  const payloadDocId = studio.taskTemplateDocIds[seed.slug];
  const merged: TaskTemplateData = payload ? { ...seed, ...payload } : seed;

  const storySlug = merged.storySlug || `story_${merged.slug}`;
  const mismatchFields = payload ? detectTaskMismatch(seed, payload) : [];
  let source: ConfigSource = "seedFallback";
  if (payload && payloadDocId != null) {
    source = mismatchFields.length > 0 ? "mismatch" : "payload";
  }

  return {
    slug: seed.slug,
    title: merged.title,
    category: merged.category,
    stage: merged.stage,
    stageProgress: merged.successEffects?.stageProgress,
    prerequisiteTaskSlugs: merged.prerequisiteTaskSlugs || [],
    requiredMilestones: merged.requiredMilestones || [],
    inputArtifacts: (merged.inputArtifacts || []).map((a) => a.artifactSlug),
    outputArtifacts: formatArtifactRefs(merged.outputArtifacts),
    milestoneEffects: Object.keys(merged.milestoneEffects || {}),
    relatedActionSlugs: actionIndex.get(seed.slug) || [],
    relatedStorySlug: storySlug,
    relatedEventSlugs: eventIndex.get(seed.slug) || [],
    enabled: (merged as { enabled?: boolean }).enabled ?? true,
    payloadDocId,
    storyEntryDocId: studio.storyEntryDocIds[storySlug],
    source,
    mismatchFields,
  };
}

function detectArtifactMismatch(
  seed: ArtifactDefinitionData,
  payload: ArtifactDefinitionData,
): string[] {
  const fields: string[] = [];
  if (seed.name !== payload.name) fields.push("name");
  if (seed.stage !== payload.stage) fields.push("stage");
  if (seed.defaultStatus !== payload.defaultStatus) fields.push("defaultStatus");
  const seedStatuses = (seed.allowedStatuses || []).map((s) =>
    typeof s === "string" ? s : s.status,
  );
  const payloadStatuses = (payload.allowedStatuses || []).map((s) =>
    typeof s === "string" ? s : s.status,
  );
  if (!sameStringArrays(seedStatuses, payloadStatuses)) fields.push("allowedStatuses");
  return fields;
}

export function buildArtifactRow(
  seed: ArtifactDefinitionData,
  studio: ContentStudioData,
  artifactProducers: Map<string, string[]>,
  artifactConsumers: Map<string, string[]>,
  artifactEventMap: Map<string, string[]>,
  mainlineArtifactSlugs: Set<string>,
): OrchestrationArtifact {
  const payload = studio.artifactDefinitions.find((a) => a.slug === seed.slug);
  const payloadDocId = studio.artifactDefinitionDocIds[seed.slug];
  const merged = payload ? { ...seed, ...payload } : seed;
  const mismatchFields = payload ? detectArtifactMismatch(seed, payload) : [];
  const undefinedRefs: string[] = [];
  if (!payloadDocId) undefinedRefs.push("后台未注册，请 seed");

  let source: ConfigSource = "seedFallback";
  if (payload && payloadDocId != null) {
    source = mismatchFields.length > 0 ? "mismatch" : "payload";
  }

  return {
    slug: seed.slug,
    name: merged.name,
    stage: merged.stage,
    defaultStatus: merged.defaultStatus,
    allowedStatuses: (merged.allowedStatuses || []).map((s) =>
      typeof s === "string" ? s : s.status,
    ),
    usedByMainline: mainlineArtifactSlugs.has(seed.slug),
    producedBy: artifactProducers.get(seed.slug) || [],
    requiredBy: artifactConsumers.get(seed.slug) || [],
    affectedByEvents: artifactEventMap.get(seed.slug) || [],
    undefinedRefs,
    payloadDocId,
    source,
    mismatchFields,
    enabled: (merged as { enabled?: boolean }).enabled ?? true,
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

type CleanupRecordMeta = {
  enabled: boolean;
  category?: string;
};

function toCleanupRecordMap(
  records: OrchestrationCleanupPayload[keyof OrchestrationCleanupPayload],
): Map<string, CleanupRecordMeta> {
  return new Map(records.map((record) => [record.slug, record]));
}

function cleanupDetailForRecord(record: CleanupRecordMeta): string | undefined {
  if (record.enabled === false) return "已 disabled 但仍存在于 Payload";
  return undefined;
}

function buildCleanupItems(
  slugs: readonly string[],
  kind: string,
  recordMap: Map<string, CleanupRecordMeta>,
  fsCheck?: (slug: string) => boolean,
): CleanupItem[] {
  return slugs.map((slug) => {
    const record = recordMap.get(slug);
    const inPayload = record != null;
    const inFs = fsCheck ? fsCheck(slug) : false;
    return {
      slug,
      kind,
      source: inPayload ? "payload" : inFs ? "filesystem" : "payload",
      found: inPayload || inFs,
      detail: inPayload ? cleanupDetailForRecord(record) : undefined,
    };
  });
}

function parseArtifactSlug(ref: string): string {
  return ref.split(":")[0];
}

function collectStageArtifactSlugs(tasks: OrchestrationTask[]): Set<string> {
  const slugs = new Set<string>();
  for (const task of tasks) {
    for (const ref of task.inputArtifacts) slugs.add(parseArtifactSlug(ref));
    for (const ref of task.outputArtifacts) slugs.add(parseArtifactSlug(ref));
  }
  return slugs;
}

export type ContentOrchestrationOverview = {
  overview: ContentOrchestrationData["overview"];
  stages: Array<{
    stageId: string;
    stageName: string;
    requiredMilestones: string[];
    mainlineCount: number;
    correctionCount: number;
    stageProgressSum: number;
    stageGateReady: boolean;
  }>;
  cleanup: {
    clean: boolean;
    issueCount: number;
    payloadCheckAvailable: boolean;
  };
  health: {
    summary: string;
    errorCount: number;
    warningCount: number;
  };
};

export function buildOrchestrationCleanup(
  input: OrchestrationCleanupPayload,
  options: { payloadCheckAvailable: boolean },
): ContentOrchestrationData["cleanup"] {
  const taskRecordMap = toCleanupRecordMap(input.taskTemplates);
  const eventRecordMap = toCleanupRecordMap(input.eventTemplates);
  const storyRecordMap = toCleanupRecordMap(input.storyEntries);
  const actionRecordMap = toCleanupRecordMap(input.locationActions);

  const oldStageTasks: CleanupItem[] = LEGACY_STAGE_MAINLINE_TASK_SLUGS.map((slug) => {
    const record = taskRecordMap.get(slug);
    const exists = record != null;
    let detail: string | undefined;
    if (exists && record.category === "mainline") {
      detail = "仍作为 mainline 存在";
    } else if (exists && record.enabled === false) {
      detail = "已 disabled 但仍存在于 Payload";
    } else if (exists) {
      detail = `存在但 category=${record.category || "?"}`;
    }
    return {
      slug,
      kind: "legacy-stage-task",
      source: "payload" as const,
      found: exists,
      detail,
    };
  });

  const legacyStageStorySlugs = [
    ...new Set([...LEGACY_STAGE_STORY_ENTRY_SLUGS, ...LEGACY_STAGE_MAINLINE_TASK_SLUGS]),
  ];

  const cleanup = {
    oldTasks: buildCleanupItems(LEGACY_CHAPTER1_TASK_SLUGS, "chapter1-task", taskRecordMap),
    oldEvents: buildCleanupItems(LEGACY_CHAPTER1_EVENT_SLUGS, "chapter1-event", eventRecordMap),
    oldStoryEntries: buildCleanupItems(
      LEGACY_CHAPTER1_STORY_ENTRY_SLUGS,
      "chapter1-story",
      storyRecordMap,
    ),
    oldLocationActions: buildCleanupItems(
      LEGACY_CHAPTER1_LOCATION_ACTION_SLUGS,
      "chapter1-action",
      actionRecordMap,
    ),
    oldInkFiles: LEGACY_CHAPTER1_INK_FILES.map((slug) => ({
      slug,
      kind: "ink",
      source: "filesystem" as const,
      found: inkExists(slug) || inkCompiled(slug),
    })),
    oldStageTasks,
    oldStageStoryEntries: buildCleanupItems(
      legacyStageStorySlugs,
      "legacy-stage-story",
      storyRecordMap,
    ),
    clean: false,
    payloadCheckAvailable: options.payloadCheckAvailable,
  };
  const hasResidual = [
    ...cleanup.oldTasks,
    ...cleanup.oldEvents,
    ...cleanup.oldStoryEntries,
    ...cleanup.oldLocationActions,
    ...cleanup.oldInkFiles,
    ...cleanup.oldStageTasks.filter((item) => item.found),
    ...cleanup.oldStageStoryEntries,
  ].some((item) => item.found);
  cleanup.clean = options.payloadCheckAvailable && !hasResidual;
  return cleanup;
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
    buildTaskRow(seed, studio, actionIndex, eventIndex),
  );

  const artifactProducers = new Map<string, string[]>();
  const artifactConsumers = new Map<string, string[]>();
  for (const task of allTasks) {
    for (const ref of task.outputArtifacts) {
      const slug = parseArtifactSlug(ref);
      const list = artifactProducers.get(slug) || [];
      list.push(task.slug);
      artifactProducers.set(slug, list);
    }
    for (const slug of task.inputArtifacts) {
      const list = artifactConsumers.get(slug) || [];
      list.push(task.slug);
      artifactConsumers.set(slug, list);
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
  for (const task of allTasks) {
    for (const ref of task.outputArtifacts) mainlineArtifactSlugs.add(parseArtifactSlug(ref));
    for (const slug of task.inputArtifacts) mainlineArtifactSlugs.add(slug);
  }

  const artifacts: OrchestrationArtifact[] = ARTIFACT_DEFINITIONS.map((def) =>
    buildArtifactRow(
      def,
      studio,
      artifactProducers,
      artifactConsumers,
      artifactEventMap,
      mainlineArtifactSlugs,
    ),
  );

  const mapLocationIds = new Set(studio.mapLocations.map((l) => l.id));
  const legacyTaskSet = new Set<string>([
    ...LEGACY_CHAPTER1_TASK_SLUGS,
    ...LEGACY_STAGE_MAINLINE_TASK_SLUGS,
  ]);

  const allActions: OrchestrationAction[] = studio.locationActions.map((action) => {
    const seed = CONSTRUCTION_PROJECT_LOCATION_ACTIONS.find((a) => a.id === action.id);
    const risks: string[] = [];
    const triggers = action.triggerTaskSlugs || [];
    const actionEnabled = (action as { enabled?: boolean }).enabled;
    if (actionEnabled !== false && triggers.length === 0) {
      risks.push("enabled 但无 triggerTaskSlugs");
    }
    for (const slug of triggers) {
      if (legacyTaskSet.has(slug)) risks.push(`触发旧主线任务 ${slug}`);
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
    if (
      LEGACY_STAGE_STORY_ENTRY_SLUGS.includes(
        entry.slug as (typeof LEGACY_STAGE_STORY_ENTRY_SLUGS)[number],
      )
    ) {
      risks.push("旧阶段主线 StoryEntry");
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
    const stageArtifactSlugs = collectStageArtifactSlugs([...tasks, ...correctionTasks]);
    const stageArtifacts = artifacts.filter(
      (a) => a.stage === stageId || stageArtifactSlugs.has(a.slug),
    );
    const actions = allActions.filter(
      (a) =>
        a.unlockStage === stageId ||
        CONSTRUCTION_PROJECT_LOCATION_ACTIONS.some(
          (s) => s.id === a.slug && s.unlockStage === stageId,
        ),
    );
    const events = allEvents.filter((e) => e.triggerStage === stageId);
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
      if (task.source === "seedFallback") {
        warnings.push(`主线任务 ${task.slug} 后台未同步（seedFallback）`);
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

  const { loadOrchestrationCleanupPayload } = await import("./contentOrchestrationCleanupPayload");
  const cleanupResult = await loadOrchestrationCleanupPayload();
  const cleanup = buildOrchestrationCleanup(cleanupResult.payload, {
    payloadCheckAvailable: cleanupResult.payloadCheckAvailable,
  });

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
