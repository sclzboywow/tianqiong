import { prisma } from "@/prisma/client";
import type { LocationAction } from "@/data/locationActions";
import type { EventTemplateData, StoryEntryData, TaskTemplateData } from "./types";
import {
  getOpsPayloadContext,
  refreshProjectFlowCaches,
} from "./projectFlowNodeMutations";
import { loadOpsStudioSnapshot, type OpsStudioSnapshot } from "./opsStudioLoader";
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

export function findProjectFlowNodeReferences(
  studio: OpsStudioSnapshot,
  slug: string,
): ProjectFlowNodeReferenceBundle | null {
  const task = studio.taskTemplates.find((item) => item.slug === slug);
  if (!task) return null;

  const taskDocId = studio.taskTemplateDocIds[slug];
  if (taskDocId == null) return null;

  const actions = studio.locationActions
    .filter((action) => (action.triggerTaskSlugs || []).includes(slug))
    .map((action) => ({
      ...action,
      payloadDocId: studio.locationActionDocIds[action.id],
    }))
    .filter((action) => action.payloadDocId != null) as Array<
    LocationAction & { payloadDocId: string | number }
  >;

  const events = studio.eventTemplates
    .filter((event) => eventReferencesTask(event, slug))
    .map((event) => ({
      ...event,
      payloadDocId: studio.eventTemplateDocIds[event.slug],
    }))
    .filter((event) => event.payloadDocId != null) as Array<
    EventTemplateData & { payloadDocId: string | number }
  >;

  const stories = studio.storyEntries
    .filter((story) => storyReferencesTask(story, slug, task.storySlug))
    .map((story) => ({
      ...story,
      payloadDocId: studio.storyEntryDocIds[story.slug],
    }))
    .filter((story) => story.payloadDocId != null) as Array<
    StoryEntryData & { payloadDocId: string | number }
  >;

  return { task, taskDocId, actions, events, stories };
}

export async function validateProjectFlowNodeDelete(
  slug: string,
  options?: { deleteStories?: boolean },
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

  for (const action of bundle.actions) {
    if (!actionExclusiveToTask(action, slug)) {
      const others = (action.triggerTaskSlugs || []).filter((item) => item !== slug);
      blockers.push({
        kind: "action",
        message: `地点行动「${action.label}」还触发其它任务：${others.join("、")}`,
        refs: [action.id, ...others],
      });
    }
  }

  for (const event of bundle.events) {
    if (!eventExclusiveToTask(event, slug)) {
      blockers.push({
        kind: "event",
        message: `事件「${event.title}」还关联其它任务，无法安全删除`,
        refs: [event.slug],
      });
    }
  }

  for (const event of studio.eventTemplates) {
    if (bundle.events.some((item) => item.slug === event.slug)) continue;
    if (eventReferencesTask(event, slug)) {
      blockers.push({
        kind: "event",
        message: `事件「${event.title}」仍引用该任务`,
        refs: [event.slug],
      });
    }
  }

  for (const action of studio.locationActions) {
    if (bundle.actions.some((item) => item.id === action.id)) continue;
    const slugs = action.triggerTaskSlugs || [];
    if (slugs.includes(slug)) {
      blockers.push({
        kind: "action",
        message: `地点行动「${action.label}」仍触发该任务`,
        refs: [action.id],
      });
    }
  }

  for (const story of bundle.stories) {
    const related = story.relatedTaskSlugs || [];
    const otherTasks = related.filter((item) => item !== slug);
    if (otherTasks.length > 0) {
      blockers.push({
        kind: "story",
        message: `剧情「${story.title}」仍关联其它任务：${otherTasks.join("、")}`,
        refs: [story.slug, ...otherTasks],
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

  if (options?.deleteStories) {
    for (const story of bundle.stories) {
      if (!storyOnlyServesTask(story, slug)) {
        blockers.push({
          kind: "story",
          message: `剧情「${story.title}」仍被其它任务引用，无法删除`,
          refs: [story.slug],
        });
      }
    }
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

  try {
    await payload.update({
      collection: "task-templates",
      id: bundle.taskDocId,
      data: { enabled },
      req,
    });

    for (const action of bundle.actions) {
      await payload.update({
        collection: "location-actions",
        id: action.payloadDocId,
        data: { enabled },
        req,
      });
    }

    for (const event of bundle.events) {
      await payload.update({
        collection: "event-templates",
        id: event.payloadDocId,
        data: { enabled },
        req,
      });
    }

    let storiesUpdated = 0;
    for (const story of bundle.stories) {
      if (enabled) {
        if (storyOnlyServesTask(story, bundle.task.slug)) {
          await payload.update({
            collection: "story-entries",
            id: story.payloadDocId,
            data: { enabled: true },
            req,
          });
          storiesUpdated += 1;
        }
        continue;
      }

      if (storyOnlyServesTask(story, bundle.task.slug)) {
        await payload.update({
          collection: "story-entries",
          id: story.payloadDocId,
          data: { enabled: false },
          req,
        });
        storiesUpdated += 1;
      } else {
        warnings.push(
          `剧情「${story.title}」仍关联其它任务，已保留启用状态`,
        );
      }
    }

    if (transactionStarted) await commitTransaction(req);

    return {
      summary: {
        tasks: 1,
        actions: bundle.actions.length,
        events: bundle.events.length,
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
  const bundle = findProjectFlowNodeReferences(studio, slug);
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

export async function deleteProjectFlowNode(
  slug: string,
  options: { deleteStories?: boolean } = {},
) {
  const validation = await validateProjectFlowNodeDelete(slug, options);
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

  try {
    for (const action of bundle.actions) {
      if (!actionExclusiveToTask(action, slug)) continue;
      await payload.delete({
        collection: "location-actions",
        id: action.payloadDocId,
        req,
      });
      deleted.actions += 1;
    }

    for (const event of bundle.events) {
      if (!eventExclusiveToTask(event, slug)) continue;
      await payload.delete({
        collection: "event-templates",
        id: event.payloadDocId,
        req,
      });
      deleted.events += 1;
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
      }
    }

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
  const validation = await validateProjectFlowNodeDelete(slug, {
    deleteStories: false,
  });
  const studio = await loadOpsStudioSnapshot();
  const bundle = findProjectFlowNodeReferences(studio, slug);
  return { validation, bundle };
}
