import type { MapLocation } from "@/data/locations";
import { LOCATION_GROUP_ORDER } from "@/data/locations";
import type { LocationAction } from "@/data/locationActions";
import type { AreaData, NpcData } from "@/data/content";
import type {
  TaskTemplateData,
  EventTemplateData,
  StoryEntryData,
  ArtifactDefinitionData,
} from "./types";
import { getMapLocations } from "./locationLoader";
import { getLocationActions } from "./locationActionLoader";
import { getTaskTemplates } from "./contentLoader";
import { getEventTemplates } from "./eventTemplateLoader";
import { getStoryEntries } from "./storyEntryLoader";
import { getNpcs, getAreas } from "./worldContentLoader";
import { loadArtifactDefinitions } from "./artifactLoader";
import { payloadAdminUrl } from "@/lib/payloadAdminUrl";

export { payloadAdminUrl };

export type { EventTemplateData };

export type ContentStudioLocationRow = {
  location: MapLocation;
  payloadDocId?: string | number;
  actionCount: number;
  triggerTaskCount: number;
  relatedNpcCount: number;
  relatedAreaCount: number;
};

export type ContentStudioOverview = {
  mapLocations: number;
  locationActions: number;
  taskTemplates: number;
  eventTemplates: number;
  storyEntries: number;
  npcs: number;
  areas: number;
  artifactDefinitions: number;
};

export type DependencyGraphNode = {
  id: string;
  type: "task" | "artifact";
  label: string;
  stage?: string;
};

export type DependencyGraphEdge = {
  id: string;
  source: string;
  target: string;
  kind: "input" | "output" | "prerequisite";
};

export type DependencyGraphData = {
  nodes: DependencyGraphNode[];
  edges: DependencyGraphEdge[];
};

export type ContentStudioData = {
  overview: ContentStudioOverview;
  locationsByGroup: Record<string, ContentStudioLocationRow[]>;
  mapLocations: MapLocation[];
  locationActions: LocationAction[];
  locationActionDocIds: Record<string, string | number>;
  mapLocationDocIds: Record<string, string | number>;
  taskTemplates: TaskTemplateData[];
  taskTemplateDocIds: Record<string, string | number>;
  eventTemplateDocIds: Record<string, string | number>;
  eventTemplates: EventTemplateData[];
  storyEntries: StoryEntryData[];
  storyEntryDocIds: Record<string, string | number>;
  artifactDefinitions: ArtifactDefinitionData[];
  artifactDefinitionDocIds: Record<string, string | number>;
  dependencyGraph: DependencyGraphData;
  artifactUsage: ArtifactUsageIndex;
  npcs: NpcData[];
  areas: AreaData[];
};

async function loadPayloadDocIdMaps() {
  const mapLocationDocIds: Record<string, string | number> = {};
  const locationActionDocIds: Record<string, string | number> = {};
  const taskTemplateDocIds: Record<string, string | number> = {};
  const eventTemplateDocIds: Record<string, string | number> = {};
  const storyEntryDocIds: Record<string, string | number> = {};
  const artifactDefinitionDocIds: Record<string, string | number> = {};

  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });

    const [mapLocations, locationActions, taskTemplates, eventTemplates, storyEntries, artifactDefinitions] =
      await Promise.all([
        payload.find({ collection: "map-locations", limit: 500 }),
        payload.find({ collection: "location-actions", limit: 500 }),
        payload.find({ collection: "task-templates", limit: 500 }),
        payload.find({ collection: "event-templates", limit: 500 }),
        payload.find({ collection: "story-entries", limit: 500 }),
        payload.find({ collection: "artifact-definitions", limit: 500 }),
      ]);

    for (const doc of mapLocations.docs) {
      if (doc.slug) mapLocationDocIds[String(doc.slug)] = doc.id;
    }
    for (const doc of locationActions.docs) {
      if (doc.slug) locationActionDocIds[String(doc.slug)] = doc.id;
    }
    for (const doc of taskTemplates.docs) {
      if (doc.slug) taskTemplateDocIds[String(doc.slug)] = doc.id;
    }
    for (const doc of eventTemplates.docs) {
      if (doc.slug) eventTemplateDocIds[String(doc.slug)] = doc.id;
    }
    for (const doc of storyEntries.docs) {
      if (doc.slug) storyEntryDocIds[String(doc.slug)] = doc.id;
    }
    for (const doc of artifactDefinitions.docs) {
      if (doc.slug) artifactDefinitionDocIds[String(doc.slug)] = doc.id;
    }
  } catch {
    // 静态回退时无 Payload 文档 ID
  }

  return {
    mapLocationDocIds,
    locationActionDocIds,
    taskTemplateDocIds,
    eventTemplateDocIds,
    storyEntryDocIds,
    artifactDefinitionDocIds,
  };
}

