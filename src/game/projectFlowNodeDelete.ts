import { prisma } from "@/prisma/client";
import type { LocationAction } from "@/data/locationActions";
import type {
  EventTaskEffect,
  EventTemplateData,
  StoryEntryData,
  TaskTemplateData,
} from "./types";
import {
  getOpsPayloadContext,
  refreshProjectFlowCaches,
} from "./projectFlowNodeMutations";
import {
  loadOpsStudioSnapshot,
  type OpsStudioSnapshot,
} from "./opsStudioLoader";
import { clearDependencyTaskTitleCache } from "./dependencyEngine";
import { getTaskDisplayName } from "./contentDisplayLabels";

export type ProjectFlowNodeReferenceBundle = {
  task: TaskTemplateData;
  taskDocId: string | number;
  actions: Array<LocationAction & { payloadDocId: string | number }>;
  events: Array<EventTemplateData & { payloadDocId: string | number }>;
  stories: Array<StoryEntryData & { payloadDocId: string | number }>;
};

export type ProjectFlowNodeLifecycleSummary = {
  tasks: number;
  actions: number;
  events: number;
  stories: number;
};

export type ProjectFlowNodeDeleteBlocker = {
  kind: string;
  message: string;
  refs: string[];
};

function toSlugPayload(slugs: string[]) {
  return slugs.map((slug) => ({ slug }));
}

function removeTaskFromTriggerSlugs(
  slugs: string[] | undefined,
  taskSlug: string,
): string[] {
  return (slugs || []).filter((item) => item !== taskSlug);
}

function addTaskToTriggerSlugs(
  slugs: string[] | undefined,
  taskSlug: string,
): string[] {
  return [...new Set([...(slugs || []), taskSlug])];
}

function removeTaskFromEventEffects(
  effects: EventTaskEffect[] | undefined,
  taskSlug: string,
): EventTaskEffect[] {
  return (effects || []).filter((effect) => effect.taskSlug !== taskSlug);
}

function addTaskToEventEffects(
  effects: EventTaskEffect[] | undefined,
  taskSlug: string,
): EventTaskEffect[] {
  const next = [...(effects || [])];
  if (!next.some((effect) => effect.taskSlug === taskSlug)) {
    next.push({ action: "spawn", taskSlug });
  }
  return next;
}

function eventReferencesTask(event: EventTemplateData, slug: string): boolean {
  if ((event.triggerTaskSlugs || []).includes(slug)) return true;
  return (event.taskEffects || []).some((effect) => effect.taskSlug === slug);
}

function storyReferencesTask(
  story: StoryEntryData,
  slug: string,
  storySlug?: string,
): boolean {
  if (storySlug && story.slug === storySlug) return true;
  return (story.relatedTaskSlugs || []).includes(slug);
}

function storyOnlyServesTask(story: StoryEntryData, slug: string): boolean {
  const related = [...new Set(story.relatedTaskSlugs || [])];
  return related.length === 1 && related[0] === slug;
}

function actionExclusiveToTask(action: LocationAction, slug: string): boolean {
  const slugs = action.triggerTaskSlugs || [];
  return slugs.length > 0 && slugs.every((item) => item === slug);
}

function eventExclusiveToTask(event: EventTemplateData, slug: string): boolean {
  const triggerSlugs = event.triggerTaskSlugs || [];
  const effectSlugs = (event.taskEffects || [])
    .map((effect) => effect.taskSlug)
    .filter(Boolean);
  const all = [...triggerSlugs, ...effectSlugs];
  return all.length > 0 && all.every((item) => item === slug);
}

function mapActionsForTask(
  studio: OpsStudioSnapshot,
  actions: OpsStudioSnapshot["locationActions"],
) {
  return actions
    .map((action) => ({
      ...action,
      payloadDocId: studio.locationActionDocIds[action.id],
    }))
    .filter((action) => action.payloadDocId != null) as Array<
    LocationAction & { payloadDocId: string | number }
  >;
}

