import { prisma } from "@/prisma/client";
import type { ProjectState } from "@prisma/client";
import { clamp } from "@/utils/clamp";
import type { MetricEffects } from "./types";
import {
  PROJECT_STAGES,
  MILESTONE_LABELS,
  getStageConfig,
  normalizeStageId,
  type ProjectStageConfig,
  type ProjectStageId,
} from "./projectStages";
import { writeGameLog } from "./logEngine";

const SEASON_ID = process.env.SEASON_ID || "season-1";

export type MilestonesMap = Record<string, boolean>;

export type StageGateResult = {
  canAdvance: boolean;
  missingMilestones: string[];
  failedMetrics: string[];
  currentStage: ProjectStageConfig;
  nextStage?: ProjectStageConfig;
};

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function parseMilestones(state: Pick<ProjectState, "milestones">): MilestonesMap {
  return parseJson<MilestonesMap>(state.milestones, {});
}

export function serializeMilestones(milestones: MilestonesMap): string {
  return JSON.stringify(milestones);
}

export function calculateOverallProgress(state: Pick<ProjectState, "currentStage" | "stageProgress">): number {
  const currentStage = getStageConfig(state.currentStage);
  if (!currentStage) return 0;

  let completedWeight = 0;
  for (const stage of PROJECT_STAGES) {
    if (stage.id === currentStage.id) break;
    completedWeight += stage.weight;
  }

  const stagePart = currentStage.weight * (clamp(state.stageProgress, 0, 100) / 100);
  return Math.round(clamp(completedWeight + stagePart, 0, 100));
}

export function checkStageGate(
  state: Pick<
    ProjectState,
    | "currentStage"
    | "stageProgress"
    | "latentRisk"
    | "cost"
    | "fireRisk"
    | "safety"
    | "quality"
    | "dataIntegrity"
    | "ownerTrust"
    | "propertyHandover"
    | "milestones"
  >,
): StageGateResult {
  const currentStage = getStageConfig(state.currentStage)!;
  const milestones = parseMilestones(state);
  const nextStage = currentStage.nextStage ? getStageConfig(currentStage.nextStage) : undefined;

  const missingMilestones = currentStage.requiredMilestones.filter((key) => !milestones[key]);
  const failedMetrics: string[] = [];
  const rules = currentStage.requiredMetrics;

  if (rules) {
    if (rules.latentRiskMax !== undefined && state.latentRisk > rules.latentRiskMax) {
      failedMetrics.push("潜在风险过高");
    }
    if (rules.costPressureMax !== undefined && state.cost > rules.costPressureMax) {
      failedMetrics.push("成本压力过高");
    }
    if (rules.fireRiskMax !== undefined && state.fireRisk > rules.fireRiskMax) {
      failedMetrics.push("消防风险过高");
    }
    if (rules.safetyMin !== undefined && state.safety < rules.safetyMin) {
      failedMetrics.push("安全指标不足");
    }
    if (rules.qualityMin !== undefined && state.quality < rules.qualityMin) {
      failedMetrics.push("质量指标不足");
    }
    if (rules.dataIntegrityMin !== undefined && state.dataIntegrity < rules.dataIntegrityMin) {
      failedMetrics.push("资料完整度不足");
    }
    if (rules.ownerTrustMin !== undefined && state.ownerTrust < rules.ownerTrustMin) {
      failedMetrics.push("甲方信任度不足");
    }
    if (rules.propertyHandoverMin !== undefined && state.propertyHandover < rules.propertyHandoverMin) {
      failedMetrics.push("物业接管度不足");
    }
  }

  const canAdvance =
    state.stageProgress >= 100 &&
    missingMilestones.length === 0 &&
    failedMetrics.length === 0 &&
    !!currentStage.nextStage;

  return {
    canAdvance,
    missingMilestones,
    failedMetrics,
    currentStage,
    nextStage: nextStage || undefined,
  };
}

export async function migrateProjectState(state: ProjectState) {
  const normalizedStage = normalizeStageId(state.currentStage);
  const updates: Record<string, string | number> = {};

  if (state.currentStage !== normalizedStage) {
    updates.currentStage = normalizedStage;
  }
  if (!state.milestones) updates.milestones = "{}";
  if (state.stageProgress === null || state.stageProgress === undefined) {
    updates.stageProgress = Math.round(clamp(state.progress, 0, 100));
  }
  if (state.overallProgress === null || state.overallProgress === undefined) {
    updates.overallProgress = calculateOverallProgress({
      currentStage: normalizedStage,
      stageProgress: (updates.stageProgress as number) ?? state.stageProgress ?? 0,
    });
  }
  if (!state.stageGateStatus) updates.stageGateStatus = "OPEN";

  if (Object.keys(updates).length === 0) return state;

  return prisma.projectState.update({
    where: { id: state.id },
    data: updates,
  });
}

