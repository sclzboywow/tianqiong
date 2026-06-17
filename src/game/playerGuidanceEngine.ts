import type { ProjectState } from "@prisma/client";
import type { Task } from "@prisma/client";
import {
  CHAPTER1_LOCATION_ACTIONS,
  CHAPTER1_NAME,
  CHAPTER1_TASK_SLUGS,
  CHAPTER1_TASK_TEMPLATES,
} from "@/data/chapter1Content";
import { LOCATION_ACTIONS } from "@/data/locationActions";
import { MAP_LOCATIONS } from "@/data/locations";
import { STAGE_TASK_TEMPLATES } from "@/data/stageTaskTemplates";
import { parseMilestones, getStageDisplayInfo, getRiskList } from "./projectEngine";
import {
  MILESTONE_LABELS,
  getStageConfig,
  normalizeStageId,
  type ProjectStageId,
} from "./projectStages";

export type RecommendedAction = {
  title: string;
  description: string;
  href: string;
  reason: string;
  priority: number;
  locationId?: string;
  locationName?: string;
  actionLabel?: string;
  taskSlug?: string;
  headline?: string;
};

export type ChapterInfo = {
  chapterName: string;
  chapterSubtitle: string;
  stageGoal: string;
};

export type ChapterGoalStatus = "completed" | "in_progress" | "pending" | "locked";

export type ChapterGoalItem = {
  key: string;
  label: string;
  status: ChapterGoalStatus;
  statusLabel: string;
};

export type ChapterMilestoneItem = {
  key: string;
  label: string;
  done: boolean;
};

export type PendingTaskGroup = {
  mainline: PendingTaskItem[];
  emergency: PendingTaskItem[];
};

export type PendingTaskItem = {
  id: string;
  title: string;
  area: string;
  href: string;
  minLevel: number;
  urgency?: "高" | "中" | "低";
};

const MAINLINE_TEMPLATE_IDS = new Set(
  STAGE_TASK_TEMPLATES.filter((t) => t.category === "mainline").map((t) => t.slug),
);

const INITIATION_CHAPTER_GOALS: Array<{
  key: string;
  label: string;
  milestone: string;
  taskSlug: string;
  locationId: string;
}> = [
  {
    key: "projectOrgDone",
    label: "项目组织架构",
    milestone: "projectOrgDone",
    taskSlug: "setup_project_team",
    locationId: "owner_project_management_dept",
  },
  {
    key: "masterPlanDone",
    label: "总控计划",
    milestone: "masterPlanDone",
    taskSlug: "prepare_master_plan",
    locationId: "owner_project_management_dept",
  },
  {
    key: "riskRegisterDone",
    label: "风险清单",
    milestone: "riskRegisterDone",
    taskSlug: "create_risk_register",
    locationId: "owner_project_management_dept",
  },
  {
    key: "documentLedgerDone",
    label: "资料台账",
    milestone: "documentLedgerDone",
    taskSlug: "create_document_ledger",
    locationId: "owner_archive_room",
  },
];

const INITIATION_GUIDANCE = INITIATION_CHAPTER_GOALS;

function getLocationName(locationId: string): string {
  return MAP_LOCATIONS.find((loc) => loc.id === locationId)?.name || locationId;
}

function getTaskTitle(taskSlug: string): string {
  const template =
    STAGE_TASK_TEMPLATES.find((t) => t.slug === taskSlug) ||
    CHAPTER1_TASK_TEMPLATES.find((t) => t.slug === taskSlug);
  return template?.title || taskSlug;
}

function findActionLabel(locationId: string, taskSlug: string): string | undefined {
  const actions = [...CHAPTER1_LOCATION_ACTIONS, ...LOCATION_ACTIONS];
  const action = actions.find(
    (item) =>
      item.locationId === locationId &&
      (item.triggerTaskSlugs || []).includes(taskSlug),
  );
  return action?.label;
}

