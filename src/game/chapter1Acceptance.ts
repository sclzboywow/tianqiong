import fs from "fs";
import path from "path";
import {
  CHAPTER1_EVENT_SLUGS,
  CHAPTER1_LOCATION_ACTIONS,
  CHAPTER1_NAME,
  CHAPTER1_STAGE,
  CHAPTER1_STAGE_GATE_MILESTONES,
  CHAPTER1_STORY_SLUGS,
  CHAPTER1_TASK_SLUGS,
  CHAPTER1_TASK_TEMPLATES,
} from "@/data/chapter1Content";
import { PROJECT_STAGES } from "@/game/projectStages";
import type { ContentStudioData } from "@/game/contentStudioLoader";
import type { EventTemplateData, StoryEntryData, TaskTemplateData } from "@/game/types";

export type Chapter1CheckItem = {
  label: string;
  done: number;
  total: number;
  missing: string[];
  ok: boolean;
};

export type Chapter1AcceptanceReport = {
  chapterName: string;
  stage: string;
  tasks: Chapter1CheckItem;
  storyEntries: Chapter1CheckItem;
  inkFiles: Chapter1CheckItem;
  locationActions: Chapter1CheckItem;
  events: Chapter1CheckItem;
  stageGate: Chapter1CheckItem;
  allOk: boolean;
};

function checkItem(label: string, expected: readonly string[], found: string[]): Chapter1CheckItem {
  const missing = expected.filter((slug) => !found.includes(slug));
  return {
    label,
    done: expected.length - missing.length,
    total: expected.length,
    missing,
    ok: missing.length === 0,
  };
}

function inkCompiledPath(inkFile: string) {
  return path.join(process.cwd(), "src/ink/stories", `${inkFile}.json`);
}

function inkSourcePath(inkFile: string) {
  return path.join(process.cwd(), "src/ink/stories", `${inkFile}.ink`);
}

export function buildChapter1AcceptanceFromStatic(): Chapter1AcceptanceReport {
  const taskSlugs = CHAPTER1_TASK_TEMPLATES.map((t) => t.slug);
  const storySlugs = CHAPTER1_TASK_TEMPLATES.map((t) => t.storySlug || `story_${t.slug}`);
  const inkFiles = CHAPTER1_TASK_TEMPLATES.map((t) => t.inkFile).filter(Boolean) as string[];
  const actionIds = CHAPTER1_LOCATION_ACTIONS.map((a) => a.id);
  const eventSlugs = [...CHAPTER1_EVENT_SLUGS];

  const inkFound = inkFiles.filter(
    (file) => fs.existsSync(inkSourcePath(file)) && fs.existsSync(inkCompiledPath(file)),
  );

  const initiationStage = PROJECT_STAGES.find((s) => s.id === CHAPTER1_STAGE);
  const gateMilestones = initiationStage?.requiredMilestones || [...CHAPTER1_STAGE_GATE_MILESTONES];
  const gateOk = CHAPTER1_STAGE_GATE_MILESTONES.every((m) => gateMilestones.includes(m));

  const tasks = checkItem("主线任务", CHAPTER1_TASK_SLUGS, taskSlugs);
  const storyEntries = checkItem("StoryEntry", CHAPTER1_STORY_SLUGS, storySlugs);
  const inkFileCheck = checkItem("Ink 文件", inkFiles, inkFound);
  const locationActions = checkItem("地点行动", actionIds, actionIds);
  const events = checkItem("事件池", eventSlugs, eventSlugs);
  const stageGate: Chapter1CheckItem = {
    label: "阶段门关键节点",
    done: gateOk ? gateMilestones.length : 0,
    total: CHAPTER1_STAGE_GATE_MILESTONES.length,
    missing: gateOk
      ? []
      : CHAPTER1_STAGE_GATE_MILESTONES.filter((m) => !gateMilestones.includes(m)),
    ok: gateOk,
  };

  const allOk =
    tasks.ok &&
    storyEntries.ok &&
    inkFileCheck.ok &&
    locationActions.ok &&
    events.ok &&
    stageGate.ok;

  return {
    chapterName: CHAPTER1_NAME,
    stage: CHAPTER1_STAGE,
    tasks,
    storyEntries,
    inkFiles: inkFileCheck,
    locationActions,
    events,
    stageGate,
    allOk,
  };
}