export type ArtifactUsageIndex = {
  producedByTasks: Record<string, { slug: string; title: string }[]>;
  requiredByTasks: Record<string, { slug: string; title: string }[]>;
  affectedByEvents: Record<string, { slug: string; title: string }[]>;
};

export function buildArtifactUsageIndex(
  taskTemplates: TaskTemplateData[],
  eventTemplates: EventTemplateData[],
): ArtifactUsageIndex {
  const producedByTasks: ArtifactUsageIndex["producedByTasks"] = {};
  const requiredByTasks: ArtifactUsageIndex["requiredByTasks"] = {};
  const affectedByEvents: ArtifactUsageIndex["affectedByEvents"] = {};

  const push = (
    bucket: Record<string, { slug: string; title: string }[]>,
    artifactSlug: string,
    ref: { slug: string; title: string },
  ) => {
    if (!artifactSlug.trim()) return;
    const list = bucket[artifactSlug] || [];
    if (!list.some((item) => item.slug === ref.slug)) {
      list.push(ref);
    }
    bucket[artifactSlug] = list;
  };

  for (const template of taskTemplates) {
    const ref = { slug: template.slug, title: template.title };
    for (const output of template.outputArtifacts || []) {
      push(producedByTasks, output.artifactSlug, ref);
    }
    for (const input of template.inputArtifacts || []) {
      push(requiredByTasks, input.artifactSlug, ref);
    }
  }

  for (const event of eventTemplates) {
    const ref = { slug: event.slug, title: event.title };
    for (const effect of event.artifactEffects || []) {
      push(affectedByEvents, effect.artifactSlug, ref);
    }
  }

  return { producedByTasks, requiredByTasks, affectedByEvents };
}

export function buildDependencyGraph(
  taskTemplates: TaskTemplateData[],
  artifactDefinitions: ArtifactDefinitionData[],
): DependencyGraphData {
  const nodes: DependencyGraphNode[] = [];
  const edges: DependencyGraphEdge[] = [];
  const nodeIds = new Set<string>();

  for (const artifact of artifactDefinitions) {
    const id = `artifact:${artifact.slug}`;
    if (!nodeIds.has(id)) {
      nodes.push({
        id,
        type: "artifact",
        label: artifact.name,
        stage: artifact.stage,
      });
      nodeIds.add(id);
    }
  }

  for (const template of taskTemplates) {
    const taskId = `task:${template.slug}`;
    if (!nodeIds.has(taskId)) {
      nodes.push({
        id: taskId,
        type: "task",
        label: template.title,
        stage: template.stage,
      });
      nodeIds.add(taskId);
    }

    for (const input of template.inputArtifacts || []) {
      const artifactId = `artifact:${input.artifactSlug}`;
      if (!nodeIds.has(artifactId)) {
        const def = artifactDefinitions.find((item) => item.slug === input.artifactSlug);
        nodes.push({
          id: artifactId,
          type: "artifact",
          label: def?.name || input.artifactSlug,
          stage: def?.stage,
        });
        nodeIds.add(artifactId);
      }
      edges.push({
        id: `input:${template.slug}:${input.artifactSlug}`,
        source: artifactId,
        target: taskId,
        kind: "input",
      });
    }

    for (const output of template.outputArtifacts || []) {
      const artifactId = `artifact:${output.artifactSlug}`;
      if (!nodeIds.has(artifactId)) {
        const def = artifactDefinitions.find((item) => item.slug === output.artifactSlug);
        nodes.push({
          id: artifactId,
          type: "artifact",
          label: def?.name || output.artifactSlug,
          stage: def?.stage,
        });
        nodeIds.add(artifactId);
      }
      edges.push({
        id: `output:${template.slug}:${output.artifactSlug}`,
        source: taskId,
        target: artifactId,
        kind: "output",
      });
    }

    for (const prereq of template.prerequisiteTaskSlugs || []) {
      const prereqId = `task:${prereq}`;
      if (!nodeIds.has(prereqId)) {
        const def = taskTemplates.find((item) => item.slug === prereq);
        nodes.push({
          id: prereqId,
          type: "task",
          label: def?.title || prereq,
          stage: def?.stage,
        });
        nodeIds.add(prereqId);
      }
      edges.push({
        id: `prereq:${template.slug}:${prereq}`,
        source: prereqId,
        target: taskId,
        kind: "prerequisite",
      });
    }
  }

  return { nodes, edges };
}

