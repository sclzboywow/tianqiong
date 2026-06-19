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

export async function loadPayloadDocIds(
  collections: PayloadDocIdCollection[],
): Promise<PayloadDocIdMaps> {
  const maps = EMPTY_MAPS();
  const needed = new Set(collections);
  if (needed.size === 0) return maps;

  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });

    const tasks: Promise<void>[] = [];

    if (needed.has("map-locations")) {
      tasks.push(
        payload.find({ collection: "map-locations", limit: 500, depth: 0 }).then((res) => {
          for (const doc of res.docs) {
            if (doc.slug) maps.mapLocationDocIds[String(doc.slug)] = doc.id;
          }
        }),
      );
    }
    if (needed.has("location-actions")) {
      tasks.push(
        payload.find({ collection: "location-actions", limit: 500, depth: 0 }).then((res) => {
          for (const doc of res.docs) {
            if (doc.slug) maps.locationActionDocIds[String(doc.slug)] = doc.id;
          }
        }),
      );
    }
    if (needed.has("task-templates")) {
      tasks.push(
        payload.find({ collection: "task-templates", limit: 500, depth: 0 }).then((res) => {
          for (const doc of res.docs) {
            if (doc.slug) maps.taskTemplateDocIds[String(doc.slug)] = doc.id;
          }
        }),
      );
    }
    if (needed.has("event-templates")) {
      tasks.push(
        payload.find({ collection: "event-templates", limit: 500, depth: 0 }).then((res) => {
          for (const doc of res.docs) {
            if (doc.slug) maps.eventTemplateDocIds[String(doc.slug)] = doc.id;
          }
        }),
      );
    }
    if (needed.has("story-entries")) {
      tasks.push(
        payload.find({ collection: "story-entries", limit: 500, depth: 0 }).then((res) => {
          for (const doc of res.docs) {
            if (doc.slug) maps.storyEntryDocIds[String(doc.slug)] = doc.id;
          }
        }),
      );
    }
    if (needed.has("artifact-definitions")) {
      tasks.push(
        payload.find({ collection: "artifact-definitions", limit: 500, depth: 0 }).then((res) => {
          for (const doc of res.docs) {
            if (doc.slug) maps.artifactDefinitionDocIds[String(doc.slug)] = doc.id;
          }
        }),
      );
    }

    await Promise.all(tasks);
  } catch {
    // 静态回退时无 Payload 文档 ID
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
