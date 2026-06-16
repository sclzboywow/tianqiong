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

export function calculateRewards(params: {
  rarity: string;
  success: boolean;
  contribution: number;
}) {
  const rarityMultiplier: Record<string, number> = {
    R: 1,
    SR: 1.5,
    SSR: 2,
    UR: 3,
  };
  const mult = rarityMultiplier[params.rarity] || 1;
  const baseExp = params.success ? 20 : 8;
  const baseGold = params.success ? 15 : 5;
  const baseRep = params.success ? 3 : 1;

  return {
    exp: Math.round(baseExp * mult),
    gold: Math.round(baseGold * mult),
    reputation: Math.round(baseRep * mult),
    contribution: Math.round(params.contribution * mult),
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
