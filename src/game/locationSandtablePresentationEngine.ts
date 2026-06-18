import type { ProjectState, Task } from "@prisma/client";
import type { LocationAction } from "@/data/locationActions";
import { BUILDING_STACK_DISPLAY_NAMES } from "@/data/buildingStackFloors";
import { MAP_LOCATION_SANDTABLE_PLACEMENT } from "@/data/mapLocationSandtable";
import type { MapLocation } from "@/data/locations";
import { LOCATION_SANDTABLE_AREAS } from "@/data/locationSandtableAreas";
import { SANDTABLE_REGION_DEFS } from "@/data/sandtableRegions";
import { getRiskTagLabel } from "@/data/riskTagLabels";
import { getEventTemplates } from "./eventTemplateLoader";
import {
  getRelatedTasks,
  isLocationUnlocked,
  STAGE_LOCATION_RECOMMENDATIONS,
} from "./locationEngine";
import { getStageDisplayName, normalizeStageId, type ProjectStageId } from "./projectStages";
import type { EventTemplateData } from "./types";
import type { RecommendedAction } from "./playerGuidanceEngine";
import { buildSandtableNpcRefs, type SandtableNpcRef } from "./sandtableNpcResolver";

export type { SandtableNpcRef };

export type LocationRegionId =
  | "owner_hub"
  | "command_center"
  | "approval_regulatory"
  | "professional_service"
  | "construction_site"
  | "opening_prep";

export type LocationNodeStatus =
  | "recommended"
  | "has_task"
  | "has_event"
  | "locked"
  | "completed"
  | "normal";

export type SandtableLocationNode = {
  id: string;
  name: string;
  shortName: string;
  regionId: LocationRegionId;
  zoneId: string;
  status: LocationNodeStatus;
  locked: boolean;
  visible: boolean;
  recommended: boolean;
  relatedTaskCount: number;
  relatedEventCount: number;
  relatedNpcNames: string[];
  relatedNpcs: SandtableNpcRef[];
  relatedTaskSlugs: string[];
  riskTags: string[];
  description?: string;
  href?: string;
  canEnter?: boolean;
  relatedTaskTitles?: string[];
  availableActionLabels?: string[];
  impactLabels?: string[];
};

export type SandtableRegion = {
  id: LocationRegionId;
  name: string;
  description: string;
  unlocked: boolean;
  active: boolean;
  zones: {
    id: string;
    name: string;
    nodes: SandtableLocationNode[];
  }[];
};

export type LocationSandtableViewData = {
  currentStageName: string;
  unlockProgress: number;
  recommendedNode?: SandtableLocationNode;
  regions: SandtableRegion[];
};

const REGION_DEFS = SANDTABLE_REGION_DEFS;
const LOCATION_PLACEMENT = MAP_LOCATION_SANDTABLE_PLACEMENT;

const COMPLETED_TASK_STATUSES = new Set(["COMPLETED"]);

type SyntheticNodeSeed = {
  id: string;
  name: string;
  shortName: string;
  regionId: LocationRegionId;
  zoneId: string;
  unlockStage: ProjectStageId;
  relatedNpcNames?: string[];
  relatedLocationSlugs?: string[];
  riskTags?: string[];
  statusWhenUnlocked?: LocationNodeStatus;
  description?: string;
};

const SYNTHETIC_NODES: SyntheticNodeSeed[] = LOCATION_SANDTABLE_AREAS.map((area) => ({
  id: area.id,
  name: area.name,
  shortName: area.shortName,
  regionId: area.regionId,
  zoneId: area.zoneId,
  unlockStage: area.unlockStage,
  riskTags: area.riskTags,
  description: area.description,
  relatedLocationSlugs: area.relatedLocationSlugs,
}));

function hasIntersection(required: string[], candidates: string[]): boolean {
  if (required.length === 0) return true;
  if (candidates.length === 0) return false;
  const candidateSet = new Set(candidates);
  return required.some((value) => candidateSet.has(value));
}

function matchesEventForLocation(
  event: EventTemplateData,
  location: MapLocation,
  project: ProjectState,
): boolean {
  if (event.enabled === false) return false;
  if (event.triggerStage && event.triggerStage !== project.currentStage) return false;

  const slugs = event.triggerLocationSlugs || [];
  if (slugs.length > 0 && !slugs.includes(location.id)) return false;

  if (!hasIntersection(event.riskTags || [], location.riskTags || [])) return false;
  if (!hasIntersection(event.triggerAreaNames || [], location.relatedAreaNames || [])) return false;
  if (!hasIntersection(event.triggerNpcNames || [], location.relatedNpcNames || [])) return false;

  return true;
}

function countEventsForLocation(
  location: MapLocation,
  project: ProjectState,
  events: EventTemplateData[],
): number {
  return events.filter((event) => matchesEventForLocation(event, location, project)).length;
}

function getShortName(location: MapLocation): string {
  return location.name;
}

const OWNER_HUB_NAME_PREFIX = /^建设主体[\s·]+/u;

