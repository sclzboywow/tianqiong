import type { NpcProfile } from "@/data/npcProfiles";
import { inferNpcUnlockStage } from "@/payload/contentCategories";

export function buildNpcProfilePayloadData(profile: NpcProfile) {
  const type = profile.payloadType;
  const category = profile.payloadCategory;
  const unlockStage = profile.appearStages?.[0] || inferNpcUnlockStage(type);

  return {
    slug: profile.id,
    excelId: profile.excelId,
    name: profile.name,
    title: profile.title,
    organization: profile.organization,
    residentRegion: profile.residentRegion,
    sandtableRegionId: profile.sandtableRegionId,
    category,
    type,
    level: profile.level,
    faction: profile.faction,
    description: profile.description,
    taskFunction: profile.description,
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