function mapEventsForTask(
  studio: OpsStudioSnapshot,
  events: EventTemplateData[],
) {
  return events
    .map((event) => ({
      ...event,
      payloadDocId: studio.eventTemplateDocIds[event.slug],
    }))
    .filter((event) => event.payloadDocId != null) as Array<
    EventTemplateData & { payloadDocId: string | number }
  >;
}

function mapStoriesForTask(
  studio: OpsStudioSnapshot,
  stories: StoryEntryData[],
) {
  return stories
    .map((story) => ({
      ...story,
      payloadDocId: studio.storyEntryDocIds[story.slug],
    }))
    .filter((story) => story.payloadDocId != null) as Array<
    StoryEntryData & { payloadDocId: string | number }
  >;
}

export function findProjectFlowNodeReferences(
  studio: OpsStudioSnapshot,
  slug: string,
  options?: { forRestore?: boolean },
): ProjectFlowNodeReferenceBundle | null {
  const task = studio.taskTemplates.find((item) => item.slug === slug);
  if (!task) return null;

  const taskDocId = studio.taskTemplateDocIds[slug];
  if (taskDocId == null) return null;

  const matchedActions = studio.locationActions.filter((action) => {
    if ((action.triggerTaskSlugs || []).includes(slug)) return true;
    if (options?.forRestore && action.id === `action_${slug}`) return true;
    return false;
  });

  const matchedEvents = studio.eventTemplates.filter((event) => {
    if (eventReferencesTask(event, slug)) return true;
    if (options?.forRestore && event.slug === `event_${slug}`) return true;
    return false;
  });

  const matchedStories = studio.storyEntries.filter((story) => {
    if (storyReferencesTask(story, slug, task.storySlug)) return true;
    if (options?.forRestore && task.storySlug && story.slug === task.storySlug) {
      return true;
    }
    return false;
  });

  return {
    task,
    taskDocId,
    actions: mapActionsForTask(studio, matchedActions),
    events: mapEventsForTask(studio, matchedEvents),
    stories: mapStoriesForTask(studio, matchedStories),
  };
}

export async function validateProjectFlowNodeDelete(
  slug: string,
): Promise<{ ok: boolean; blockers: ProjectFlowNodeDeleteBlocker[] }> {
  const studio = await loadOpsStudioSnapshot();
  const bundle = findProjectFlowNodeReferences(studio, slug);
  const blockers: ProjectFlowNodeDeleteBlocker[] = [];

  if (!bundle) {
    return {
      ok: false,
      blockers: [{ kind: "missing", message: "流程节点不存在", refs: [slug] }],
    };
  }

  if (bundle.task.category !== "mainline") {
    return {
      ok: false,
      blockers: [
        {
          kind: "category",
          message: "仅允许永久删除主线流程节点",
          refs: [slug],
        },
      ],
    };
  }

  for (const task of studio.taskTemplates) {
    if (task.slug === slug || task.enabled === false) continue;
    if ((task.prerequisiteTaskSlugs || []).includes(slug)) {
      blockers.push({
        kind: "prerequisite",
        message: `任务「${getTaskDisplayName(task.slug, studio.taskTemplates)}」将其设为前置任务`,
        refs: [task.slug],
      });
    }
  }

  const runtimeCount = await prisma.task.count({ where: { templateId: slug } });
  if (runtimeCount > 0) {
    blockers.push({
      kind: "runtime",
      message: "该任务可能已有运行记录，请先停用，不建议永久删除",
      refs: [slug],
    });
  }

  return { ok: blockers.length === 0, blockers };
}

