import { ARTIFACT_DEFINITIONS } from "@/data/artifactDefinitions";
import { CONSTRUCTION_PROJECT_EVENTS } from "@/data/constructionProjectEvents";
import { CONSTRUCTION_PROJECT_LOCATION_ACTIONS } from "@/data/constructionProjectLocationActions";
import { CONSTRUCTION_PROJECT_MAINLINE_TASKS } from "@/data/constructionProjectMainlineTasks";
import {
  LEGACY_CHAPTER1_EVENT_SLUGS,
  LEGACY_CHAPTER1_STORY_ENTRY_SLUGS,
  LEGACY_CHAPTER1_TASK_SLUGS,
} from "@/data/legacyChapter1Slugs";
import {
  LEGACY_STAGE_MAINLINE_TASK_SLUGS,
  LEGACY_STAGE_STORY_ENTRY_SLUGS,
} from "@/data/legacyStageTaskSlugs";
import { withContentOrchestrationCache } from "@/lib/contentOrchestrationCache";
import type { ContentStudioData } from "./contentStudioLoader";
import {
  buildArtifactRow,
  buildOrchestrationCleanup,
  buildTaskRow,
  loadContentOrchestrationData,
  ORCHESTRATION_MAINLINE_STAGES,
  type ContentOrchestrationOverview,
  type OrchestrationAction,
  type OrchestrationArtifact,
  type OrchestrationEvent,
  type OrchestrationStage,
  type OrchestrationStoryEntry,
  type OrchestrationTask,
} from "./contentOrchestrationLoader";
import { loadOrchestrationCleanupPayload } from "./contentOrchestrationCleanupPayload";
import { loadPayloadDocIds } from "./contentOrchestrationPayload";
import { PROJECT_STAGES } from "./projectStages";
import type { EventTemplateData, TaskTemplateData } from "./types";

function buildActionIndex(
  locationActions: Array<{ id: string; triggerTaskSlugs?: string[] }>,
) {
  const actionIndex = new Map<string, string[]>();
  for (const action of locationActions) {
    for (const slug of action.triggerTaskSlugs || []) {
      const list = actionIndex.get(slug) || [];
      if (!list.includes(action.id)) list.push(action.id);
      actionIndex.set(slug, list);
    }
  }
  return actionIndex;
}

function buildEventIndex(eventTemplates: EventTemplateData[]) {
  const eventIndex = new Map<string, string[]>();
  for (const event of eventTemplates) {
    for (const slug of event.triggerTaskSlugs || []) {
      const list = eventIndex.get(slug) || [];
      if (event.slug && !list.includes(event.slug)) list.push(event.slug);
      eventIndex.set(slug, list);
    }
  }
  return eventIndex;
}

function buildMainlineTaskRows(
  taskTemplates: TaskTemplateData[],
  taskTemplateDocIds: Record<string, string | number>,
  storyEntryDocIds: Record<string, string | number>,
  locationActions: Array<{ id: string; triggerTaskSlugs?: string[] }>,
  eventTemplates: EventTemplateData[],
) {
  const seedMainline = CONSTRUCTION_PROJECT_MAINLINE_TASKS.filter(
    (t) => t.category === "mainline",
  );
  const seedCorrection = CONSTRUCTION_PROJECT_MAINLINE_TASKS.filter(
    (t) => t.category === "correction",
  );
  const allSeedTasks = [...seedMainline, ...seedCorrection];
  const studioView = {
    taskTemplates,
    taskTemplateDocIds,
    storyEntryDocIds,
  } as ContentStudioData;

  const actionIndex = buildActionIndex(locationActions);
  const eventIndex = buildEventIndex(eventTemplates);
  return allSeedTasks.map((seed) => buildTaskRow(seed, studioView, actionIndex, eventIndex));
}

function buildTaskStages(allTasks: OrchestrationTask[]): OrchestrationStage[] {
  return ORCHESTRATION_MAINLINE_STAGES.map((stageId) => {
    const config = PROJECT_STAGES.find((s) => s.id === stageId);
    const tasks = allTasks.filter((t) => t.stage === stageId && t.category === "mainline");
    const correctionTasks = allTasks.filter(
      (t) => t.stage === stageId && t.category === "correction",
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
      artifacts: [],
      actions: [],
      events: [],
      stageProgressSum,
      stageGateReady: stageProgressSum >= 99 && tasks.length > 0,
      warnings,
    };
  });
}