function resolveTaskLocationContext(taskSlug: string): {
  locationId: string;
  locationName: string;
  actionLabel: string;
} | null {
  const guidance = INITIATION_GUIDANCE.find((item) => item.taskSlug === taskSlug);
  if (guidance) {
    const actionLabel = findActionLabel(guidance.locationId, taskSlug);
    if (actionLabel) {
      return {
        locationId: guidance.locationId,
        locationName: getLocationName(guidance.locationId),
        actionLabel,
      };
    }
  }

  for (const action of CHAPTER1_LOCATION_ACTIONS) {
    if ((action.triggerTaskSlugs || []).includes(taskSlug)) {
      return {
        locationId: action.locationId,
        locationName: getLocationName(action.locationId),
        actionLabel: action.label,
      };
    }
  }

  for (const action of LOCATION_ACTIONS) {
    if ((action.triggerTaskSlugs || []).includes(taskSlug)) {
      return {
        locationId: action.locationId,
        locationName: getLocationName(action.locationId),
        actionLabel: action.label,
      };
    }
  }

  return null;
}

function isActiveMainlineTask(task: Task): boolean {
  return (
    (task.status === "PENDING" || task.status === "IN_PROGRESS") &&
    MAINLINE_TEMPLATE_IDS.has(task.templateId)
  );
}