export async function getProjectState(seasonId = SEASON_ID) {
  const state = await prisma.projectState.findUnique({ where: { seasonId } });
  if (!state) return null;
  return migrateProjectState(state);
}

export async function ensureProjectState(seasonId = SEASON_ID) {
  const existing = await getProjectState(seasonId);
  if (existing) return existing;

  return prisma.projectState.create({
    data: {
      seasonId,
      currentStage: "INITIATION",
      stageProgress: 0,
      overallProgress: 0,
      milestones: "{}",
      stageGateStatus: "OPEN",
      progress: 0,
    },
  });
}

export async function initializeProjectForSeed(seasonId = SEASON_ID) {
  await prisma.task.updateMany({
    where: {
      seasonId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    data: { status: "EXPIRED" },
  });

  return prisma.projectState.upsert({
    where: { seasonId },
    create: {
      seasonId,
      currentStage: "INITIATION",
      stageProgress: 0,
      overallProgress: 0,
      milestones: "{}",
      stageGateStatus: "OPEN",
      progress: 0,
      dayCount: 1,
      quality: 60,
      safety: 65,
      cost: 50,
      dataIntegrity: 35,
      fireRisk: 55,
      ownerTrust: 50,
      propertyHandover: 40,
      latentRisk: 20,
      status: "ACTIVE",
    },
    update: {
      currentStage: "INITIATION",
      stageProgress: 0,
      overallProgress: 0,
      milestones: "{}",
      stageGateStatus: "OPEN",
      progress: 0,
      status: "ACTIVE",
    },
  });
}

export async function applyMilestoneEffects(
  milestoneEffects: Record<string, boolean>,
  seasonId = SEASON_ID,
) {
  if (!Object.keys(milestoneEffects).length) return getProjectState(seasonId);

  const state = await ensureProjectState(seasonId);
  const milestones = parseMilestones(state);

  for (const [key, value] of Object.entries(milestoneEffects)) {
    if (value) milestones[key] = true;
  }

  return prisma.projectState.update({
    where: { seasonId },
    data: { milestones: serializeMilestones(milestones) },
  });
}

export async function applyStageProgress(delta: number, seasonId = SEASON_ID) {
  const state = await ensureProjectState(seasonId);
  const stageProgress = clamp(state.stageProgress + delta, 0, 100);
  const overallProgress = calculateOverallProgress({
    currentStage: normalizeStageId(state.currentStage),
    stageProgress,
  });

  const gate = checkStageGate({ ...state, stageProgress });
  let stageGateStatus = state.stageGateStatus;
  if (stageProgress >= 100) {
    stageGateStatus = gate.canAdvance ? "PASSED" : "BLOCKED";
  } else if (stageGateStatus === "BLOCKED") {
    stageGateStatus = "OPEN";
  }

  return prisma.projectState.update({
    where: { seasonId },
    data: {
      stageProgress,
      overallProgress,
      progress: overallProgress,
      stageGateStatus,
    },
  });
}

export async function recalculateOverallProgress(seasonId = SEASON_ID) {
  const state = await ensureProjectState(seasonId);
  const overallProgress = calculateOverallProgress(state);
  return prisma.projectState.update({
    where: { seasonId },
    data: { overallProgress, progress: overallProgress },
  });
}

export async function advanceStageIfReady(seasonId = SEASON_ID) {
  const state = await ensureProjectState(seasonId);
  const gate = checkStageGate(state);

  if (!gate.canAdvance) {
    if (state.stageProgress >= 100 && gate.currentStage.nextStage) {
      await prisma.projectState.update({
        where: { seasonId },
        data: { stageGateStatus: "BLOCKED" },
      });
    }
    return { advanced: false, gate };
  }

  const nextStageId = gate.currentStage.nextStage as ProjectStageId;
  const nextStage = getStageConfig(nextStageId)!;

  let completedWeight = 0;
  for (const stage of PROJECT_STAGES) {
    if (stage.id === nextStageId) break;
    completedWeight += stage.weight;
  }

  const updated = await prisma.projectState.update({
    where: { seasonId },
    data: {
      currentStage: nextStageId,
      stageProgress: 0,
      overallProgress: completedWeight,
      progress: completedWeight,
      stageGateStatus: "OPEN",
    },
  });

  await writeGameLog({
    logType: "STAGE",
    content: `项目阶段从【${gate.currentStage.name}】推进至【${nextStage.name}】`,
    broadcastLevel: "SR",
  });

  return {
    advanced: true,
    from: gate.currentStage.id,
    to: nextStageId,
    gate,
    state: updated,
  };
}

export async function applyTaskOutcomeEffects(
  effects: MetricEffects,
  success: boolean,
  seasonId = SEASON_ID,
) {
  const { stageProgress, progress, ...metricEffects } = effects;
  // TODO: progress is legacy. Prefer stageProgress for mainline progression.
  const stageDelta = stageProgress ?? progress;

  await applyMetricEffects(metricEffects, seasonId);

  if (success && stageDelta) {
    await applyStageProgress(stageDelta, seasonId);
  }

  return getProjectState(seasonId);
}

export async function applyMetricEffects(effects: MetricEffects, seasonId = SEASON_ID) {
  const state = await ensureProjectState(seasonId);
  const updates: Record<string, number> = {};

  const mapping: Record<string, keyof ProjectState> = {
    quality: "quality",
    safety: "safety",
    cost: "cost",
    dataIntegrity: "dataIntegrity",
    fireRisk: "fireRisk",
    ownerTrust: "ownerTrust",
    propertyHandover: "propertyHandover",
    latentRisk: "latentRisk",
  };

  for (const [key, delta] of Object.entries(effects)) {
    if (key === "progress" || key === "stageProgress") continue;
    const field = mapping[key];
    if (!field || delta === undefined) continue;
    const current = state[field] as number;
    updates[field] = clamp(current + delta);
  }

  if (Object.keys(updates).length === 0) return state;

  const updated = await prisma.projectState.update({
    where: { seasonId },
    data: updates,
  });

  await evaluateProjectOutcome(updated);
  return updated;
}

export async function evaluateProjectOutcome(state: Awaited<ReturnType<typeof getProjectState>>) {
  if (!state || state.status !== "ACTIVE") return state;

  const stageId = normalizeStageId(state.currentStage);
  const won =
    stageId === "OPENING" &&
    state.overallProgress >= 100 &&
    state.quality >= 70 &&
    state.safety >= 70 &&
    state.dataIntegrity >= 80 &&
    state.fireRisk <= 30 &&
    state.ownerTrust >= 60 &&
    state.propertyHandover >= 60;

  const lost =
    state.safety <= 10 ||
    state.fireRisk >= 90 ||
    state.dataIntegrity <= 15 ||
    state.overallProgress <= 5 ||
    state.latentRisk >= 90;

  if (won) {
    return prisma.projectState.update({
      where: { id: state.id },
      data: { status: "WON" },
    });
  }

  if (lost) {
    return prisma.projectState.update({
      where: { id: state.id },
      data: { status: "LOST" },
    });
  }

  return state;
}

export function getRiskList(state: NonNullable<Awaited<ReturnType<typeof getProjectState>>>) {
  const risks: string[] = [];
  const gate = checkStageGate(state);

  if (state.stageGateStatus === "BLOCKED") {
    risks.push("阶段门被卡住，暂不能进入下一阶段");
    gate.missingMilestones.forEach((key) => {
      risks.push(`缺失节点：${MILESTONE_LABELS[key] || key}`);
    });
    gate.failedMetrics.forEach((item) => risks.push(item));
  }

  if (state.safety < 50) risks.push("现场安全风险偏高");
  if (state.fireRisk > 60) risks.push("消防整改压力较大");
  if (state.dataIntegrity < 50) risks.push("竣工资料缺口明显");
  if (state.overallProgress < 20) risks.push("总体建设进度滞后");
  if (state.ownerTrust < 40) risks.push("甲方信任度不足");
  if (state.propertyHandover < 40) risks.push("物业移交推进缓慢");
  if (state.latentRisk > 60) risks.push("潜在风险持续累积，可能引发集中爆发事件");
  return risks;
}

export function getStageDisplayInfo(state: NonNullable<Awaited<ReturnType<typeof getProjectState>>>) {
  const stageConfig = getStageConfig(state.currentStage)!;
  const milestones = parseMilestones(state);
  const gate = checkStageGate(state);

  return {
    stageConfig,
    milestones,
    gate,
    milestoneItems: stageConfig.requiredMilestones.map((key) => ({
      key,
      label: MILESTONE_LABELS[key] || key,
      done: !!milestones[key],
    })),
  };
}

export async function advanceDay(seasonId = SEASON_ID) {
  const state = await ensureProjectState(seasonId);
  const updates: Record<string, number> = {
    dayCount: state.dayCount + 1,
    latentRisk: clamp(state.latentRisk + 1),
  };

  if (state.stageGateStatus === "BLOCKED") {
    updates.latentRisk = clamp(state.latentRisk + 2);
    updates.ownerTrust = clamp(state.ownerTrust - 1);
  }

  return prisma.projectState.update({
    where: { id: state.id },
    data: updates,
  });
}

export { MILESTONE_LABELS, STAGE_GATE_STATUS_LABELS } from "./projectStages";