async function setEnabledForBundle(
  bundle: ProjectFlowNodeReferenceBundle,
  enabled: boolean,
): Promise<{ summary: ProjectFlowNodeLifecycleSummary; warnings: string[] }> {
  const { payload, req, transactionStarted, commitTransaction, killTransaction } =
    await getOpsPayloadContext();
  const warnings: string[] = [];
  const slug = bundle.task.slug;

  let actionsUpdated = 0;
  let eventsUpdated = 0;
  let storiesUpdated = 0;

  try {
    await payload.update({
      collection: "task-templates",
      id: bundle.taskDocId,
      data: { enabled },
      req,
    });

    for (const action of bundle.actions) {
      if (enabled) {
        if (actionExclusiveToTask(action, slug)) {
          await payload.update({
            collection: "location-actions",
            id: action.payloadDocId,
            data: { enabled: true },
            req,
          });
        } else {
          const nextSlugs = addTaskToTriggerSlugs(action.triggerTaskSlugs, slug);
          await payload.update({
            collection: "location-actions",
            id: action.payloadDocId,
            data: {
              triggerTaskSlugs: toSlugPayload(nextSlugs),
              enabled: true,
            },
            req,
          });
          warnings.push(
            `地点行动「${action.label}」为共享资源，已恢复对本任务的触发关联`,
          );
        }
        actionsUpdated += 1;
        continue;
      }

      if (actionExclusiveToTask(action, slug)) {
        await payload.update({
          collection: "location-actions",
          id: action.payloadDocId,
          data: { enabled: false },
          req,
        });
      } else {
        const nextSlugs = removeTaskFromTriggerSlugs(action.triggerTaskSlugs, slug);
        await payload.update({
          collection: "location-actions",
          id: action.payloadDocId,
          data: {
            triggerTaskSlugs: toSlugPayload(nextSlugs),
            enabled: true,
          },
          req,
        });
        warnings.push(
          `地点行动「${action.label}」仍启用，已移除对本任务的触发关联`,
        );
      }
      actionsUpdated += 1;
    }

    for (const event of bundle.events) {
      if (enabled) {
        if (eventExclusiveToTask(event, slug)) {
          await payload.update({
            collection: "event-templates",
            id: event.payloadDocId,
            data: { enabled: true },
            req,
          });
        } else {
          const nextTriggerSlugs = addTaskToTriggerSlugs(
            event.triggerTaskSlugs,
            slug,
          );
          const nextEffects = addTaskToEventEffects(event.taskEffects, slug);
          await payload.update({
            collection: "event-templates",
            id: event.payloadDocId,
            data: {
              triggerTaskSlugs: toSlugPayload(nextTriggerSlugs),
              taskEffects: nextEffects,
              enabled: true,
            },
            req,
          });
          warnings.push(
            `事件「${event.title}」为共享资源，已恢复对本任务的关联`,
          );
        }
        eventsUpdated += 1;
        continue;
      }

      if (eventExclusiveToTask(event, slug)) {
        await payload.update({
          collection: "event-templates",
          id: event.payloadDocId,
          data: { enabled: false },
          req,
        });
      } else {
        const nextTriggerSlugs = removeTaskFromTriggerSlugs(
          event.triggerTaskSlugs,
          slug,
        );
        const nextEffects = removeTaskFromEventEffects(event.taskEffects, slug);
        await payload.update({
          collection: "event-templates",
          id: event.payloadDocId,
          data: {
            triggerTaskSlugs: toSlugPayload(nextTriggerSlugs),
            taskEffects: nextEffects,
            enabled: true,
          },
          req,
        });
        warnings.push(
          `事件「${event.title}」仍启用，已移除对本任务的关联`,
        );
      }
      eventsUpdated += 1;
    }

    for (const story of bundle.stories) {
      if (enabled) {
        if (storyOnlyServesTask(story, slug)) {
          await payload.update({
            collection: "story-entries",
            id: story.payloadDocId,
            data: { enabled: true },
            req,
          });
          storiesUpdated += 1;
        } else {
          const nextTaskSlugs = addTaskToTriggerSlugs(story.relatedTaskSlugs, slug);
          await payload.update({
            collection: "story-entries",
            id: story.payloadDocId,
            data: {
              relatedTaskSlugs: toSlugPayload(nextTaskSlugs),
              enabled: true,
            },
            req,
          });
          warnings.push(
            `剧情「${story.title}」为共享资源，已恢复对本任务的关联`,
          );
          storiesUpdated += 1;
        }
        continue;
      }

      if (storyOnlyServesTask(story, slug)) {
        await payload.update({
          collection: "story-entries",
          id: story.payloadDocId,
          data: { enabled: false },
          req,
        });
        storiesUpdated += 1;
      } else {
        const nextTaskSlugs = removeTaskFromTriggerSlugs(
          story.relatedTaskSlugs,
          slug,
        );
        await payload.update({
          collection: "story-entries",
          id: story.payloadDocId,
          data: {
            relatedTaskSlugs: toSlugPayload(nextTaskSlugs),
            enabled: true,
          },
          req,
        });
        warnings.push(
          `剧情「${story.title}」仍关联其它任务，已移除对本任务的引用`,
        );
        storiesUpdated += 1;
      }
    }

    if (transactionStarted) await commitTransaction(req);

    return {
      summary: {
        tasks: 1,
        actions: actionsUpdated,
        events: eventsUpdated,
        stories: storiesUpdated,
      },
      warnings,
    };
  } catch (error) {
    if (transactionStarted) await killTransaction(req);
    throw error;
  }
}

