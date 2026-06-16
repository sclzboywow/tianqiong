import { prisma } from "@/prisma/client";
import { clamp } from "@/utils/clamp";
import type { MetricEffects } from "./types";

const SEASON_ID = process.env.SEASON_ID || "season-1";

export async function updateNpcRelation(
  npcName: string,
  delta: number,
  attentionDelta = 0,
  seasonId = SEASON_ID,
) {
  const existing = await prisma.npcRelation.findUnique({
    where: { seasonId_npcName: { seasonId, npcName } },
  });

  if (existing) {
    return prisma.npcRelation.update({
      where: { id: existing.id },
      data: {
        relationValue: clamp(existing.relationValue + delta),
        attentionValue: clamp(existing.attentionValue + attentionDelta),
      },
    });
  }

  return prisma.npcRelation.create({
    data: {
      seasonId,
      npcName,
      relationValue: clamp(50 + delta),
      attentionValue: clamp(attentionDelta),
    },
  });
}

export async function applyNpcEffectsFromMetrics(effects: MetricEffects, npcList: string[]) {
  for (const npc of npcList) {
    let delta = 0;
    if (effects.ownerTrust) delta += Math.sign(effects.ownerTrust);
    if (effects.fireRisk && effects.fireRisk < 0) delta += 1;
    if (effects.fireRisk && effects.fireRisk > 0) delta -= 1;
    if (delta !== 0) {
      await updateNpcRelation(npc, delta);
    }
  }
}

export async function getNpcRelations(seasonId = SEASON_ID) {
  return prisma.npcRelation.findMany({ where: { seasonId } });
}
