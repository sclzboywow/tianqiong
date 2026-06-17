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
import { parseMilestones } from "./projectEngine";
import { getStageConfig, normalizeStageId } from "./projectStages";
import type { RecommendedAction } from "./playerGuidanceEngine";
import type { ChapterGoalItem } from "./playerGuidanceEngine";

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
};

const HIGH_RISK_TAGS = new Set(["safety", "fire", "cost", "contract"]);

function countPossibleEvents(
  location: MapLocation,
  project: ProjectState,
  eventCount: number,
): string {
  if (eventCount > 0) {
    return `${eventCount} 项可能事件`;
  }
  if (location.riskTags?.length) {
    const labels = location.riskTags.slice(0, 3).map(getRiskTagLabel);
    return labels.join(" · ");
  }
  return "可能事件";
}

async function countEventsForLocation(
  locationId: string,
  project: ProjectState,
): Promise<number> {
  const events = await getEventTemplates();
  const milestones = parseMilestones(project);
  const stage = normalizeStageId(project.currentStage);

  return events.filter((event) => {
    const slugs = event.triggerLocationSlugs || [];
    if (slugs.length > 0 && !slugs.includes(locationId)) return false;
    if (event.triggerStage && event.triggerStage !== stage) return false;
    if (event.unlockMilestones?.some((key) => !milestones[key])) return false;
    return true;
  }).length;
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

export async function buildLocationDisplayItem(
  location: MapLocation,
  project: ProjectState,
  tasks: Task[],
  actions: LocationAction[],
  options?: {
    recommendedLocationId?: string;
    recommendReason?: string;
    eventCount?: number;
  },
): Promise<LocationDisplayItem> {
  const unlocked = isLocationUnlocked(location, project);
  const enriched = enrichLocationStatus(location, project, tasks);
  const { total, available } = getActionsForLocationRaw(location.id, actions, project);
  const eventCount =
    options?.eventCount ?? (await countEventsForLocation(location.id, project));
  const isRecommended = options?.recommendedLocationId === location.id;
  const riskTagLabels = (location.riskTags || []).map(getRiskTagLabel);
  const highRisk = (location.riskTags || []).some((tag) => HIGH_RISK_TAGS.has(tag));

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
    possibleEventsLabel: countPossibleEvents(location, project, eventCount),
    hasRisk: riskTagLabels.length > 0,
    highRisk,
    riskTagLabels,
    recommendReason: isRecommended ? options?.recommendReason : undefined,
    unlockRequirements: getUnlockRequirements(location),
    href: unlocked ? `/locations/${location.id}` : "#",
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

  const eventCountCache = new Map<string, number>();
  const displayItems: LocationDisplayItem[] = [];

  for (const location of locations) {
    let eventCount = eventCountCache.get(location.id);
    if (eventCount === undefined) {
      eventCount = await countEventsForLocation(location.id, project);
      eventCountCache.set(location.id, eventCount);
    }
    displayItems.push(
      await buildLocationDisplayItem(location, project, tasks, actions, {
        recommendedLocationId,
        recommendReason,
        eventCount,
      }),
    );
  }

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
    stageName: stageConfig?.name || project.currentStage,
    stageSubtitle: stageConfig?.description || "",
    unlockedCount: displayItems.filter((item) => item.unlocked).length,
    totalCount: displayItems.length,
    recommendedLocation,
    categories: buildExploreCategories(displayItems),
    locations: displayItems,
    chapterGoals,
    recentLogs,
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
};

export function buildActionDisplayItems(actions: LocationAction[]): LocationActionDisplayItem[] {
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
  }));
}

export function toLocationWithStatus(
  location: MapLocation,
  project: ProjectState,
  tasks: Task[],
): LocationWithStatus {
  return enrichLocationStatus(location, project, tasks);
}