export async function disableProjectFlowNode(slug: string) {
  const studio = await loadOpsStudioSnapshot();
  const bundle = findProjectFlowNodeReferences(studio, slug);
  if (!bundle) throw new Error("流程节点不存在");
  if (bundle.task.category !== "mainline") {
    throw new Error("仅允许停用主线流程节点");
  }

  const { summary, warnings } = await setEnabledForBundle(bundle, false);
  clearDependencyTaskTitleCache();
  refreshProjectFlowCaches(slug);

  return {
    ok: true as const,
    slug,
    action: "disabled" as const,
    summary,
    warnings,
  };
}

export async function enableProjectFlowNode(slug: string) {
  const studio = await loadOpsStudioSnapshot();
  const bundle = findProjectFlowNodeReferences(studio, slug, { forRestore: true });
  if (!bundle) throw new Error("流程节点不存在");
  if (bundle.task.category !== "mainline") {
    throw new Error("仅允许恢复主线流程节点");
  }

  const { summary, warnings } = await setEnabledForBundle(bundle, true);
  clearDependencyTaskTitleCache();
  refreshProjectFlowCaches(slug);

  return {
    ok: true as const,
    slug,
    action: "enabled" as const,
    summary,
    warnings,
  };
}

async function cleanupStoryReferences(
  payload: Awaited<ReturnType<typeof getOpsPayloadContext>>["payload"],
  req: Awaited<ReturnType<typeof getOpsPayloadContext>>["req"],
  studio: OpsStudioSnapshot,
  slug: string,
  deletedEventSlugs: Set<string>,
  deletedStorySlugs: Set<string>,
) {
  for (const story of studio.storyEntries) {
    if (deletedStorySlugs.has(story.slug)) continue;
    const docId = studio.storyEntryDocIds[story.slug];
    if (docId == null) continue;

    const nextTaskSlugs = removeTaskFromTriggerSlugs(story.relatedTaskSlugs, slug);
    const nextEventSlugs = (story.relatedEventSlugs || []).filter(
      (item) => !deletedEventSlugs.has(item),
    );

    const taskChanged =
      nextTaskSlugs.length !== (story.relatedTaskSlugs || []).length;
    const eventChanged =
      nextEventSlugs.length !== (story.relatedEventSlugs || []).length;
    if (!taskChanged && !eventChanged) continue;

    await payload.update({
      collection: "story-entries",
      id: docId,
      data: {
        relatedTaskSlugs: toSlugPayload(nextTaskSlugs),
        relatedEventSlugs: toSlugPayload(nextEventSlugs),
      },
      req,
    });
  }
}

