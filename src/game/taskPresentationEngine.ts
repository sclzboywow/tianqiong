import type { ProjectState, Task, TaskParticipant, User } from "@prisma/client";
import type { MapLocation } from "@/data/locations";
import type { LocationAction } from "@/data/locationActions";
import { STAGE_TASK_TEMPLATES } from "@/data/stageTaskTemplates";
import { JOB_LABELS } from "@/utils/formatter";
import type { Job } from "@/game/prisma-types";
import type { GameLogSummary } from "./logEngine";
import type { MetricEffects } from "./types";
import type { ChapterGoalItem } from "./playerGuidanceEngine";
import {
  formatPlayerMetricEffectLines,
  formatPlayerMilestoneLabels,
  type PlayerEffectLine,
} from "./taskEffectPlayerDisplay";
import { getStageDisplayName, normalizeStageId } from "./projectStages";

export type TaskWithParticipants = Task & {
  participants: (TaskParticipant & { user: Pick<User, "id" | "nickname" | "job"> })[];
};

export type TaskBoardCategoryId =
  | "all"
  | "mainline"
  | "emergency"
  | "collaboration"
  | "completed";

export type TaskBoardCategory = {
  id: TaskBoardCategoryId;
  label: string;
  count: number;
};

export type TaskItemType = "mainline" | "emergency" | "collaboration" | "completed";

export type TaskItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  statusLabel: string;
  type: TaskItemType;
  typeLabel: string;
  href: string;
  area: string;
  sourceName: string;
  sourceLocationName: string | null;
  rarity: string;
  resolutionMode: string;
  baseSuccessRate: number;
  requiredJobs: string[];
  requiredJobLabels: string[];
  requiredCount: number;
  participantCount: number;
  successEffectsSummary: PlayerEffectLine[];
  failEffectsSummary: PlayerEffectLine[];
  milestoneLabels: string[];
  hasStageGate: boolean;
  urgency?: "高" | "中" | "低";
  isRecommended: boolean;
  isMainline: boolean;
  isEmergency: boolean;
  isCollaboration: boolean;
  isCompleted: boolean;
};

export type TaskBoardSummary = {
  totalActive: number;
  mainlineCount: number;
  emergencyCount: number;
  collaborationCount: number;
  completedCount: number;
};

export type RecommendedTaskBoardItem = {
  task: TaskItem;
  reason: string;
};

export type TaskBoardData = {
  stageName: string;
  summary: TaskBoardSummary;
  recommendedTask: RecommendedTaskBoardItem | null;
  categories: TaskBoardCategory[];
  taskItems: TaskItem[];
  chapterGoals: ChapterGoalItem[];
  recentTaskLogs: GameLogSummary[];
};

const MAINLINE_TEMPLATE_IDS = new Set(
  STAGE_TASK_TEMPLATES.filter((template) => template.category === "mainline").map(
    (template) => template.slug,
  ),
);

const EMERGENCY_RARITIES = new Set(["SR", "SSR", "UR"]);
const COMPLETED_STATUSES = new Set(["COMPLETED", "FAILED"]);

const STATUS_LABELS: Record<string, string> = {
  PENDING: "待处理",
  IN_PROGRESS: "进行中",
  COMPLETED: "已完成",
  FAILED: "失败",
  EXPIRED: "已过期",
  RESOLVING: "结算中",
};

export { STATUS_LABELS as TASK_STATUS_LABELS };

export function buildTemplateToLocationNameMap(
  locations: MapLocation[],
  actions: LocationAction[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const location of locations) {
    for (const slug of location.relatedTaskSlugs || []) {
      if (!map.has(slug)) map.set(slug, location.name);
    }
  }
  for (const action of actions) {
    const location = locations.find((item) => item.id === action.locationId);
    if (!location) continue;
    for (const slug of action.triggerTaskSlugs || []) {
      if (!map.has(slug)) map.set(slug, location.name);
    }
  }
  return map;
}

const RESOLUTION_MODE_LABELS: Record<string, string> = {
  SOLO: "单人任务",
  VOTE: "多人投票",
  ROLE_CHECKLIST: "岗位协作",
};

function parseJsonObject<T extends Record<string, unknown>>(raw: string | null | undefined): T {
  if (!raw) return {} as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return {} as T;
  }
}

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function isMainlineTask(task: Task, project: ProjectState): boolean {
  if (MAINLINE_TEMPLATE_IDS.has(task.templateId)) return true;
  const stage = normalizeStageId(project.currentStage);
  return task.stage === stage && task.taskType === "system";
}

