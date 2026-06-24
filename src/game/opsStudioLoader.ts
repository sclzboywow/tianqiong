import { mapTaskTemplatePayloadDoc } from "./contentLoader";
import type { LocationAction } from "@/data/locationActions";
import type { EventTemplateData, StoryEntryData, TaskTemplateData } from "./types";

const PAYLOAD_LIMIT = 1000;

export type OpsLocationAction = LocationAction & { enabled: boolean };

function mapLocationActionDoc(doc: Record<string, unknown>): OpsLocationAction {
  return {
    id: doc.slug as string,
    locationId: doc.locationSlug as string,
    label: doc.label as string,
    description: (doc.description as string) || "",
    unlockStage: doc.unlockStage as LocationAction["unlockStage"],
    unlockMilestones: (doc.unlockMilestones as { milestone: string }[] | null)
      ?.map((item) => item.milestone)
      .filter(Boolean),
    triggerTaskSlugs: (doc.triggerTaskSlugs as { slug: string }[] | null)
      ?.map((item) => item.slug)
      .filter(Boolean),
    relatedNpcNames: (doc.relatedNpcNames as { name: string }[] | null)
      ?.map((item) => item.name)
      .filter(Boolean),
    riskTags: (doc.riskTags as { tag: string }[] | null)
      ?.map((item) => item.tag)
      .filter(Boolean),
    staminaCost: doc.staminaCost as number | undefined,
    spiritCost: doc.spiritCost as number | undefined,
    minLevel: doc.minLevel as number | undefined,
    minReputation: doc.minReputation as number | undefined,
    resultText: (doc.resultText as string) || undefined,
    noTaskText: (doc.noTaskText as string) || undefined,
    storySlug: doc.storySlug ? String(doc.storySlug) : undefined,
    sortOrder: doc.sortOrder as number | undefined,
    enabled: doc.enabled !== false,
  };
}

function mapEventDoc(doc: Record<string, unknown>): EventTemplateData {
  return {
    slug: String(doc.slug || ""),
    title: String(doc.title || ""),
    description: doc.description ? String(doc.description) : undefined,
    rarity: String(doc.rarity || "R"),
    eventType: doc.eventType ? String(doc.eventType) : undefined,
    inkFile: doc.inkFile ? String(doc.inkFile) : "",
    storySlug: doc.storySlug ? String(doc.storySlug) : undefined,
    triggerStage: doc.triggerStage as EventTemplateData["triggerStage"],
    triggerLocationSlugs:
      (doc.triggerLocationSlugs as { slug: string }[] | null)
        ?.map((item) => item.slug)
        .filter(Boolean) || [],
    triggerNpcNames:
      (doc.triggerNpcNames as { name: string }[] | null)
        ?.map((item) => item.name)
        .filter(Boolean) || [],
    triggerTaskSlugs:
      (doc.triggerTaskSlugs as { slug: string }[] | null)
        ?.map((item) => item.slug)
        .filter(Boolean) || [],
    triggerAreaNames:
      (doc.triggerAreaNames as { name: string }[] | null)
        ?.map((item) => item.name)
        .filter(Boolean) || [],
    riskTags:
      (doc.riskTags as { tag: string }[] | null)?.map((item) => item.tag).filter(Boolean) ||
      [],
    weight: doc.weight as number | undefined,
    onceOnly: doc.onceOnly as boolean | undefined,
    cooldownDays: doc.cooldownDays as number | undefined,
    metricEffects: (doc.metricEffects as EventTemplateData["metricEffects"]) || {},
    artifactEffects:
      (doc.artifactEffects as EventTemplateData["artifactEffects"]) || [],
    taskEffects: (doc.taskEffects as EventTemplateData["taskEffects"]) || [],
    unlockMilestones:
      (doc.unlockMilestones as { milestone: string }[] | null)
        ?.map((item) => item.milestone)
        .filter(Boolean) || [],
    resultText: doc.resultText ? String(doc.resultText) : undefined,
    noTaskText: doc.noTaskText ? String(doc.noTaskText) : undefined,
    enabled: doc.enabled !== false,
  };
}

