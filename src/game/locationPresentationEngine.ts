import type { ProjectState, Task } from "@prisma/client";
import {
  LOCATION_GROUP_ORDER,
  type MapLocation,
} from "@/data/locations";
import type { LocationAction } from "@/data/locationActions";
import { getRiskTagLabel } from "@/data/riskTagLabels";
import type { GameLogSummary } from "./logEngine";
import {
  enrichLocationStatus,
  getUnlockRequirements,
  isLocationUnlocked,
  type LocationWithStatus,
} from "./locationEngine";
import { isLocationActionUnlocked } from "./locationActionEngine";
import { getEventTemplates } from "./eventTemplateLoader";
import type { EventTemplateData } from "./types";
import { parseMilestones } from "./projectEngine";
import { getStageConfig, getStageDisplayName } from "./projectStages";
import type { RecommendedAction, ChapterGoalItem } from "./playerGuidanceEngine";
import { buildProjectMapViewData, type ProjectMapViewData } from "./projectMapPresentationEngine";

export type LocationDisplayStatus = "recommended" | "unlocked" | "locked";

export type LocationDisplayItem = {
  id: string;
  name: string;
  typeLabel: string;
  group: string;
  description: string;
  status: LocationDisplayStatus;
  unlocked: boolean;
  actionCount: number;
  totalActionCount: number;
  relatedTaskCount: number;
  possibleEventsLabel: string;
  hasRisk: boolean;
  highRisk: boolean;
  riskTagLabels: string[];
  recommendReason?: string;
  unlockRequirements: string[];
  unlockRequirementHints: string[];
  npcCount: number;
  href: string;
};

export type ExploreCategory = {
  id: string;
  label: string;
  count: number;
  unlockedCount: number;
};

export type ExplorePageData = {
  stageName: string;
  stageSubtitle: string;
  unlockedCount: number;
  totalCount: number;
  recommendedLocation: LocationDisplayItem | null;
  categories: ExploreCategory[];
  locations: LocationDisplayItem[];
  chapterGoals: ChapterGoalItem[];
  recentLogs: GameLogSummary[];
  stageProgress: number;
  overallProgress: number;
  mapData: ProjectMapViewData;
};

const HIGH_RISK_TAGS = new Set(["safety", "fire", "cost", "contract"]);

type LocationEventFilterContext = {
  locationRiskTags?: string[];
  locationRelatedAreaNames?: string[];
  locationRelatedNpcNames?: string[];
};

function hasIntersection(required: string[], candidates: string[]): boolean {
  if (required.length === 0) return true;
  if (candidates.length === 0) return false;
  const candidateSet = new Set(candidates);
  return required.some((value) => candidateSet.has(value));
}

function matchesEventRiskTags(
  event: EventTemplateData,
  context: LocationEventFilterContext,
): boolean {
  const eventTags = event.riskTags || [];
  if (eventTags.length === 0) return true;
  return hasIntersection(eventTags, context.locationRiskTags || []);
}

function matchesEventAreaNames(
  event: EventTemplateData,
  context: LocationEventFilterContext,
): boolean {
  const required = event.triggerAreaNames || [];
  if (required.length === 0) return true;
  return hasIntersection(required, context.locationRelatedAreaNames || []);
}

function matchesEventNpcNames(
  event: EventTemplateData,
  context: LocationEventFilterContext,
): boolean {
  const required = event.triggerNpcNames || [];
  if (required.length === 0) return true;
  return hasIntersection(required, context.locationRelatedNpcNames || []);
}

function matchesEventForLocationClue(
  event: EventTemplateData,
  location: MapLocation,
  project: ProjectState,
): boolean {
  if (event.enabled === false) return false;
  if (event.triggerStage && event.triggerStage !== project.currentStage) return false;

  const slugs = event.triggerLocationSlugs || [];
  if (slugs.length > 0 && !slugs.includes(location.id)) return false;

  const milestones = parseMilestones(project);
  if (event.unlockMilestones?.some((key) => !milestones[key])) return false;

  const filterContext: LocationEventFilterContext = {
    locationRiskTags: location.riskTags,
    locationRelatedAreaNames: location.relatedAreaNames,
    locationRelatedNpcNames: location.relatedNpcNames,
  };

  if (!matchesEventRiskTags(event, filterContext)) return false;
  if (!matchesEventAreaNames(event, filterContext)) return false;
  if (!matchesEventNpcNames(event, filterContext)) return false;

  return true;
}

function countEventsForLocation(
  location: MapLocation,
  project: ProjectState,
  events: EventTemplateData[],
): number {
  return events.filter((event) => matchesEventForLocationClue(event, location, project)).length;
}

function formatEventClueLabel(location: MapLocation, eventCount: number): string {
  if (eventCount > 0) {
    return `${eventCount} 项事件线索`;
  }
  if (location.riskTags?.length) {
    const labels = location.riskTags.slice(0, 3).map(getRiskTagLabel);
    return `事件线索 · ${labels.join(" · ")}`;
  }
  return "事件线索";
}

export function formatUnlockRequirementHint(requirement: string): string {
  const stageMatch = requirement.match(/^进入「(.+)」阶段$/);
  if (stageMatch) return `阶段推进至 ${stageMatch[1]}`;
  const milestoneMatch = requirement.match(/^完成关键节点「(.+)」$/);
  if (milestoneMatch) return `完成「${milestoneMatch[1]}」`;
  return requirement;
}

export function buildUnlockRequirementHints(requirements: string[]): string[] {
  return requirements.map(formatUnlockRequirementHint);
}

function getActionsForLocationRaw(
  locationId: string,
  actions: LocationAction[],
  project: ProjectState,
): { total: number; available: number } {
  const atLocation = actions.filter((action) => action.locationId === locationId);
  const available = atLocation.filter((action) =>
    isLocationActionUnlocked(action, project),
  ).length;
  return { total: atLocation.length, available };
}