function parseArtifactSlug(ref: string): string {
  return ref.split(":")[0];
}

function classifyEvent(event: EventTemplateData): OrchestrationEvent["kind"] {
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

function countCleanupIssues(cleanup: ReturnType<typeof buildOrchestrationCleanup>): number {
  return [
    ...cleanup.oldTasks,
    ...cleanup.oldEvents,
    ...cleanup.oldStoryEntries,
    ...cleanup.oldLocationActions,
    ...cleanup.oldInkFiles,
    ...cleanup.oldStageTasks,
    ...cleanup.oldStageStoryEntries,
  ].filter((item) => item.found).length;
}

async function loadOrchestrationCleanupState(refresh = false) {
  return withContentOrchestrationCache(
    "orchestration:cleanup-state",
    async () => {
      const cleanupResult = await loadOrchestrationCleanupPayload();
      return buildOrchestrationCleanup(cleanupResult.payload, {
        payloadCheckAvailable: cleanupResult.payloadCheckAvailable,
      });
    },
    { refresh },
  );
}

export async function loadContentOrchestrationOverview(
  refresh = false,
): Promise<ContentOrchestrationOverview> {
  return withContentOrchestrationCache(
    "orchestration:overview",
    async () => {
      const cleanup = await loadOrchestrationCleanupState(refresh);
      const issueCount = countCleanupIssues(cleanup);

      const seedMainline = CONSTRUCTION_PROJECT_MAINLINE_TASKS.filter(
        (t) => t.category === "mainline",
      );
      const seedCorrection = CONSTRUCTION_PROJECT_MAINLINE_TASKS.filter(
        (t) => t.category === "correction",
      );

      const stages = ORCHESTRATION_MAINLINE_STAGES.map((stageId) => {
        const config = PROJECT_STAGES.find((s) => s.id === stageId);
        const tasks = seedMainline.filter((t) => t.stage === stageId);
        const corrections = seedCorrection.filter((t) => t.stage === stageId);
        const stageProgressSum = tasks.reduce(
          (sum, t) => sum + (t.successEffects?.stageProgress || 0),
          0,
        );
        return {
          stageId,
          stageName: config?.name || stageId,
          requiredMilestones: config?.requiredMilestones || [],
          mainlineCount: tasks.length,
          correctionCount: corrections.length,
          stageProgressSum,
          stageGateReady: stageProgressSum >= 99 && tasks.length > 0,
        };
      });

      return {
        overview: {
          mainlineTaskCount: seedMainline.length,
          correctionTaskCount: seedCorrection.length,
          artifactCount: ARTIFACT_DEFINITIONS.length,
          constructionActionCount: CONSTRUCTION_PROJECT_LOCATION_ACTIONS.length,
          constructionEventCount: CONSTRUCTION_PROJECT_EVENTS.length,
          genericInkCount: 4,
        },
        stages,
        cleanup: {
          clean: cleanup.clean,
          issueCount,
          payloadCheckAvailable: cleanup.payloadCheckAvailable,
        },
        health: {
          summary: !cleanup.payloadCheckAvailable
            ? "编排概览：Payload cleanup 检查不可用，无法确认旧数据已清理"
            : cleanup.clean
              ? "编排概览：旧数据已清理，详细健康检查请打开「健康检查」Tab"
              : `编排概览：检测到 ${issueCount} 项旧数据残留，请打开「旧数据清理」Tab`,
          errorCount: !cleanup.payloadCheckAvailable
            ? 1
            : cleanup.clean
              ? 0
              : issueCount,
          warningCount: !cleanup.payloadCheckAvailable ? 1 : 0,
        },
      };
    },
    { refresh },
  );
}

export async function loadOrchestrationTasksTab(refresh = false) {
  return withContentOrchestrationCache(
    "orchestration:tasks",
    async () => {
      const { getTaskTemplates } = await import("./contentLoader");
      const { getLocationActions } = await import("./locationActionLoader");
      const { getEventTemplates } = await import("./eventTemplateLoader");

      const [taskTemplates, locationActions, eventTemplates, docIds] = await Promise.all([
        getTaskTemplates(),
        getLocationActions(),
        getEventTemplates(),
        loadPayloadDocIds(["task-templates", "story-entries"]),
      ]);

      const mergedActions = [
        ...CONSTRUCTION_PROJECT_LOCATION_ACTIONS,
        ...locationActions.filter(
          (action) => !CONSTRUCTION_PROJECT_LOCATION_ACTIONS.some((seed) => seed.id === action.id),
        ),
      ];

      const allTasks = buildMainlineTaskRows(
        taskTemplates,
        docIds.taskTemplateDocIds,
        docIds.storyEntryDocIds,
        mergedActions,
        eventTemplates,
      );
      return { stages: buildTaskStages(allTasks) };
    },
    { refresh },
  );
}

export async function loadOrchestrationArtifactsTab(refresh = false) {
  return withContentOrchestrationCache(
    "orchestration:artifacts",
    async () => {
      const { getTaskTemplates } = await import("./contentLoader");
      const { getEventTemplates } = await import("./eventTemplateLoader");
      const { loadArtifactDefinitions } = await import("./artifactLoader");

      const [taskTemplates, eventTemplates, artifactDefinitions, docIds] = await Promise.all([
        getTaskTemplates(),
        getEventTemplates(),
        loadArtifactDefinitions(),
        loadPayloadDocIds(["artifact-definitions"]),
      ]);

      const allTasks = buildMainlineTaskRows(taskTemplates, {}, {}, [], eventTemplates);
      const studioView = {
        taskTemplates,
        artifactDefinitions,
        artifactDefinitionDocIds: docIds.artifactDefinitionDocIds,
      } as ContentStudioData;

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
      for (const event of eventTemplates) {
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
          studioView,
          artifactProducers,
          artifactConsumers,
          artifactEventMap,
          mainlineArtifactSlugs,
        ),
      );

      const terminalTask =
        allTasks.find((t) => t.slug === "submit_construction_permit_application") || null;

      return { artifacts, terminalTask };
    },
    { refresh },
  );
}