function isEmergencyTask(task: Task): boolean {
  if (EMERGENCY_RARITIES.has(task.rarity)) return true;
  if (task.triggerBroadcast) return true;
  if (task.sourceType === "event") return true;
  if (task.sourceType === "npc" && !MAINLINE_TEMPLATE_IDS.has(task.templateId)) return true;
  return false;
}

function isCollaborationTask(task: Task): boolean {
  if (task.resolutionMode === "VOTE" || task.resolutionMode === "ROLE_CHECKLIST") return true;
  return task.requiredCount > 1;
}

function isCompletedTask(task: Task): boolean {
  return COMPLETED_STATUSES.has(task.status);
}

function getUrgency(task: Task): "高" | "中" | "低" | undefined {
  if (!isEmergencyTask(task) || isCompletedTask(task)) return undefined;
  if (task.rarity === "SSR" || task.rarity === "UR") return "高";
  if (task.rarity === "SR" || task.triggerBroadcast) return "中";
  return "低";
}

function resolvePrimaryType(task: Task, project: ProjectState): TaskItemType {
  if (isCompletedTask(task)) return "completed";
  if (isEmergencyTask(task) && !isMainlineTask(task, project)) return "emergency";
  if (isCollaborationTask(task) && !isMainlineTask(task, project)) return "collaboration";
  if (isMainlineTask(task, project)) return "mainline";
  if (isCollaborationTask(task)) return "collaboration";
  if (isEmergencyTask(task)) return "emergency";
  return "mainline";
}

const TYPE_LABELS: Record<TaskItemType, string> = {
  mainline: "主线任务",
  emergency: "突发事件",
  collaboration: "协作任务",
  completed: "已完成",
};

export function buildTaskItem(
  task: TaskWithParticipants,
  project: ProjectState,
  options?: { isRecommended?: boolean; sourceLocationName?: string | null },
): TaskItem {
  const jobList = parseJsonArray(task.requiredJobs);
  const successEffects = parseJsonObject<MetricEffects>(task.successEffects);
  const failEffects = parseJsonObject<MetricEffects>(task.failEffects);
  const milestoneEffects = parseJsonObject<Record<string, boolean>>(task.milestoneEffects);
  const milestoneLabels = formatPlayerMilestoneLabels(milestoneEffects, 2);
  const type = resolvePrimaryType(task, project);

  return {
    id: task.id,
    title: task.title,
    description: task.description || "",
    status: task.status,
    statusLabel: STATUS_LABELS[task.status] || task.status,
    type,
    typeLabel: TYPE_LABELS[type],
    href: `/tasks/${task.id}`,
    area: task.area,
    sourceName: task.sourceName || task.area,
    sourceLocationName: options?.sourceLocationName ?? null,
    rarity: task.rarity,
    resolutionMode: RESOLUTION_MODE_LABELS[task.resolutionMode] || "单人任务",
    baseSuccessRate: task.baseSuccessRate,
    requiredJobs: jobList,
    requiredJobLabels: jobList.map((job) => JOB_LABELS[job as Job] || "项目成员"),
    requiredCount: task.requiredCount,
    participantCount: task.currentCount,
    successEffectsSummary: formatPlayerMetricEffectLines(successEffects, 3),
    failEffectsSummary: formatPlayerMetricEffectLines(failEffects, 3),
    milestoneLabels,
    hasStageGate: milestoneLabels.length > 0,
    urgency: getUrgency(task),
    isRecommended: options?.isRecommended ?? false,
    isMainline: isMainlineTask(task, project),
    isEmergency: isEmergencyTask(task),
    isCollaboration: isCollaborationTask(task),
    isCompleted: isCompletedTask(task),
  };
}

function taskMatchesCategory(item: TaskItem, categoryId: TaskBoardCategoryId): boolean {
  if (categoryId === "all") return !item.isCompleted;
  if (categoryId === "completed") return item.isCompleted;
  if (item.isCompleted) return false;
  if (categoryId === "mainline") return item.isMainline;
  if (categoryId === "emergency") return item.isEmergency;
  if (categoryId === "collaboration") return item.isCollaboration;
  return true;
}