export function buildLocationDisplayItem(
  location: MapLocation,
  project: ProjectState,
  tasks: Task[],
  actions: LocationAction[],
  options?: {
    recommendedLocationId?: string;
    recommendReason?: string;
    eventCount?: number;
  },
): LocationDisplayItem {
  const unlocked = isLocationUnlocked(location, project);
  const enriched = enrichLocationStatus(location, project, tasks);
  const { total, available } = getActionsForLocationRaw(location.id, actions, project);
  const eventCount = options?.eventCount ?? 0;
  const isRecommended = options?.recommendedLocationId === location.id;
  const riskTagLabels = (location.riskTags || []).map(getRiskTagLabel);
  const highRisk = (location.riskTags || []).some((tag) => HIGH_RISK_TAGS.has(tag));
  const unlockRequirements = getUnlockRequirements(location);

  let status: LocationDisplayStatus = unlocked ? "unlocked" : "locked";
  if (isRecommended && unlocked) status = "recommended";

  return {
    id: location.id,
    name: location.name,
    typeLabel: enriched.typeLabel,
    group: location.group,
    description: location.description,
    status,
    unlocked,
    actionCount: unlocked ? available : total,
    totalActionCount: total,
    relatedTaskCount: enriched.activeTaskCount,
    possibleEventsLabel: formatEventClueLabel(location, eventCount),
    hasRisk: riskTagLabels.length > 0,
    highRisk,
    riskTagLabels,
    recommendReason: isRecommended ? options?.recommendReason : undefined,
    unlockRequirements,
    unlockRequirementHints: buildUnlockRequirementHints(unlockRequirements),
    npcCount: location.relatedNpcNames?.length ?? 0,
    href: `/locations/${location.id}`,
  };
}

export function buildExploreCategories(
  locations: LocationDisplayItem[],
): ExploreCategory[] {
  const all: ExploreCategory = {
    id: "all",
    label: "全部地点",
    count: locations.length,
    unlockedCount: locations.filter((item) => item.unlocked).length,
  };

  const groups = LOCATION_GROUP_ORDER.map((group) => {
    const inGroup = locations.filter((item) => item.group === group);
    return {
      id: group,
      label: group,
      count: inGroup.length,
      unlockedCount: inGroup.filter((item) => item.unlocked).length,
    };
  });

  return [all, ...groups];
}

export async function buildExplorePageData(params: {
  project: ProjectState;
  tasks: Task[];
  locations: MapLocation[];
  actions: LocationAction[];
  recommendedAction: RecommendedAction;
  chapterGoals: ChapterGoalItem[];
  recentLogs: GameLogSummary[];
}): Promise<ExplorePageData> {
  const { project, tasks, locations, actions, recommendedAction, chapterGoals, recentLogs } =
    params;

  const recommendedLocationId = recommendedAction.locationId;
  const recommendReason = recommendedAction.reason;

  const events = await getEventTemplates();
  const displayItems: LocationDisplayItem[] = locations.map((location) => {
    const eventCount = countEventsForLocation(location, project, events);
    return buildLocationDisplayItem(location, project, tasks, actions, {
      recommendedLocationId,
      recommendReason,
      eventCount,
    });
  });

  displayItems.sort((a, b) => {
    const statusOrder = { recommended: 0, unlocked: 1, locked: 2 };
    const diff = statusOrder[a.status] - statusOrder[b.status];
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name, "zh-CN");
  });

  const recommendedLocation =
    displayItems.find((item) => item.id === recommendedLocationId && item.unlocked) ||
    displayItems.find((item) => item.status === "recommended") ||
    null;

  const stageConfig = getStageConfig(project.currentStage);

  return {
    stageName: getStageDisplayName(project.currentStage),
    stageSubtitle: stageConfig?.description || "",
    unlockedCount: displayItems.filter((item) => item.unlocked).length,
    totalCount: displayItems.length,
    recommendedLocation,
    categories: buildExploreCategories(displayItems),
    locations: displayItems,
    chapterGoals,
    recentLogs,
    stageProgress: project.stageProgress,
    overallProgress: project.overallProgress,
    mapData: buildProjectMapViewData(
      displayItems,
      getStageDisplayName(project.currentStage),
      project.stageProgress,
      project.overallProgress,
    ),
  };
}

export type LocationActionDisplayItem = {
  id: string;
  label: string;
  description: string;
  staminaCost: number;
  spiritCost: number;
  minLevel: number;
  minReputation: number;
  triggerTaskCount: number;
  relatedNpcNames: string[];
  riskTagLabels: string[];
  isRecommended?: boolean;
};

export function buildActionDisplayItems(
  actions: LocationAction[],
  recommendedActionId?: string,
): LocationActionDisplayItem[] {
  const fallbackRecommendedId = recommendedActionId ?? actions[0]?.id;
  return actions.map((action) => ({
    id: action.id,
    label: action.label,
    description: action.description,
    staminaCost: action.staminaCost ?? 0,
    spiritCost: action.spiritCost ?? 0,
    minLevel: action.minLevel ?? 0,
    minReputation: action.minReputation ?? 0,
    triggerTaskCount: action.triggerTaskSlugs?.length ?? 0,
    relatedNpcNames: action.relatedNpcNames || [],
    riskTagLabels: (action.riskTags || []).map(getRiskTagLabel),
    isRecommended: action.id === fallbackRecommendedId,
  }));
}

export function toLocationWithStatus(
  location: MapLocation,
  project: ProjectState,
  tasks: Task[],
): LocationWithStatus {
  return enrichLocationStatus(location, project, tasks);
}
