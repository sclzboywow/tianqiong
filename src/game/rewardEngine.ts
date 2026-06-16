import type { Job } from "@/game/prisma-types";
import { clamp } from "@/utils/clamp";

const JOB_BONUSES: Record<Job, Partial<Record<string, number>>> = {
  DOCUMENT_ASSISTANT: { dataIntegrity: 0.1 },
  CONSTRUCTION_ASSISTANT: { progress: 0.1 },
  SAFETY_ASSISTANT: { safety: 0.1 },
  MECHANICAL_ASSISTANT: { mechanical: 0.1 },
  COST_ASSISTANT: { cost: 0.1 },
  MATERIAL_ASSISTANT: { material: 0.1 },
  QUALITY_ASSISTANT: { quality: 0.1 },
};

const SUCCESS_REWARDS: Record<string, { exp: number; gold: number; reputation: number }> = {
  R: { exp: 10, gold: 10, reputation: 1 },
  SR: { exp: 25, gold: 25, reputation: 2 },
  SSR: { exp: 60, gold: 50, reputation: 5 },
  UR: { exp: 120, gold: 100, reputation: 10 },
};

const FAILURE_REWARDS: Record<string, { exp: number; gold: number; reputation: number }> = {
  R: { exp: 3, gold: 0, reputation: 0 },
  SR: { exp: 8, gold: 5, reputation: 0 },
  SSR: { exp: 15, gold: 10, reputation: 1 },
  UR: { exp: 30, gold: 20, reputation: 2 },
};

export function calculateRewards(params: {
  rarity: string;
  success: boolean;
  contribution?: number;
}) {
  const table = params.success ? SUCCESS_REWARDS : FAILURE_REWARDS;
  const base = table[params.rarity] || table.R;

  return {
    exp: base.exp,
    gold: base.gold,
    reputation: base.reputation,
    contribution: params.contribution ?? 0,
  };
}

export function getJobMatchBonus(job: Job, requiredJobs: string[]): number {
  if (requiredJobs.length === 0) return 0;
  return requiredJobs.includes(job) ? 10 : 0;
}

export function applySpiritCost(currentSpirit: number, cost = 5) {
  return clamp(currentSpirit - cost, 0, 100);
}

export function getJobBonusMultiplier(job: Job, taskCategory: string): number {
  const bonus = JOB_BONUSES[job];
  if (!bonus) return 1;
  if (taskCategory in bonus) return 1 + (bonus[taskCategory] || 0);
  return 1;
}