export function buildTaskBoardCategories(items: TaskItem[]): TaskBoardCategory[] {
  const active = items.filter((item) => !item.isCompleted);
  return [
    { id: "all", label: "全部待处理", count: active.length },
    {
      id: "mainline",
      label: "主线任务",
      count: active.filter((item) => item.isMainline).length,
    },
    {
      id: "emergency",
      label: "突发事件",
      count: active.filter((item) => item.isEmergency).length,
    },
    {
      id: "collaboration",
      label: "协作任务",
      count: active.filter((item) => item.isCollaboration).length,
    },
    {
      id: "completed",
      label: "已完成",
      count: items.filter((item) => item.isCompleted).length,
    },
  ];
}

export function getRecommendedTaskForBoard(
  items: TaskItem[],
  _project: ProjectState,
  chapterGoals: ChapterGoalItem[],
): RecommendedTaskBoardItem | null {
  const active = items.filter((item) => !item.isCompleted);
  if (active.length === 0) return null;

  const pendingGoals = chapterGoals.filter(
    (goal) => goal.status === "pending" || goal.status === "in_progress",
  );

  const mainlineActive = active.filter((item) => item.isMainline);

  if (mainlineActive.length > 0) {
    const task = mainlineActive[0];
    return {
      task: { ...task, isRecommended: true },
      reason:
        pendingGoals.length > 0
          ? `关联阶段目标「${pendingGoals[0].label}」尚未完成`
          : "当前阶段主线任务待推进",
    };
  }

  const stageGateTasks = active.filter((item) => item.hasStageGate);
  if (stageGateTasks.length > 0) {
    return {
      task: { ...stageGateTasks[0], isRecommended: true },
      reason: "阶段关键节点相关任务待处理",
    };
  }

  const emergencyTasks = active.filter((item) => item.isEmergency);
  if (emergencyTasks.length > 0) {
    return {
      task: { ...emergencyTasks[0], isRecommended: true },
      reason: "突发事件未处理，建议优先关注",
    };
  }

  const collaborationTasks = active.filter((item) => item.isCollaboration);
  if (collaborationTasks.length > 0) {
    return {
      task: { ...collaborationTasks[0], isRecommended: true },
      reason: "协作任务需要推进",
    };
  }

  return {
    task: { ...active[0], isRecommended: true },
    reason: "当前有待处理任务",
  };
}

function sortTaskItems(items: TaskItem[], recommendedId?: string): TaskItem[] {
  const typeOrder: Record<TaskItemType, number> = {
    mainline: 0,
    emergency: 1,
    collaboration: 2,
    completed: 3,
  };

  return [...items].sort((a, b) => {
    if (recommendedId) {
      if (a.id === recommendedId) return -1;
      if (b.id === recommendedId) return 1;
    }
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    const typeDiff = typeOrder[a.type] - typeOrder[b.type];
    if (typeDiff !== 0) return typeDiff;
    return a.title.localeCompare(b.title, "zh-CN");
  });
}

export function buildTaskBoardData(params: {
  project: ProjectState;
  tasks: TaskWithParticipants[];
  chapterGoals: ChapterGoalItem[];
  recentTaskLogs: GameLogSummary[];
  locations: MapLocation[];
  locationActions: LocationAction[];
}): TaskBoardData {
  const { project, tasks, chapterGoals, recentTaskLogs, locations, locationActions } = params;

  const templateLocationMap = buildTemplateToLocationNameMap(locations, locationActions);
  const baseItems = tasks.map((task) =>
    buildTaskItem(task, project, {
      sourceLocationName: templateLocationMap.get(task.templateId) ?? null,
    }),
  );
  const recommended = getRecommendedTaskForBoard(baseItems, project, chapterGoals);
  const recommendedId = recommended?.task.id;

  const taskItems = sortTaskItems(
    baseItems.map((item) => ({
      ...item,
      isRecommended: item.id === recommendedId,
    })),
    recommendedId,
  );

  const active = taskItems.filter((item) => !item.isCompleted);

  return {
    stageName: getStageDisplayName(project.currentStage),
    summary: {
      totalActive: active.length,
      mainlineCount: active.filter((item) => item.isMainline).length,
      emergencyCount: active.filter((item) => item.isEmergency).length,
      collaborationCount: active.filter((item) => item.isCollaboration).length,
      completedCount: taskItems.filter((item) => item.isCompleted).length,
    },
    recommendedTask: recommended,
    categories: buildTaskBoardCategories(taskItems),
    taskItems,
    chapterGoals,
    recentTaskLogs,
  };
}

export { taskMatchesCategory };