export async function loadContentStudioData(): Promise<ContentStudioData> {
  const [
    mapLocations,
    locationActions,
    taskTemplates,
    eventTemplates,
    storyEntries,
    npcs,
    areas,
    docIds,
    artifactDefinitions,
  ] = await Promise.all([
    getMapLocations(),
    getLocationActions(),
    getTaskTemplates(),
    getEventTemplates(),
    getStoryEntries(),
    getNpcs(),
    getAreas(),
    loadPayloadDocIdMaps(),
    loadArtifactDefinitions(),
  ]);

  const dependencyGraph = buildDependencyGraph(taskTemplates, artifactDefinitions);
  const artifactUsage = buildArtifactUsageIndex(taskTemplates, eventTemplates);

  const actionsByLocation = new Map<string, LocationAction[]>();
  for (const action of locationActions) {
    const list = actionsByLocation.get(action.locationId) || [];
    list.push(action);
    actionsByLocation.set(action.locationId, list);
  }

  const locationsByGroup: Record<string, ContentStudioLocationRow[]> = {};
  for (const group of LOCATION_GROUP_ORDER) {
    locationsByGroup[group] = [];
  }

  for (const location of mapLocations) {
    const actions = actionsByLocation.get(location.id) || [];
    const triggerTaskSlugs = new Set<string>();
    for (const action of actions) {
      for (const slug of action.triggerTaskSlugs || []) {
        triggerTaskSlugs.add(slug);
      }
    }

    const row: ContentStudioLocationRow = {
      location,
      payloadDocId: docIds.mapLocationDocIds[location.id],
      actionCount: actions.length,
      triggerTaskCount: triggerTaskSlugs.size,
      relatedNpcCount: location.relatedNpcNames?.length || 0,
      relatedAreaCount: location.relatedAreaNames?.length || 0,
    };

    if (!locationsByGroup[location.group]) {
      locationsByGroup[location.group] = [];
    }
    locationsByGroup[location.group].push(row);
  }

  return {
    overview: {
      mapLocations: mapLocations.length,
      locationActions: locationActions.length,
      taskTemplates: taskTemplates.length,
      eventTemplates: eventTemplates.length,
      storyEntries: storyEntries.length,
      npcs: npcs.length,
      areas: areas.length,
      artifactDefinitions: artifactDefinitions.length,
    },
    locationsByGroup,
    mapLocations,
    locationActions,
    locationActionDocIds: docIds.locationActionDocIds,
    mapLocationDocIds: docIds.mapLocationDocIds,
    taskTemplates,
    taskTemplateDocIds: docIds.taskTemplateDocIds,
    eventTemplateDocIds: docIds.eventTemplateDocIds,
    eventTemplates,
    storyEntries,
    storyEntryDocIds: docIds.storyEntryDocIds,
    artifactDefinitions,
    artifactDefinitionDocIds: docIds.artifactDefinitionDocIds,
    dependencyGraph,
    artifactUsage,
    npcs,
    areas,
  };
}

export function getLocationStudioRow(
  data: ContentStudioData,
  locationId?: string,
): ContentStudioLocationRow | null {
  if (!locationId) return null;
  for (const rows of Object.values(data.locationsByGroup)) {
    const found = rows.find((row) => row.location.id === locationId);
    if (found) return found;
  }
  return null;
}

export function getActionsForLocationStudio(
  data: ContentStudioData,
  locationId: string,
): LocationAction[] {
  return data.locationActions.filter((action) => action.locationId === locationId);
}

export function getTaskTemplateBySlug(
  data: ContentStudioData,
  slug: string,
): TaskTemplateData | undefined {
  return data.taskTemplates.find((template) => template.slug === slug);
}

export function getEventsForLocationStudio(
  data: ContentStudioData,
  locationId: string,
): EventTemplateData[] {
  return data.eventTemplates.filter((event) => {
    const slugs = event.triggerLocationSlugs || [];
    return slugs.length === 0 || slugs.includes(locationId);
  });
}

export function getEventTemplateBySlug(
  data: ContentStudioData,
  slug: string,
): EventTemplateData | undefined {
  return data.eventTemplates.find((event) => event.slug === slug);
}