function formatOwnerHubNodeName(name: string): string {
  return name.replace(OWNER_HUB_NAME_PREFIX, "").trim();
}

function getSandtableNodeName(name: string, regionId: LocationRegionId, nodeId?: string): string {
  if (regionId === "owner_hub") {
    return formatOwnerHubNodeName(name);
  }
  if (nodeId && BUILDING_STACK_DISPLAY_NAMES[nodeId]) {
    return BUILDING_STACK_DISPLAY_NAMES[nodeId];
  }
  return name;
}

function getActionLabels(locationId: string, actions: LocationAction[]): string[] {
  return actions
    .filter((action) => action.locationId === locationId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .slice(0, 4)
    .map((action) => action.label);
}

function getNodeStatus(params: {
  unlocked: boolean;
  recommended: boolean;
  activeTaskCount: number;
  eventCount: number;
  completedTaskCount: number;
  fallback?: LocationNodeStatus;
}): LocationNodeStatus {
  if (!params.unlocked) return "locked";
  if (params.recommended) return "recommended";
  if (params.activeTaskCount > 0) return "has_task";
  if (params.eventCount > 0) return "has_event";
  if (params.completedTaskCount > 0) return "completed";
  return params.fallback ?? "normal";
}

function chooseRecommendedLocationId(params: {
  project: ProjectState;
  locations: MapLocation[];
  tasks: Task[];
  recommendedAction: RecommendedAction;
}): string | undefined {
  const { project, locations, tasks, recommendedAction } = params;
  const byId = new Map(locations.map((location) => [location.id, location]));

  if (recommendedAction.locationId) {
    const location = byId.get(recommendedAction.locationId);
    if (location && isLocationUnlocked(location, project)) return location.id;
  }

  const stageId = normalizeStageId(project.currentStage);
  const stageRecommendations = STAGE_LOCATION_RECOMMENDATIONS[stageId] || [];
  const stageFallback = stageRecommendations.find((id) => {
    const location = byId.get(id);
    return location ? isLocationUnlocked(location, project) : false;
  });
  if (stageFallback) return stageFallback;

  return locations.find((location) => {
    const hasTask = getRelatedTasks(location, tasks).length > 0;
    return hasTask && isLocationUnlocked(location, project);
  })?.id;
}

function buildRealNode(params: {
  location: MapLocation;
  project: ProjectState;
  tasks: Task[];
  actions: LocationAction[];
  events: EventTemplateData[];
  recommendedLocationId?: string;
}): SandtableLocationNode {
  const { location, project, tasks, actions, events, recommendedLocationId } = params;
  const placement =
    LOCATION_PLACEMENT[location.id] ??
    ({ regionId: "command_center", zoneId: "command_meeting" } as const);
  const unlocked = isLocationUnlocked(location, project);
  const relatedTasks = getRelatedTasks(location, tasks);
  const relatedTaskSlugs = location.relatedTaskSlugs || [];
  const completedTaskCount = tasks.filter(
    (task) =>
      COMPLETED_TASK_STATUSES.has(task.status) &&
      (relatedTaskSlugs.includes(task.templateId) ||
        (location.relatedAreaNames || []).includes(task.area)),
  ).length;
  const eventCount = countEventsForLocation(location, project, events);
  const recommended = unlocked && recommendedLocationId === location.id;
  const status = getNodeStatus({
    unlocked,
    recommended,
    activeTaskCount: relatedTasks.length,
    eventCount,
    completedTaskCount,
  });

  const npcRefs = buildSandtableNpcRefs({
    locationId: location.id,
    regionId: placement.regionId,
    zoneId: placement.zoneId,
    fallbackNpcNames: location.relatedNpcNames,
  });

  return {
    id: location.id,
    name: getSandtableNodeName(location.name, placement.regionId, location.id),
    shortName: getShortName(location),
    regionId: placement.regionId,
    zoneId: placement.zoneId,
    status,
    locked: !unlocked,
    visible: true,
    recommended,
    relatedTaskCount: relatedTasks.length,
    relatedEventCount: unlocked ? eventCount : 0,
    relatedNpcNames: npcRefs.relatedNpcNames,
    relatedNpcs: npcRefs.relatedNpcs,
    relatedTaskSlugs,
    riskTags: location.riskTags || [],
    description: location.description,
    href: `/locations/${location.id}`,
    canEnter: true,
    relatedTaskTitles: relatedTasks.map((task) => task.title).slice(0, 4),
    availableActionLabels: getActionLabels(location.id, actions),
    impactLabels: (location.riskTags || []).slice(0, 4).map(getRiskTagLabel),
  };
}

function hasReachedSyntheticStage(project: ProjectState, requiredStage: ProjectStageId): boolean {
  const currentId = normalizeStageId(project.currentStage);
  const order: ProjectStageId[] = [
    "INITIATION",
    "APPROVAL",
    "DESIGN",
    "PROCUREMENT",
    "CONSTRUCTION",
    "ACCEPTANCE",
    "OPENING",
  ];
  return order.indexOf(currentId) >= order.indexOf(requiredStage);
}

function resolveSyntheticDisplayName(seed: SyntheticNodeSeed, locations: MapLocation[]): string {
  for (const slug of seed.relatedLocationSlugs ?? []) {
    const linked = locations.find((location) => location.id === slug);
    if (linked) return linked.name;
  }
  return seed.name;
}

function buildSyntheticNode(
  seed: SyntheticNodeSeed,
  project: ProjectState,
  locations: MapLocation[],
): SandtableLocationNode {
  const unlocked = hasReachedSyntheticStage(project, seed.unlockStage);
  const status = getNodeStatus({
    unlocked,
    recommended: false,
    activeTaskCount: 0,
    eventCount: 0,
    completedTaskCount: 0,
    fallback: seed.statusWhenUnlocked,
  });
  const displayName = getSandtableNodeName(
    resolveSyntheticDisplayName(seed, locations),
    seed.regionId,
    seed.id,
  );

  const npcRefs = buildSandtableNpcRefs({
    locationId: seed.id,
    regionId: seed.regionId,
    zoneId: seed.zoneId,
    fallbackNpcNames: seed.relatedNpcNames,
  });

  return {
    id: seed.id,
    name: displayName,
    shortName: displayName,
    regionId: seed.regionId,
    zoneId: seed.zoneId,
    status,
    locked: !unlocked,
    visible: true,
    recommended: false,
    relatedTaskCount: 0,
    relatedEventCount: 0,
    relatedNpcNames: npcRefs.relatedNpcNames,
    relatedNpcs: npcRefs.relatedNpcs,
    relatedTaskSlugs: [],
    riskTags: seed.riskTags || [],
    description: seed.description,
    href: seed.relatedLocationSlugs?.[0] ? `/locations/${seed.relatedLocationSlugs[0]}` : undefined,
    canEnter: Boolean(seed.relatedLocationSlugs?.[0]),
    impactLabels: (seed.riskTags || []).slice(0, 4).map(getRiskTagLabel),
  };
}

function compareNodes(a: SandtableLocationNode, b: SandtableLocationNode): number {
  const rank = (node: SandtableLocationNode) => {
    if (node.status === "recommended") return 0;
    if (node.status === "has_task") return 1;
    if (node.status === "has_event") return 2;
    if (node.status === "completed") return 3;
    if (node.status === "normal") return 4;
    return 5;
  };
  const rankDiff = rank(a) - rank(b);
  if (rankDiff !== 0) return rankDiff;
  return a.name.localeCompare(b.name, "zh-CN");
}

export async function buildLocationSandtableViewData(params: {
  project: ProjectState;
  tasks: Task[];
  locations: MapLocation[];
  actions: LocationAction[];
  recommendedAction: RecommendedAction;
}): Promise<LocationSandtableViewData> {
  const { project, tasks, locations, actions, recommendedAction } = params;
  const events = await getEventTemplates();
  const recommendedLocationId = chooseRecommendedLocationId({
    project,
    locations,
    tasks,
    recommendedAction,
  });

  const realNodes = locations.map((location) =>
    buildRealNode({
      location,
      project,
      tasks,
      actions,
      events,
      recommendedLocationId,
    }),
  );
  const realLocationIds = new Set(locations.map((location) => location.id));
  const syntheticNodes = SYNTHETIC_NODES.filter((seed) => {
    const linked = seed.relatedLocationSlugs ?? [];
    if (linked.length === 0) return true;
    return !linked.some((slug) => realLocationIds.has(slug));
  }).map((seed) => buildSyntheticNode(seed, project, locations));

  const nodes = [...realNodes, ...syntheticNodes];

  const nodeByRegion = new Map<LocationRegionId, SandtableLocationNode[]>();
  for (const node of nodes) {
    const current = nodeByRegion.get(node.regionId) || [];
    current.push(node);
    nodeByRegion.set(node.regionId, current);
  }

  const regions = REGION_DEFS.map((region) => {
    const regionNodes = nodeByRegion.get(region.id) || [];
    return {
      id: region.id,
      name: region.name,
      description: region.description,
      unlocked: regionNodes.some((node) => !node.locked),
      active: regionNodes.some((node) =>
        ["recommended", "has_task", "has_event"].includes(node.status),
      ),
      zones: region.zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        nodes: regionNodes.filter((node) => node.zoneId === zone.id).sort(compareNodes),
      })),
    };
  });

  const recommendedNode =
    nodes.find((node) => node.id === recommendedLocationId && node.status === "recommended") ||
    nodes.find((node) => node.status === "recommended") ||
    nodes.find((node) => !node.locked);
  const unlockedCount = nodes.filter((node) => !node.locked).length;

  return {
    currentStageName: getStageDisplayName(project.currentStage),
    unlockProgress: nodes.length > 0 ? Math.round((unlockedCount / nodes.length) * 100) : 0,
    recommendedNode,
    regions,
  };
}

