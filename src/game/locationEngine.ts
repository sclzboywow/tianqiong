import type { ProjectState, Task } from "@prisma/client";
import {
  LOCATION_TYPE_LABELS,
  LOCATION_GROUP_ORDER,
  type MapLocation,
} from "@/data/locations";
import { getMapLocations, getMapLocationById } from "./locationLoader";
import { resolveRelatedContentForDisplay, type RelatedContentDisplayItem } from "./contentUnlockEngine";
import { getAreas, getNpcs } from "./worldContentLoader";
import { getActionsForLocation } from "./locationActionEngine";
import type { LocationAction } from "@/data/locationActions";
import { parseMilestones } from "./projectEngine";
import {
  PROJECT_STAGES,
  MILESTONE_LABELS,
  getStageConfig,
  normalizeStageId,
  type ProjectStageId,
} from "./projectStages";
import { getProjectState } from "./projectEngine";
import { listTasks } from "./taskEngine";

const ACTIVE_TASK_STATUSES = new Set(["PENDING", "IN_PROGRESS"]);

export type LocationOverview = {
  location: MapLocation;
  unlocked: boolean;
  unlockRequirements: string[];
  relatedTasks: Task[];
  relatedTaskCount: number;
  typeLabel: string;
  relatedNpcs: RelatedContentDisplayItem[];
  relatedAreas: RelatedContentDisplayItem[];
  availableActions: LocationAction[];
};

export type LocationWithStatus = {
  location: MapLocation;
  unlocked: boolean;
  unlockRequirements: string[];
  activeTaskCount: number;
  typeLabel: string;
};

export function hasReachedStage(currentStage: string | null | undefined, requiredStage: ProjectStageId): boolean {
  const currentIndex = PROJECT_STAGES.findIndex((s) => s.id === normalizeStageId(currentStage));
  const requiredIndex = PROJECT_STAGES.findIndex((s) => s.id === requiredStage);
  if (currentIndex < 0 || requiredIndex < 0) return false;
  return currentIndex >= requiredIndex;
}

export function getUnlockRequirements(location: MapLocation): string[] {
  const requirements: string[] = [];
  const stageConfig = getStageConfig(location.unlockStage);
  if (stageConfig) {
    requirements.push(`进入「${stageConfig.name}」阶段`);
  }
  if (location.unlockMilestones?.length) {
    for (const key of location.unlockMilestones) {
      requirements.push(`完成关键节点「${MILESTONE_LABELS[key] || key}」`);
    }
  }
  return requirements;
}

export function isLocationUnlocked(location: MapLocation, projectState: ProjectState): boolean {
  if (!hasReachedStage(projectState.currentStage, location.unlockStage)) return false;

  const milestones = parseMilestones(projectState);
  if (location.unlockMilestones?.some((key) => !milestones[key])) return false;

  return true;
}

export async function getAllLocations(): Promise<MapLocation[]> {
  return getMapLocations();
}

export async function getLocationById(id: string): Promise<MapLocation | undefined> {
  return getMapLocationById(id);
}

export function getRelatedTasks(location: MapLocation, tasks: Task[]): Task[] {
  const slugSet = new Set(location.relatedTaskSlugs || []);
  const areaSet = new Set(location.relatedAreaNames || []);

  return tasks.filter(
    (task) =>
      ACTIVE_TASK_STATUSES.has(task.status) &&
      (slugSet.has(task.templateId) || areaSet.has(task.area)),
  );
}

export function enrichLocationStatus(
  location: MapLocation,
  projectState: ProjectState,
  tasks: Task[],
): LocationWithStatus {
  const unlocked = isLocationUnlocked(location, projectState);
  const relatedTasks = getRelatedTasks(location, tasks);

  return {
    location,
    unlocked,
    unlockRequirements: getUnlockRequirements(location),
    activeTaskCount: relatedTasks.length,
    typeLabel: LOCATION_TYPE_LABELS[location.type],
  };
}

export function getUnlockedLocations(
  locations: MapLocation[],
  projectState: ProjectState,
  tasks: Task[],
): LocationWithStatus[] {
  return locations.filter((loc) => isLocationUnlocked(loc, projectState)).map((loc) =>
    enrichLocationStatus(loc, projectState, tasks),
  );
}