function mapStoryDoc(doc: Record<string, unknown>): StoryEntryData {
  return {
    slug: String(doc.slug || ""),
    title: String(doc.title || ""),
    description: doc.description ? String(doc.description) : undefined,
    storyType: (doc.storyType as StoryEntryData["storyType"]) || "task_story",
    status: (doc.status as StoryEntryData["status"]) || "draft",
    inkFile: String(doc.inkFile || ""),
    compiledFile: doc.compiledFile ? String(doc.compiledFile) : undefined,
    startKnot: doc.startKnot ? String(doc.startKnot) : undefined,
    stage: doc.stage as StoryEntryData["stage"],
    relatedLocationSlugs:
      (doc.relatedLocationSlugs as { slug: string }[] | null)
        ?.map((item) => item.slug)
        .filter(Boolean) || [],
    relatedTaskSlugs:
      (doc.relatedTaskSlugs as { slug: string }[] | null)
        ?.map((item) => item.slug)
        .filter(Boolean) || [],
    relatedEventSlugs:
      (doc.relatedEventSlugs as { slug: string }[] | null)
        ?.map((item) => item.slug)
        .filter(Boolean) || [],
    relatedNpcNames:
      (doc.relatedNpcNames as { name: string }[] | null)
        ?.map((item) => item.name)
        .filter(Boolean) || [],
    tags:
      (doc.tags as { tag: string }[] | null)?.map((item) => item.tag).filter(Boolean) ||
      [],
    previewText: doc.previewText ? String(doc.previewText) : undefined,
    estimatedMinutes: doc.estimatedMinutes as number | undefined,
    sortOrder: doc.sortOrder as number | undefined,
    enabled: doc.enabled !== false,
    payloadDocId: doc.id as string | number,
  };
}

export type OpsStudioSnapshot = {
  taskTemplates: TaskTemplateData[];
  locationActions: OpsLocationAction[];
  eventTemplates: EventTemplateData[];
  storyEntries: StoryEntryData[];
  mapLocations: OpsMapLocation[];
  taskTemplateDocIds: Record<string, string | number>;
  locationActionDocIds: Record<string, string | number>;
  eventTemplateDocIds: Record<string, string | number>;
  storyEntryDocIds: Record<string, string | number>;
  mapLocationDocIds: Record<string, string | number>;
};

export type OpsMapLocation = {
  slug: string;
  name: string;
  relatedTaskSlugs: string[];
  payloadDocId: string | number;
};

/** Ops 专用：从 Payload 拉取全部内容（含已停用），不走 enabled=true 过滤。 */
export async function loadOpsStudioSnapshot(): Promise<OpsStudioSnapshot> {
  const { getPayload } = await import("payload");
  const config = (await import("@payload-config")).default;
  const payload = await getPayload({ config });

  const [tasks, actions, events, stories, mapLocationsResult] = await Promise.all([
    payload.find({ collection: "task-templates", limit: PAYLOAD_LIMIT, depth: 0 }),
    payload.find({ collection: "location-actions", limit: PAYLOAD_LIMIT, depth: 0 }),
    payload.find({ collection: "event-templates", limit: PAYLOAD_LIMIT, depth: 0 }),
    payload.find({ collection: "story-entries", limit: PAYLOAD_LIMIT, depth: 0 }),
    payload.find({ collection: "map-locations", limit: PAYLOAD_LIMIT, depth: 0 }),
  ]);

  const taskTemplateDocIds: Record<string, string | number> = {};
  const locationActionDocIds: Record<string, string | number> = {};
  const eventTemplateDocIds: Record<string, string | number> = {};
  const storyEntryDocIds: Record<string, string | number> = {};
  const mapLocationDocIds: Record<string, string | number> = {};

  const taskTemplates = tasks.docs.map((doc) => {
    const row = doc as Record<string, unknown>;
    taskTemplateDocIds[String(row.slug)] = row.id as string | number;
    return mapTaskTemplatePayloadDoc(row);
  });

  const locationActions = actions.docs.map((doc) => {
    const row = doc as Record<string, unknown>;
    const slug = String(row.slug || "");
    locationActionDocIds[slug] = row.id as string | number;
    return mapLocationActionDoc(row);
  });

  const eventTemplates = events.docs.map((doc) => {
    const row = doc as Record<string, unknown>;
    eventTemplateDocIds[String(row.slug)] = row.id as string | number;
    return mapEventDoc(row);
  });

  const storyEntries = stories.docs.map((doc) => {
    const row = doc as Record<string, unknown>;
    storyEntryDocIds[String(row.slug)] = row.id as string | number;
    return mapStoryDoc(row);
  });

  const mapLocations = mapLocationsResult.docs
    .map((doc) => {
      const row = doc as Record<string, unknown>;
      const slug = String(row.slug || "");
      if (!slug) return null;
      mapLocationDocIds[slug] = row.id as string | number;
      return {
        slug,
        name: String(row.name || slug),
        relatedTaskSlugs:
          (row.relatedTaskSlugs as { slug: string }[] | null)
            ?.map((item) => item.slug)
            .filter(Boolean) || [],
        payloadDocId: row.id as string | number,
      } satisfies OpsMapLocation;
    })
    .filter((item): item is OpsMapLocation => item != null);

  return {
    taskTemplates,
    locationActions,
    eventTemplates,
    storyEntries,
    mapLocations,
    taskTemplateDocIds,
    locationActionDocIds,
    eventTemplateDocIds,
    storyEntryDocIds,
    mapLocationDocIds,
  };
}