export async function loadOrchestrationActionsTab(refresh = false) {
  return withContentOrchestrationCache(
    "orchestration:actions",
    async () => {
      const { getTaskTemplates } = await import("./contentLoader");
      const { getLocationActions } = await import("./locationActionLoader");
      const { getMapLocations } = await import("./locationLoader");

      const [taskTemplates, locationActions, mapLocations, docIds] = await Promise.all([
        getTaskTemplates(),
        getLocationActions(),
        getMapLocations(),
        loadPayloadDocIds(["location-actions", "map-locations"]),
      ]);

      const allTaskSlugs = new Set(taskTemplates.map((t) => t.slug));
      const mapLocationIds = new Set(mapLocations.map((l) => l.id));
      const legacyTaskSet = new Set<string>([
        ...LEGACY_CHAPTER1_TASK_SLUGS,
        ...LEGACY_STAGE_MAINLINE_TASK_SLUGS,
      ]);

      const allActions: OrchestrationAction[] = locationActions.map((action) => {
        const seed = CONSTRUCTION_PROJECT_LOCATION_ACTIONS.find((a) => a.id === action.id);
        const risks: string[] = [];
        const triggers = action.triggerTaskSlugs || [];
        const actionEnabled = (action as { enabled?: boolean }).enabled;
        if (actionEnabled !== false && triggers.length === 0) {
          risks.push("enabled 但无 triggerTaskSlugs");
        }
        for (const slug of triggers) {
          if (legacyTaskSet.has(slug)) risks.push(`触发旧主线任务 ${slug}`);
          if (
            !allTaskSlugs.has(slug) &&
            !CONSTRUCTION_PROJECT_MAINLINE_TASKS.some((t) => t.slug === slug)
          ) {
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
          payloadDocId: docIds.locationActionDocIds[action.id],
          risks,
        };
      });

      return { allActions };
    },
    { refresh },
  );
}

export async function loadOrchestrationEventsTab(refresh = false) {
  return withContentOrchestrationCache(
    "orchestration:events",
    async () => {
      const { getTaskTemplates } = await import("./contentLoader");
      const { getEventTemplates } = await import("./eventTemplateLoader");
      const { getStoryEntries } = await import("./storyEntryLoader");

      const [taskTemplates, eventTemplates, storyEntries, docIds] = await Promise.all([
        getTaskTemplates(),
        getEventTemplates(),
        getStoryEntries(),
        loadPayloadDocIds(["event-templates"]),
      ]);

      const allTaskSlugs = new Set(taskTemplates.map((t) => t.slug));
      const constructionEventSlugs = new Set(
        CONSTRUCTION_PROJECT_EVENTS.map((e) => String(e.slug)),
      );

      const allEvents: OrchestrationEvent[] = eventTemplates.map((event) => {
        const risks: string[] = [];
        const slug = event.slug || "";
        if (
          LEGACY_CHAPTER1_EVENT_SLUGS.includes(
            slug as (typeof LEGACY_CHAPTER1_EVENT_SLUGS)[number],
          )
        ) {
          risks.push("旧 Chapter1 事件仍存在");
        }
        if (constructionEventSlugs.has(slug) && event.enabled === false) {
          risks.push("正式建设项目事件被禁用");
        }
        for (const tslug of event.triggerTaskSlugs || []) {
          if (
            !allTaskSlugs.has(tslug) &&
            !CONSTRUCTION_PROJECT_MAINLINE_TASKS.some((t) => t.slug === tslug)
          ) {
            risks.push(`triggerTaskSlugs 引用不存在任务 ${tslug}`);
          }
        }
        for (const eff of event.artifactEffects || []) {
          if (
            eff.artifactSlug &&
            !ARTIFACT_DEFINITIONS.some((a) => a.slug === eff.artifactSlug)
          ) {
            risks.push(`artifactEffects 引用不存在成果物 ${eff.artifactSlug}`);
          }
        }
        if (event.storySlug && !storyEntries.some((s) => s.slug === event.storySlug)) {
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
          payloadDocId: event.slug ? docIds.eventTemplateDocIds[event.slug] : undefined,
          risks,
        };
      });

      return { allEvents };
    },
    { refresh },
  );
}

export async function loadOrchestrationStoriesTab(refresh = false) {
  return withContentOrchestrationCache(
    "orchestration:stories",
    async () => {
      const { getTaskTemplates } = await import("./contentLoader");
      const { getEventTemplates } = await import("./eventTemplateLoader");
      const { getStoryEntries } = await import("./storyEntryLoader");
      const fs = await import("fs");
      const path = await import("path");

      const [taskTemplates, eventTemplates, storyEntries, docIds] = await Promise.all([
        getTaskTemplates(),
        getEventTemplates(),
        getStoryEntries(),
        loadPayloadDocIds(["story-entries"]),
      ]);

      const storiesDir = path.join(process.cwd(), "src/ink/stories");
      const inkCompiled = (name: string) => fs.existsSync(path.join(storiesDir, `${name}.json`));
      const allTaskSlugs = new Set(taskTemplates.map((t) => t.slug));

      const allStoryEntries: OrchestrationStoryEntry[] = storyEntries.map((entry) => {
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
          if (
            !allTaskSlugs.has(tslug) &&
            !CONSTRUCTION_PROJECT_MAINLINE_TASKS.some((t) => t.slug === tslug)
          ) {
            risks.push(`relatedTaskSlugs 引用不存在任务 ${tslug}`);
          }
        }
        for (const eslug of entry.relatedEventSlugs || []) {
          if (!eventTemplates.some((e) => e.slug === eslug)) {
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
          payloadDocId: docIds.storyEntryDocIds[entry.slug],
          risks,
        };
      });

      return { allStoryEntries };
    },
    { refresh },
  );
}

export async function loadOrchestrationCleanupTab(refresh = false) {
  return withContentOrchestrationCache(
    "orchestration:cleanup",
    async () => ({
      cleanup: await loadOrchestrationCleanupState(refresh),
    }),
    { refresh },
  );
}

export async function loadOrchestrationHealthTab(refresh = false) {
  const { buildContentHealthCheckFromStudioData } = await import("./contentHealthCheck");

  return withContentOrchestrationCache(
    "orchestration:health",
    async () => {
      const data = await loadContentOrchestrationData();
      const healthReport = buildContentHealthCheckFromStudioData(data.studio);
      return { health: data.health, healthReport };
    },
    { refresh, ttlMs: 30_000 },
  );
}