export function getLockedLocations(
  locations: MapLocation[],
  projectState: ProjectState,
  tasks: Task[],
): LocationWithStatus[] {
  return locations.filter((loc) => !isLocationUnlocked(loc, projectState)).map((loc) =>
    enrichLocationStatus(loc, projectState, tasks),
  );
}

export function groupLocationsByGroup(locations: LocationWithStatus[]): Record<string, LocationWithStatus[]> {
  const grouped: Record<string, LocationWithStatus[]> = {};
  for (const group of LOCATION_GROUP_ORDER) {
    grouped[group] = [];
  }
  for (const item of locations) {
    if (!grouped[item.location.group]) grouped[item.location.group] = [];
    grouped[item.location.group].push(item);
  }
  return grouped;
}

export async function getLocationOverview(id: string): Promise<LocationOverview | null> {
  const location = await getLocationById(id);
  if (!location) return null;

  const [project, tasks, npcs, areas] = await Promise.all([
    getProjectState(),
    listTasks(),
    getNpcs(),
    getAreas(),
  ]);
  const unlocked = project ? isLocationUnlocked(location, project) : false;
  const relatedTasks = getRelatedTasks(location, tasks);
  const relatedNpcs = project
    ? resolveRelatedContentForDisplay(location.relatedNpcNames, npcs, project)
    : [];
  const relatedAreas = project
    ? resolveRelatedContentForDisplay(location.relatedAreaNames, areas, project)
    : [];
  const availableActions = project ? await getActionsForLocation(location.id, project) : [];

  return {
    location,
    unlocked,
    unlockRequirements: getUnlockRequirements(location),
    relatedTasks,
    relatedTaskCount: relatedTasks.length,
    typeLabel: LOCATION_TYPE_LABELS[location.type],
    relatedNpcs,
    relatedAreas,
    availableActions,
  };
}

export type MapPageData = {
  project: ProjectState | null;
  stageName: string | null;
  unlockedByGroup: Record<string, LocationWithStatus[]>;
  locked: LocationWithStatus[];
  emptyMessage: string | null;
};

export async function getMapPageData(): Promise<MapPageData> {
  const project = await getProjectState();
  if (!project) {
    return {
      project: null,
      stageName: null,
      unlockedByGroup: {},
      locked: [],
      emptyMessage: "当前暂无项目状态，请先运行 seed（POST /api/admin/seed）。",
    };
  }

  const [locations, tasks] = await Promise.all([getMapLocations(), listTasks()]);
  const unlocked = getUnlockedLocations(locations, project, tasks);
  const locked = getLockedLocations(locations, project, tasks);
  const stageConfig = getStageConfig(project.currentStage);

  const unlockedByGroup: Record<string, LocationWithStatus[]> = {};
  for (const group of LOCATION_GROUP_ORDER) {
    unlockedByGroup[group] = unlocked.filter((item) => item.location.group === group);
  }

  return {
    project,
    stageName: stageConfig?.name || null,
    unlockedByGroup,
    locked,
    emptyMessage: null,
  };
}

/** 指挥中心：按阶段推荐地点 id */
export const STAGE_LOCATION_RECOMMENDATIONS: Record<ProjectStageId, string[]> = {
  INITIATION: [
    "owner_project_management_dept",
    "project_meeting_room",
    "project_document_room",
  ],
  APPROVAL: ["owner_pre_approval_office", "gov_service_center", "gov_natural_resources"],
  DESIGN: ["third_design_institute", "project_document_room"],
  PROCUREMENT: ["owner_cost_contract_dept", "owner_procurement_office", "third_cost_consultant"],
  CONSTRUCTION: [
    "site_l1_commercial_street",
    "site_fire_pump_room",
    "site_material_yard",
  ],
  ACCEPTANCE: ["gov_housing_construction", "owner_archive_room", "site_property_handover"],
  OPENING: ["owner_operation_prep_office"],
};

export async function getStageRecommendations(
  projectState: ProjectState,
  tasks: Task[],
): Promise<LocationWithStatus[]> {
  const stageId = normalizeStageId(projectState.currentStage);
  const ids = STAGE_LOCATION_RECOMMENDATIONS[stageId] || [];
  const results: LocationWithStatus[] = [];

  for (const id of ids) {
    const location = await getLocationById(id);
    if (!location) continue;
    const item = enrichLocationStatus(location, projectState, tasks);
    if (item.unlocked) results.push(item);
  }

  return results;
}
