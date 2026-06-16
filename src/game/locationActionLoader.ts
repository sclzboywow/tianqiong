import { LOCATION_ACTIONS, type LocationAction } from "@/data/locationActions";
import type { ProjectStageId } from "./projectStages";

function mapPayloadDoc(doc: Record<string, unknown>): LocationAction {
  return {
    id: doc.slug as string,
    locationId: doc.locationSlug as string,
    label: doc.label as string,
    description: (doc.description as string) || "",
    unlockStage: doc.unlockStage as ProjectStageId,
    unlockMilestones: (doc.unlockMilestones as { milestone: string }[] | null)
      ?.map((item) => item.milestone)
      .filter(Boolean),
    triggerTaskSlugs: (doc.triggerTaskSlugs as { slug: string }[] | null)
      ?.map((item) => item.slug)
      .filter(Boolean),
    relatedNpcNames: (doc.relatedNpcNames as { name: string }[] | null)
      ?.map((item) => item.name)
      .filter(Boolean),
    riskTags: (doc.riskTags as { tag: string }[] | null)?.map((item) => item.tag).filter(Boolean),
    staminaCost: doc.staminaCost as number | undefined,
    spiritCost: doc.spiritCost as number | undefined,
    minLevel: doc.minLevel as number | undefined,
    minReputation: doc.minReputation as number | undefined,
    resultText: (doc.resultText as string) || undefined,
    noTaskText: (doc.noTaskText as string) || undefined,
    sortOrder: doc.sortOrder as number | undefined,
  };
}

export async function getLocationActions(): Promise<LocationAction[]> {
  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "location-actions",
      where: { enabled: { equals: true } },
      limit: 200,
      sort: "sortOrder",
    });

    if (result.docs.length === 0) return LOCATION_ACTIONS;

    return result.docs.map((doc) => mapPayloadDoc(doc as Record<string, unknown>));
  } catch {
    return LOCATION_ACTIONS;
  }
}
