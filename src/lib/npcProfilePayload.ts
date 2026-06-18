import type { NpcProfile } from "@/data/npcProfiles";
import {
  inferNpcCategoryFromFaction,
  inferNpcTypeFromFaction,
  inferNpcUnlockStage,
} from "@/payload/contentCategories";

export function buildNpcProfilePayloadData(profile: NpcProfile) {
  const type = inferNpcTypeFromFaction(profile.faction);
  const category = inferNpcCategoryFromFaction(profile.faction);
  const unlockStage = profile.appearStages?.[0] || inferNpcUnlockStage(type);

  return {
    slug: profile.id,
    name: profile.name,
    title: profile.title,
    category,
    type,
    level: profile.level,
    faction: profile.faction,
    description: profile.description,
    personality: profile.personality || "",
    agenda: profile.agenda || "",
    helpsWith: (profile.helpsWith || []).map((item) => ({ item })),
    blocksWhen: (profile.blocksWhen || []).map((item) => ({ item })),
    riskTags: (profile.riskTags || []).map((tag) => ({ tag })),
    defaultRelation: 50,
    quotes: [],
    relatedMetrics: [],
    unlockStage,
    unlockMilestones: [],
    relatedLocationSlugs: [],
    visibleWhenLocked: false,
    enabled: true,
  };
}
