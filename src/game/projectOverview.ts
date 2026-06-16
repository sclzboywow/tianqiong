import { prisma } from "@/prisma/client";
import type { ProjectState } from "@prisma/client";
import {
  getProjectState,
  getStageDisplayInfo,
  STAGE_GATE_STATUS_LABELS,
} from "./projectEngine";
import {
  PROJECT_STAGES,
  normalizeStageId,
  type ProjectStageId,
} from "./projectStages";
import { METRIC_LABELS } from "./types";
import { displayProgress } from "@/utils/clamp";
import { getRiskMetricLabel, getTimePressureLabel } from "@/utils/formatter";

const SEASON_ID = process.env.SEASON_ID || "season-1";

const TASK_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "RESOLVING",
  "COMPLETED",
  "FAILED",
  "EXPIRED",
] as const;

const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: "待处理",
  IN_PROGRESS: "进行中",
  RESOLVING: "结算中",
  COMPLETED: "已完成",
  FAILED: "失败",
  EXPIRED: "过期",
};

export type StageOverviewRow = {
  id: ProjectStageId;
  name: string;
  weight: number;
  statusLabel: string;
  progress: number | null;
};

export type MetricOverviewRow = {
  key: string;
  label: string;
  value: number;
  risk: boolean;
  levelLabel: string | null;
};

export type ProjectOverviewData = {
  project: ProjectState | null;
  stageInfo: ReturnType<typeof getStageDisplayInfo> | null;
  stages: StageOverviewRow[];
  taskStats: Record<string, number>;
  currentStageTaskStats: Record<string, number>;
  risks: MetricOverviewRow[];
  timePressure: string | null;
  totalDays: number;
  emptyMessage: string | null;
};

function stageIndex(stageId: ProjectStageId) {
  return PROJECT_STAGES.findIndex((stage) => stage.id === stageId);
}

function buildStageRows(project: ProjectState): StageOverviewRow[] {
  const currentId = normalizeStageId(project.currentStage);
  const currentIdx = stageIndex(currentId);

  return PROJECT_STAGES.map((stage, index) => {
    let statusLabel = "未开始";
    let progress: number | null = 0;

    if (index < currentIdx) {
      statusLabel = "已完成";
      progress = 100;
    } else if (index === currentIdx) {
      statusLabel = "当前阶段";
      progress = stage.id === "OPENING" && stage.weight === 0 ? null : project.stageProgress;
    } else if (stage.id === "OPENING" && stage.weight === 0) {
      progress = null;
    }

    return {
      id: stage.id,
      name: stage.name,
      weight: stage.weight,
      statusLabel,
      progress,
    };
  });
}

function emptyTaskStats() {
  return TASK_STATUSES.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    { total: 0 } as Record<string, number>,
  );
}

function buildMetricRows(project: ProjectState): MetricOverviewRow[] {
  const keys = [
    "quality",
    "safety",
    "dataIntegrity",
    "fireRisk",
    "latentRisk",
    "cost",
    "ownerTrust",
    "propertyHandover",
  ] as const;

  return keys.map((key) => {
    const value = displayProgress(project[key]);
    const risk = key === "fireRisk" || key === "latentRisk" || key === "cost";
    return {
      key,
      label: METRIC_LABELS[key] || key,
      value,
      risk,
      levelLabel: risk ? getRiskMetricLabel(key, value) : null,
    };
  });
}

export async function getProjectOverview(seasonId = SEASON_ID): Promise<ProjectOverviewData> {
  const totalDays = Number(process.env.SEASON_TOTAL_DAYS || 30);
  const project = await getProjectState(seasonId);

  if (!project) {
    return {
      project: null,
      stageInfo: null,
      stages: [],
      taskStats: emptyTaskStats(),
      currentStageTaskStats: emptyTaskStats(),
      risks: [],
      timePressure: null,
      totalDays,
      emptyMessage: "当前暂无项目状态，请先运行 seed（POST /api/admin/seed）。",
    };
  }

  const stageInfo = getStageDisplayInfo(project);
  const currentStageId = normalizeStageId(project.currentStage);

  const statusGroups = await prisma.task.groupBy({
    by: ["status"],
    where: { seasonId },
    _count: { _all: true },
  });

  const taskStats = emptyTaskStats();
  for (const group of statusGroups) {
    taskStats[group.status] = group._count._all;
    taskStats.total += group._count._all;
  }

  const currentStageGroups = await prisma.task.groupBy({
    by: ["status"],
    where: { seasonId, stage: currentStageId },
    _count: { _all: true },
  });

  const currentStageTaskStats = emptyTaskStats();
  for (const group of currentStageGroups) {
    currentStageTaskStats[group.status] = group._count._all;
    currentStageTaskStats.total += group._count._all;
  }

  const remainingDays = Math.max(0, totalDays - project.dayCount);

  return {
    project,
    stageInfo,
    stages: buildStageRows(project),
    taskStats,
    currentStageTaskStats,
    risks: buildMetricRows(project),
    timePressure: getTimePressureLabel(remainingDays, totalDays),
    totalDays,
    emptyMessage: null,
  };
}

export { TASK_STATUS_LABELS, STAGE_GATE_STATUS_LABELS };
