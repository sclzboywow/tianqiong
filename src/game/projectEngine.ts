import { prisma } from "@/prisma/client";
import { clamp } from "@/utils/clamp";
import type { MetricEffects } from "./types";

const SEASON_ID = process.env.SEASON_ID || "season-1";

export async function getProjectState(seasonId = SEASON_ID) {
  return prisma.projectState.findUnique({ where: { seasonId } });
}

export async function ensureProjectState(seasonId = SEASON_ID) {
  const existing = await getProjectState(seasonId);
  if (existing) return existing;

  return prisma.projectState.create({
    data: { seasonId },
  });
}

export async function applyMetricEffects(
  effects: MetricEffects,
  seasonId = SEASON_ID,
) {
  const state = await ensureProjectState(seasonId);
  const updates: Record<string, number> = {};

  const mapping: Record<string, keyof typeof state> = {
    progress: "progress",
    quality: "quality",
    safety: "safety",
    cost: "cost",
    dataIntegrity: "dataIntegrity",
    fireRisk: "fireRisk",
    ownerTrust: "ownerTrust",
    propertyHandover: "propertyHandover",
  };

  for (const [key, delta] of Object.entries(effects)) {
    const field = mapping[key];
    if (!field || delta === undefined) continue;
    const current = state[field] as number;
    updates[field] = field === "progress" ? current + delta : clamp(current + delta);
  }

  if (Object.keys(updates).length === 0) return state;

  const updated = await prisma.projectState.update({
    where: { seasonId },
    data: updates,
  });

  await evaluateProjectOutcome(updated);
  return updated;
}

export async function evaluateProjectOutcome(
  state: Awaited<ReturnType<typeof getProjectState>>,
) {
  if (!state || state.status !== "ACTIVE") return state;

  const totalDays = Number(process.env.SEASON_TOTAL_DAYS || 30);
  const won =
    state.progress >= 100 &&
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
    state.progress <= 10 ||
    state.dayCount >= totalDays;

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
  if (state.safety < 50) risks.push("现场安全风险偏高");
  if (state.fireRisk > 60) risks.push("消防整改压力较大");
  if (state.dataIntegrity < 50) risks.push("竣工资料缺口明显");
  if (state.progress < 40) risks.push("开业进度严重滞后");
  if (state.ownerTrust < 40) risks.push("甲方信任度不足");
  if (state.propertyHandover < 40) risks.push("物业移交推进缓慢");
  return risks;
}

export async function advanceDay(seasonId = SEASON_ID) {
  const state = await ensureProjectState(seasonId);
  return prisma.projectState.update({
    where: { id: state.id },
    data: { dayCount: state.dayCount + 1 },
  });
}
