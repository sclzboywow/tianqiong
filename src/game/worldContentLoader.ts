import { NPCS, AREAS, type NpcData, type AreaData } from "@/data/content";
import { inferAreaUnlockStage, inferNpcUnlockStage } from "@/payload/contentCategories";
import type { ProjectStageId } from "./projectStages";

function mapPayloadNpc(doc: Record<string, unknown>): NpcData {
  const type = doc.type as string;
  return {
    name: doc.name as string,
    type,
    description: (doc.description as string) || "",
    defaultRelation: (doc.defaultRelation as number) ?? 50,
    quotes: ((doc.quotes as { quote: string }[] | null) || []).map((item) => item.quote).filter(Boolean),
    relatedMetrics: ((doc.relatedMetrics as { metric: string }[] | null) || [])
      .map((item) => item.metric)
      .filter(Boolean),
    unlockStage: (doc.unlockStage as ProjectStageId) || inferNpcUnlockStage(type),
    unlockMilestones: ((doc.unlockMilestones as { milestone: string }[] | null) || [])
      .map((item) => item.milestone)
      .filter(Boolean),
    relatedLocationSlugs: ((doc.relatedLocationSlugs as { slug: string }[] | null) || [])
      .map((item) => item.slug)
      .filter(Boolean),
    visibleWhenLocked: Boolean(doc.visibleWhenLocked),
  };
}

function mapPayloadArea(doc: Record<string, unknown>): AreaData {
  const name = doc.name as string;
  const stage = (doc.stage as string) || "";
  return {
    name,
    description: (doc.description as string) || "",
    stage,
    riskTags: ((doc.riskTags as { tag: string }[] | null) || []).map((item) => item.tag).filter(Boolean),
    unlockStage: (doc.unlockStage as ProjectStageId) || inferAreaUnlockStage(name, stage),
    unlockMilestones: ((doc.unlockMilestones as { milestone: string }[] | null) || [])
      .map((item) => item.milestone)
      .filter(Boolean),
    relatedLocationSlugs: ((doc.relatedLocationSlugs as { slug: string }[] | null) || [])
      .map((item) => item.slug)
      .filter(Boolean),
    visibleWhenLocked: Boolean(doc.visibleWhenLocked),
  };
}

export async function getNpcs(): Promise<NpcData[]> {
  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "npcs",
      where: { enabled: { equals: true } },
      limit: 100,
    });

    if (result.docs.length === 0) return NPCS;

    return result.docs.map((doc) => mapPayloadNpc(doc as Record<string, unknown>));
  } catch {
    return NPCS;
  }
}

export async function getAreas(): Promise<AreaData[]> {
  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "areas",
      where: { enabled: { equals: true } },
      limit: 100,
    });

    if (result.docs.length === 0) return AREAS;

    return result.docs.map((doc) => mapPayloadArea(doc as Record<string, unknown>));
  } catch {
    return AREAS;
  }
}
