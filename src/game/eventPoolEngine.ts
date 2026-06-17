import type { EventTemplateData } from "./types";
import type { ProjectState, Task } from "@prisma/client";
import { prisma } from "@/prisma/client";
import { getEventTemplates } from "./eventTemplateLoader";
import { parseMilestones } from "./projectEngine";
import { createTaskFromTemplateSlug } from "./taskEngine";
import { buildEventPoolLogContent, writeGameLog } from "./logEngine";

const SEASON_ID = process.env.SEASON_ID || "season-1";

export type EventTriggerResult = {
  triggeredEvent: EventTemplateData | null;
  createdTasks: Task[];
  skippedTasks: { slug: string; title: string; reason: string }[];
  message: string;
};

export type EventPoolFilterContext = {
  locationRiskTags?: string[];
  locationRelatedAreaNames?: string[];
  locationRelatedNpcNames?: string[];
  actionRiskTags?: string[];
  actionRelatedNpcNames?: string[];
};

function hasIntersection(required: string[], candidates: string[]): boolean {
  if (required.length === 0) return true;
  if (candidates.length === 0) return false;
  const candidateSet = new Set(candidates);
  return required.some((value) => candidateSet.has(value));
}

function matchesRiskTags(event: EventTemplateData, context: EventPoolFilterContext): boolean {
  const eventTags = event.riskTags || [];
  if (eventTags.length === 0) return true;
  const combined = [...(context.locationRiskTags || []), ...(context.actionRiskTags || [])];
  return hasIntersection(eventTags, combined);
}

function matchesAreaNames(event: EventTemplateData, context: EventPoolFilterContext): boolean {
  const required = event.triggerAreaNames || [];
  if (required.length === 0) return true;
  return hasIntersection(required, context.locationRelatedAreaNames || []);
}

function matchesNpcNames(event: EventTemplateData, context: EventPoolFilterContext): boolean {
  const required = event.triggerNpcNames || [];
  if (required.length === 0) return true;
  const combined = [
    ...(context.locationRelatedNpcNames || []),
    ...(context.actionRelatedNpcNames || []),
  ];
  return hasIntersection(required, combined);
}

function isStageMatch(event: EventTemplateData, projectState: ProjectState): boolean {
  if (!event.triggerStage) return true;
  return event.triggerStage === projectState.currentStage;
}

function isLocationMatch(event: EventTemplateData, locationId: string): boolean {
  const slugs = event.triggerLocationSlugs || [];
  if (slugs.length === 0) return true;
  return slugs.includes(locationId);
}

function areMilestonesUnlocked(event: EventTemplateData, projectState: ProjectState): boolean {
  const required = event.unlockMilestones || [];
  if (required.length === 0) return true;
  const milestones = parseMilestones(projectState);
  return required.every((key) => milestones[key]);
}

function isDayInRange(event: EventTemplateData, dayCount: number): boolean {
  if (event.minDay != null && dayCount < event.minDay) return false;
  if (event.maxDay != null && dayCount > event.maxDay) return false;
  return true;
}

async function getTriggerLogsForSeason(seasonId: string) {
  return prisma.eventTriggerLog.findMany({
    where: { seasonId },
    orderBy: { triggeredAt: "desc" },
  });
}

async function isOnceOnlyBlocked(
  event: EventTemplateData,
  logs: { eventSlug: string }[],
): Promise<boolean> {
  if (!event.onceOnly) return false;
  return logs.some((log) => log.eventSlug === event.slug);
}

async function isCooldownBlocked(
  event: EventTemplateData,
  dayCount: number,
  logs: { eventSlug: string; dayCount: number }[],
): Promise<boolean> {
  const cooldown = event.cooldownDays ?? 0;
  if (cooldown <= 0) return false;
  const last = logs.find((log) => log.eventSlug === event.slug);
  if (!last) return false;
  return dayCount - last.dayCount < cooldown;
}

function pickWeightedEvent(events: EventTemplateData[]): EventTemplateData | null {
  if (events.length === 0) return null;
  const totalWeight = events.reduce((sum, event) => sum + (event.weight ?? 10), 0);
  if (totalWeight <= 0) return events[0];

  let roll = Math.random() * totalWeight;
  for (const event of events) {
    roll -= event.weight ?? 10;
    if (roll <= 0) return event;
  }
  return events[events.length - 1];
}

