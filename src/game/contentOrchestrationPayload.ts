export type PayloadDocIdCollection =
  | "map-locations"
  | "location-actions"
  | "task-templates"
  | "event-templates"
  | "story-entries"
  | "artifact-definitions";

export type PayloadDocIdMaps = {
  mapLocationDocIds: Record<string, string | number>;
  locationActionDocIds: Record<string, string | number>;
  taskTemplateDocIds: Record<string, string | number>;
  eventTemplateDocIds: Record<string, string | number>;
  storyEntryDocIds: Record<string, string | number>;
  artifactDefinitionDocIds: Record<string, string | number>;
};

const EMPTY_MAPS = (): PayloadDocIdMaps => ({
  mapLocationDocIds: {},
  locationActionDocIds: {},
  taskTemplateDocIds: {},
  eventTemplateDocIds: {},
  storyEntryDocIds: {},
  artifactDefinitionDocIds: {},
});

async function loadCollectionDocIds(
  collection: PayloadDocIdCollection,
): Promise<Record<string, string | number>> {
  return withContentOrchestrationCache(
    `orchestration:source:doc-ids:${collection}`,
    async () => {
      try {
        const { getPayload } = await import("payload");
        const config = (await import("@payload-config")).default;
        const payload = await getPayload({ config });
        const result = await payload.find({ collection, limit: 500, depth: 0 });
        const ids: Record<string, string | number> = {};
        for (const doc of result.docs) {
          if (doc.slug) ids[String(doc.slug)] = doc.id;
        }
        return ids;
      } catch {
        return {};
      }
    },
  );
}

export async function loadPayloadDocIds(
  collections: PayloadDocIdCollection[],
): Promise<PayloadDocIdMaps> {
  const maps = EMPTY_MAPS();
  const needed = new Set(collections);
  if (needed.size === 0) return maps;

  const entries = await Promise.all(
    [...needed].map(async (collection) => [collection, await loadCollectionDocIds(collection)] as const),
  );
  for (const [collection, ids] of entries) {
    if (collection === "map-locations") maps.mapLocationDocIds = ids;
    if (collection === "location-actions") maps.locationActionDocIds = ids;
    if (collection === "task-templates") maps.taskTemplateDocIds = ids;
    if (collection === "event-templates") maps.eventTemplateDocIds = ids;
    if (collection === "story-entries") maps.storyEntryDocIds = ids;
    if (collection === "artifact-definitions") maps.artifactDefinitionDocIds = ids;
  }

  return maps;
}

export async function loadPayloadDocIdMaps(): Promise<PayloadDocIdMaps> {
  return loadPayloadDocIds([
    "map-locations",
    "location-actions",
    "task-templates",
    "event-templates",
    "story-entries",
    "artifact-definitions",
  ]);
}
import { withContentOrchestrationCache } from "@/lib/contentOrchestrationCache";