export async function deleteProjectFlowNode(
  slug: string,
  options: { deleteStories?: boolean } = {},
) {
  const validation = await validateProjectFlowNodeDelete(slug);
  if (!validation.ok) {
    const message = validation.blockers.map((item) => item.message).join("；");
    const error = new Error(message || "存在引用，无法删除");
    (error as Error & { blockers?: ProjectFlowNodeDeleteBlocker[] }).blockers =
      validation.blockers;
    throw error;
  }

  const studio = await loadOpsStudioSnapshot();
  const bundle = findProjectFlowNodeReferences(studio, slug);
  if (!bundle) throw new Error("流程节点不存在");

  const { payload, req, transactionStarted, commitTransaction, killTransaction } =
    await getOpsPayloadContext();

  const deleted = { tasks: 0, actions: 0, events: 0, stories: 0 };
  const deletedEventSlugs = new Set<string>();
  const deletedStorySlugs = new Set<string>();

  try {
    for (const action of bundle.actions) {
      if (actionExclusiveToTask(action, slug)) {
        await payload.delete({
          collection: "location-actions",
          id: action.payloadDocId,
          req,
        });
        deleted.actions += 1;
        continue;
      }

      const nextSlugs = removeTaskFromTriggerSlugs(action.triggerTaskSlugs, slug);
      await payload.update({
        collection: "location-actions",
        id: action.payloadDocId,
        data: { triggerTaskSlugs: toSlugPayload(nextSlugs) },
        req,
      });
    }

    for (const event of bundle.events) {
      if (eventExclusiveToTask(event, slug)) {
        await payload.delete({
          collection: "event-templates",
          id: event.payloadDocId,
          req,
        });
        deleted.events += 1;
        deletedEventSlugs.add(event.slug);
        continue;
      }

      const nextTriggerSlugs = removeTaskFromTriggerSlugs(
        event.triggerTaskSlugs,
        slug,
      );
      const nextEffects = removeTaskFromEventEffects(event.taskEffects, slug);
      await payload.update({
        collection: "event-templates",
        id: event.payloadDocId,
        data: {
          triggerTaskSlugs: toSlugPayload(nextTriggerSlugs),
          taskEffects: nextEffects,
        },
        req,
      });
    }

    for (const location of studio.mapLocations) {
      if (!(location.relatedTaskSlugs || []).includes(slug)) continue;
      const nextSlugs = removeTaskFromTriggerSlugs(location.relatedTaskSlugs, slug);
      await payload.update({
        collection: "map-locations",
        id: location.payloadDocId,
        data: { relatedTaskSlugs: toSlugPayload(nextSlugs) },
        req,
      });
    }

    if (options.deleteStories) {
      for (const story of bundle.stories) {
        if (!storyOnlyServesTask(story, slug)) continue;
        await payload.delete({
          collection: "story-entries",
          id: story.payloadDocId,
          req,
        });
        deleted.stories += 1;
        deletedStorySlugs.add(story.slug);
      }
    }

    await cleanupStoryReferences(
      payload,
      req,
      studio,
      slug,
      deletedEventSlugs,
      deletedStorySlugs,
    );

    await payload.delete({
      collection: "task-templates",
      id: bundle.taskDocId,
      req,
    });
    deleted.tasks = 1;

    if (transactionStarted) await commitTransaction(req);
    clearDependencyTaskTitleCache();
    refreshProjectFlowCaches(slug);

    return { ok: true as const, slug, deleted };
  } catch (error) {
    if (transactionStarted) await killTransaction(req);
    throw error;
  }
}

export async function getProjectFlowNodeDeletePreview(slug: string) {
  const validation = await validateProjectFlowNodeDelete(slug);
  const studio = await loadOpsStudioSnapshot();
  const bundle = findProjectFlowNodeReferences(studio, slug);
  return { validation, bundle };
}