function sortActiveMainlineTasks(tasks: Task[]): Task[] {
  const priority = CHAPTER1_TASK_SLUGS as readonly string[];
  return [...tasks].sort((a, b) => {
    const aOrder = priority.indexOf(a.templateId as (typeof priority)[number]);
    const bOrder = priority.indexOf(b.templateId as (typeof priority)[number]);
    const aRank = aOrder === -1 ? 999 : aOrder;
    const bRank = bOrder === -1 ? 999 : bOrder;
    if (aRank !== bRank) return aRank - bRank;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

function isEmergencyTask(task: Task): boolean {
  if (MAINLINE_TEMPLATE_IDS.has(task.templateId)) return false;
  if (task.status !== "PENDING" && task.status !== "IN_PROGRESS") return false;
  return task.rarity === "SR" || task.rarity === "SSR" || task.triggerBroadcast;
}

function goalStatusLabel(status: ChapterGoalStatus): string {
  switch (status) {
    case "completed":
      return "已完成";
    case "in_progress":
      return "进行中";
    case "pending":
      return "未完成";
    case "locked":
      return "未解锁";
  }
}

export function getNextRecommendedAction(
  project: ProjectState,
  tasks: Task[],
): RecommendedAction {
  const activeMainline = sortActiveMainlineTasks(tasks.filter(isActiveMainlineTask));

  if (activeMainline.length > 0) {
    const task = activeMainline[0];
    const locationContext = resolveTaskLocationContext(task.templateId);

    return {
      title: task.title,
      headline: "下一步推荐行动",
      description:
        task.description || "任务已在任务台生成，请阅读现场情况并提交处理方案。",
      href: `/tasks/${task.id}`,
      reason: locationContext
        ? `「${task.title}」待处理，请前往任务台提交方案。`
        : "主线任务待处理，请优先提交处理方案。",
      priority: 100,
      taskSlug: task.templateId,
      locationId: locationContext?.locationId,
      locationName: locationContext?.locationName,
      actionLabel: "前往任务台处理",
    };
  }

  const stage = normalizeStageId(project.currentStage);
  if (stage === "INITIATION") {
    const milestones = parseMilestones(project);
    for (const item of INITIATION_GUIDANCE) {
      if (!milestones[item.milestone]) {
        const locationName = getLocationName(item.locationId);
        const taskTitle = getTaskTitle(item.taskSlug);
        const actionLabel = findActionLabel(item.locationId, item.taskSlug);
        return {
          title: taskTitle,
          headline: "下一步推荐行动",
          description: `前往「${locationName}」执行「${actionLabel || taskTitle}」，生成相关任务。`,
          href: `/locations/${item.locationId}`,
          reason: `章节目标「${MILESTONE_LABELS[item.milestone] || item.label}」尚未完成，需先在现场触发任务。`,
          priority: 80,
          locationId: item.locationId,
          locationName,
          actionLabel: actionLabel || taskTitle,
          taskSlug: item.taskSlug,
        };
      }
    }
  }

  return {
    title: "探索可行动地点",
    headline: "下一步推荐行动",
    description: "当前暂无明确的主线推荐，请前往探索页查看已解锁地点与可执行行动。",
    href: "/locations",
    reason: "阶段内暂无可自动推断的下一步，建议主动探索地图。",
    priority: 10,
    actionLabel: "前往探索",
  };
}

export function getChapterInfo(project: ProjectState): ChapterInfo {
  const stage = normalizeStageId(project.currentStage) as ProjectStageId;
  if (stage === "INITIATION") {
    return {
      chapterName: CHAPTER1_NAME,
      chapterSubtitle: "第一章 · 总控计划与风险清单",
      stageGoal: "建立项目组织架构、编制总控计划、建立风险登记台账与资料台账，推进至前期报批。",
    };
  }

  const stageConfig = getStageConfig(project.currentStage);
  return {
    chapterName: stageConfig?.name || project.currentStage,
    chapterSubtitle: stageConfig?.name || project.currentStage,
    stageGoal: stageConfig?.description || "",
  };
}

export function getChapterGoalItems(project: ProjectState, tasks: Task[]): ChapterGoalItem[] {
  const stage = normalizeStageId(project.currentStage);
  if (stage !== "INITIATION") {
    return getStageDisplayInfo(project).milestoneItems.map((item) => ({
      key: item.key,
      label: item.label,
      status: item.done ? "completed" : "pending",
      statusLabel: item.done ? "已完成" : "未完成",
    }));
  }

  const milestones = parseMilestones(project);
  const activeTaskSlugs = new Set(
    tasks
      .filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS")
      .map((t) => t.templateId),
  );

  return INITIATION_CHAPTER_GOALS.map((goal, index) => {
    if (milestones[goal.milestone]) {
      return {
        key: goal.key,
        label: goal.label,
        status: "completed" as const,
        statusLabel: goalStatusLabel("completed"),
      };
    }

    const previousBlocked = INITIATION_CHAPTER_GOALS.slice(0, index).some(
      (g) => !milestones[g.milestone],
    );
    if (previousBlocked) {
      return {
        key: goal.key,
        label: goal.label,
        status: "locked" as const,
        statusLabel: goalStatusLabel("locked"),
      };
    }

    const inProgress = activeTaskSlugs.has(goal.taskSlug);
    const status: ChapterGoalStatus = inProgress ? "in_progress" : "pending";
    return {
      key: goal.key,
      label: goal.label,
      status,
      statusLabel: goalStatusLabel(status),
    };
  });
}

export function getChapterMilestoneItems(project: ProjectState): ChapterMilestoneItem[] {
  const stageInfo = getStageDisplayInfo(project);
  const items = [...stageInfo.milestoneItems];

  if (normalizeStageId(project.currentStage) === "INITIATION") {
    const milestones = parseMilestones(project);
    items.push({
      key: "firstCoordinationMeetingDone",
      label: MILESTONE_LABELS.firstCoordinationMeetingDone || "首次项目协调会完成",
      done: !!milestones.firstCoordinationMeetingDone,
    });
  }

  return items;
}

export function getPendingTaskGroups(tasks: Task[]): PendingTaskGroup {
  const active = tasks.filter(
    (task) => task.status === "PENDING" || task.status === "IN_PROGRESS",
  );

  const mainline: PendingTaskItem[] = [];
  const emergency: PendingTaskItem[] = [];

  for (const task of active) {
    const item: PendingTaskItem = {
      id: task.id,
      title: task.title,
      area: task.area,
      href: `/tasks/${task.id}`,
      minLevel: 1,
    };

    if (isEmergencyTask(task)) {
      emergency.push({
        ...item,
        urgency: task.rarity === "SSR" ? "高" : "中",
      });
    } else if (MAINLINE_TEMPLATE_IDS.has(task.templateId) || task.taskType === "system") {
      mainline.push(item);
    } else {
      emergency.push({ ...item, urgency: "中" });
    }
  }

  return { mainline, emergency };
}

export function getProjectRiskSummary(project: ProjectState) {
  const risks = getRiskList(project);
  return {
    latentRiskLabel:
      project.latentRisk > 60 ? "高" : project.latentRisk > 30 ? "中" : "低",
    ownerTrustLabel:
      project.ownerTrust >= 50 ? "良好" : project.ownerTrust >= 30 ? "一般" : "不足",
    dataIntegrity: project.dataIntegrity,
    riskCount: risks.length,
    riskHint:
      risks.length > 0
        ? `存在 ${risks.length} 项高风险未处理，请及时关注`
        : "当前项目状态整体可控",
  };
}
