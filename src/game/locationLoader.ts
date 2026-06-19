import { MAP_LOCATIONS, type MapLocation, type LocationType } from "@/data/locations";
import { getMapLocationSandtablePlacement } from "@/data/mapLocationSandtable";
import type { ProjectStageId } from "./projectStages";

function mapPayloadDoc(doc: Record<string, unknown>): MapLocation {
  const slug = doc.slug as string;
  const placement = getMapLocationSandtablePlacement(slug);
  return {
    id: slug,
    name: doc.name as string,
    type: doc.type as LocationType,
    group: doc.group as string,
    sandtableRegionId: (doc.sandtableRegionId as string) || placement.regionId,
    sandtableZoneId: (doc.sandtableZoneId as string) || placement.zoneId,
    description: (doc.description as string) || "",
    unlockStage: doc.unlockStage as ProjectStageId,
    unlockMilestones: (doc.unlockMilestones as { milestone: string }[] | null)
      ?.map((item) => item.milestone)
      .filter(Boolean),
    relatedTaskSlugs: (doc.relatedTaskSlugs as { slug: string }[] | null)
      ?.map((item) => item.slug)
      .filter(Boolean),
    relatedAreaNames: (doc.relatedAreaNames as { name: string }[] | null)
      ?.map((item) => item.name)
      .filter(Boolean),
    relatedNpcNames: (doc.relatedNpcNames as { name: string }[] | null)
      ?.map((item) => item.name)
      .filter(Boolean),
    riskTags: (doc.riskTags as { tag: string }[] | null)?.map((item) => item.tag).filter(Boolean),
    achievementHooks: (doc.achievementHooks as { hook: string }[] | null)
      ?.map((item) => item.hook)
      .filter(Boolean),
  };
}

export async function getMapLocations(): Promise<MapLocation[]> {
  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "map-locations",
      where: { enabled: { equals: true } },
      limit: 100,
      sort: "sortOrder",
    });

    if (result.docs.length === 0) return MAP_LOCATIONS;

    return result.docs.map((doc) => mapPayloadDoc(doc as Record<string, unknown>));
  } catch {
    return MAP_LOCATIONS;
  }
}

export async function getMapLocationById(id: string): Promise<MapLocation | undefined> {
  const locations = await getMapLocations();
  return locations.find((loc) => loc.id === id);
}