export async function getAvailableEventsForLocation(
  locationId: string,
  projectState: ProjectState,
  filterContext: EventPoolFilterContext = {},
): Promise<EventTemplateData[]> {
  const allEvents = await getEventTemplates();
  const logs = await getTriggerLogsForSeason(SEASON_ID);
  const available: EventTemplateData[] = [];

  for (const event of allEvents) {
    if (event.enabled === false) continue;
    if (!isStageMatch(event, projectState)) continue;
    if (!isLocationMatch(event, locationId)) continue;
    if (!areMilestonesUnlocked(event, projectState)) continue;
    if (!isDayInRange(event, projectState.dayCount)) continue;
    if (!matchesRiskTags(event, filterContext)) continue;
    if (!matchesAreaNames(event, filterContext)) continue;
    if (!matchesNpcNames(event, filterContext)) continue;
    if (await isOnceOnlyBlocked(event, logs)) continue;
    if (await isCooldownBlocked(event, projectState.dayCount, logs)) continue;
    available.push(event);
  }

  return available;
}

export async function triggerEventForLocationAction(params: {
  locationId: string;
  locationName: string;
  actionId: string;
  actionLabel: string;
  userId: string;
  projectState: ProjectState;
  locationRiskTags?: string[];
  locationRelatedAreaNames?: string[];
  locationRelatedNpcNames?: string[];
  actionRiskTags?: string[];
  actionRelatedNpcNames?: string[];
}): Promise<EventTriggerResult> {
  const empty: EventTriggerResult = {
    triggeredEvent: null,
    createdTasks: [],
    skippedTasks: [],
    message: "",
  };

  try {
    const available = await getAvailableEventsForLocation(params.locationId, params.projectState, {
      locationRiskTags: params.locationRiskTags,
      locationRelatedAreaNames: params.locationRelatedAreaNames,
      locationRelatedNpcNames: params.locationRelatedNpcNames,
      actionRiskTags: params.actionRiskTags,
      actionRelatedNpcNames: params.actionRelatedNpcNames,
    });
    if (available.length === 0) return empty;

    const selected = pickWeightedEvent(available);
    if (!selected) return empty;

    const createdTasks: Task[] = [];
    const skippedTasks: EventTriggerResult["skippedTasks"] = [];

    for (const slug of selected.triggerTaskSlugs || []) {
      const result = await createTaskFromTemplateSlug(slug);
      if (!result) {
        skippedTasks.push({ slug, title: slug, reason: "任务模板不存在" });
        continue;
      }
      if (result.created) {
        createdTasks.push(result.task);
      } else {
        skippedTasks.push({
          slug,
          title: result.task.title,
          reason:
            result.skipReason === "completed"
              ? "该任务已完成，未重复生成"
              : "已有进行中的同类任务",
        });
      }
    }

    await prisma.eventTriggerLog.create({
      data: {
        seasonId: SEASON_ID,
        eventSlug: selected.slug,
        locationId: params.locationId,
        userId: params.userId,
        dayCount: params.projectState.dayCount,
      },
    });

    let message: string;
    if (createdTasks.length > 0) {
      message =
        selected.resultText?.trim() ||
        `事件「${selected.title}」已触发，生成 ${createdTasks.length} 项任务`;
    } else if (skippedTasks.length > 0) {
      message =
        selected.noTaskText?.trim() ||
        `事件「${selected.title}」已触发，相关任务已存在或已完成`;
    } else {
      message = selected.resultText?.trim() || `事件「${selected.title}」已触发`;
    }

    const logContent = buildEventPoolLogContent({
      locationId: params.locationId,
      locationName: params.locationName,
      actionLabel: params.actionLabel,
      eventTitle: selected.title,
      eventSlug: selected.slug,
      createdCount: createdTasks.length,
      skippedCount: skippedTasks.length,
      message,
    });

    await writeGameLog({
      userId: params.userId,
      logType: "SYSTEM",
      content: logContent,
      effectSummary: JSON.stringify({
        type: "event_pool",
        eventSlug: selected.slug,
        locationId: params.locationId,
        actionId: params.actionId,
        createdCount: createdTasks.length,
        skippedCount: skippedTasks.length,
        message,
      }),
    });

    return {
      triggeredEvent: selected,
      createdTasks,
      skippedTasks,
      message,
    };
  } catch {
    return empty;
  }
}