export function buildChapter1AcceptanceFromStudio(data: ContentStudioData): Chapter1AcceptanceReport {
  const staticReport = buildChapter1AcceptanceFromStatic();
  const taskMap = new Map(data.taskTemplates.map((t) => [t.slug, t]));
  const storyMap = new Map(data.storyEntries.map((s) => [s.slug, s]));
  const actionMap = new Map(data.locationActions.map((a) => [a.id, a]));
  const eventMap = new Map(data.eventTemplates.map((e) => [e.slug, e]));

  const missingTasks = CHAPTER1_TASK_SLUGS.filter((slug) => !taskMap.has(slug));
  const missingStories = CHAPTER1_STORY_SLUGS.filter((slug) => !storyMap.has(slug));
  const missingInk = CHAPTER1_TASK_TEMPLATES.filter((task) => {
    const storySlug = task.storySlug || `story_${task.slug}`;
    const entry = storyMap.get(storySlug);
    const inkFile = entry?.inkFile || task.inkFile;
    if (!inkFile) return true;
    return !fs.existsSync(inkCompiledPath(inkFile));
  }).map((t) => t.slug);
  const missingActions = CHAPTER1_LOCATION_ACTIONS.filter((a) => !actionMap.has(a.id)).map(
    (a) => a.id,
  );
  const missingEvents = CHAPTER1_EVENT_SLUGS.filter((slug) => !eventMap.has(slug));

  const tasks = {
    ...staticReport.tasks,
    done: CHAPTER1_TASK_SLUGS.length - missingTasks.length,
    missing: missingTasks,
    ok: missingTasks.length === 0,
  };
  const storyEntries = {
    ...staticReport.storyEntries,
    done: CHAPTER1_STORY_SLUGS.length - missingStories.length,
    missing: missingStories,
    ok: missingStories.length === 0,
  };
  const inkFiles = {
    ...staticReport.inkFiles,
    done: CHAPTER1_TASK_SLUGS.length - missingInk.length,
    missing: missingInk,
    ok: missingInk.length === 0,
  };
  const locationActions = {
    ...staticReport.locationActions,
    done: CHAPTER1_LOCATION_ACTIONS.length - missingActions.length,
    missing: missingActions,
    ok: missingActions.length === 0,
  };
  const events = {
    ...staticReport.events,
    done: CHAPTER1_EVENT_SLUGS.length - missingEvents.length,
    missing: missingEvents,
    ok: missingEvents.length === 0,
  };

  const allOk =
    tasks.ok &&
    storyEntries.ok &&
    inkFiles.ok &&
    locationActions.ok &&
    events.ok &&
    staticReport.stageGate.ok;

  return {
    ...staticReport,
    tasks,
    storyEntries,
    inkFiles,
    locationActions,
    events,
    allOk,
  };
}

export function validateChapter1TaskTemplate(template: TaskTemplateData): string[] {
  const issues: string[] = [];
  if (!template.storySlug) issues.push("缺少 storySlug");
  if (!template.successEffects && !template.failEffects) {
    issues.push("缺少 successEffects");
  }
  if (!template.milestoneEffects || Object.keys(template.milestoneEffects).length === 0) {
    issues.push("缺少 milestoneEffects");
  }
  if (!template.failEffects) issues.push("缺少 failEffects");
  return issues;
}

export function validateChapter1StoryEntry(
  entry: StoryEntryData | undefined,
  task: TaskTemplateData,
): string[] {
  const issues: string[] = [];
  if (!entry) return ["StoryEntry 不存在"];
  if (entry.storyType !== "task_story") issues.push("storyType 应为 task_story");
  if (entry.status !== "published") issues.push("status 应为 published");
  if (entry.stage !== CHAPTER1_STAGE) issues.push(`stage 应为 ${CHAPTER1_STAGE}`);
  if (!entry.inkFile) issues.push("缺少 inkFile");
  if (!(entry.relatedTaskSlugs || []).includes(task.slug)) {
    issues.push(`relatedTaskSlugs 未包含 ${task.slug}`);
  }
  return issues;
}

export function validateChapter1Event(event: EventTemplateData | undefined): string[] {
  const issues: string[] = [];
  if (!event) return ["事件不存在"];
  if (event.triggerStage !== CHAPTER1_STAGE) issues.push(`triggerStage 应为 ${CHAPTER1_STAGE}`);
  if (!event.triggerTaskSlugs?.length) issues.push("缺少 triggerTaskSlugs");
  if (!event.triggerLocationSlugs?.length) issues.push("缺少 triggerLocationSlugs");
  return issues;
}
