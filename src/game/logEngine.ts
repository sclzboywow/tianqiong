import { prisma } from "@/prisma/client";
import type { LogType } from "@/game/prisma-types";
import { CHARACTER_GROWTH_LOG_PREFIX } from "./playerProgressEngine";

const SEASON_ID = process.env.SEASON_ID || "season-1";

export const MAP_ACTION_LOG_PREFIX = "【协同地图】";
export const EVENT_POOL_LOG_PREFIX = "【事件池】";

export type GameLogSummary = {
  id: string;
  content: string;
  createdAt: Date;
  logType?: LogType;
  category?: "action" | "event" | "task" | "other";
};

function categorizeLog(log: { content: string; logType: LogType }): GameLogSummary["category"] {
  if (log.content.startsWith(MAP_ACTION_LOG_PREFIX)) return "action";
  if (log.content.startsWith(EVENT_POOL_LOG_PREFIX)) return "event";
  if (log.logType === "TASK" || log.content.startsWith(CHARACTER_GROWTH_LOG_PREFIX)) return "task";
  return "other";
}

export async function getRecentPlayerActivityLogs(
  limit = 8,
  seasonId = SEASON_ID,
): Promise<GameLogSummary[]> {
  const rows = await prisma.gameLog.findMany({
    where: {
      seasonId,
      OR: [
        { content: { startsWith: MAP_ACTION_LOG_PREFIX } },
        { content: { startsWith: EVENT_POOL_LOG_PREFIX } },
        { logType: "TASK" },
        { content: { startsWith: CHARACTER_GROWTH_LOG_PREFIX } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, content: true, createdAt: true, logType: true },
  });

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    createdAt: row.createdAt,
    logType: row.logType as LogType,
    category: categorizeLog({ content: row.content, logType: row.logType as LogType }),
  }));
}

export async function writeGameLog(params: {
  seasonId?: string;
  userId?: string;
  logType: LogType;
  content: string;
  effectSummary?: string;
  broadcastLevel?: string;
}) {
  return prisma.gameLog.create({
    data: {
      seasonId: params.seasonId || SEASON_ID,
      userId: params.userId,
      logType: params.logType,
      content: params.content,
      effectSummary: params.effectSummary,
      broadcastLevel: params.broadcastLevel,
    },
  });
}

export async function getTodayLogs(seasonId = SEASON_ID) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return prisma.gameLog.findMany({
    where: { seasonId, createdAt: { gte: start } },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { nickname: true } } },
  });
}

export async function getRecentMapActionLogs(limit = 5, seasonId = SEASON_ID): Promise<GameLogSummary[]> {
  return prisma.gameLog.findMany({
    where: {
      seasonId,
      logType: "SYSTEM",
      content: { startsWith: MAP_ACTION_LOG_PREFIX },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, content: true, createdAt: true },
  });
}

export async function getRecentLocationActionLogs(
  location: { id: string; name: string },
  limit = 5,
  seasonId = SEASON_ID,
): Promise<GameLogSummary[]> {
  return prisma.gameLog.findMany({
    where: {
      seasonId,
      logType: "SYSTEM",
      content: { startsWith: MAP_ACTION_LOG_PREFIX },
      OR: [
        { content: { contains: location.name } },
        { content: { contains: location.id } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, content: true, createdAt: true },
  });
}

export function buildMapActionLogContent(params: {
  locationId: string;
  locationName: string;
  actionLabel: string;
  createdCount: number;
  skippedCount: number;
  message: string;
}) {
  const { locationId, locationName, actionLabel, createdCount, skippedCount, message } = params;
  let detail: string;
  if (createdCount > 0) {
    detail = `已生成 ${createdCount} 项任务`;
    if (skippedCount > 0) detail += `，跳过 ${skippedCount} 项`;
  } else {
    detail = message;
  }
  return `${MAP_ACTION_LOG_PREFIX}在「${locationName}」(${locationId})执行「${actionLabel}」，${detail}。`;
}

export function buildEventPoolLogContent(params: {
  locationId: string;
  locationName: string;
  actionLabel: string;
  eventTitle: string;
  eventSlug: string;
  createdCount: number;
  skippedCount: number;
  message: string;
}) {
  const { locationId, locationName, actionLabel, eventTitle, eventSlug, createdCount, skippedCount, message } =
    params;
  let detail = message;
  if (createdCount > 0) {
    detail = `已生成 ${createdCount} 项任务`;
    if (skippedCount > 0) detail += `，跳过 ${skippedCount} 项`;
  }
  return `${EVENT_POOL_LOG_PREFIX}在「${locationName}」(${locationId})执行「${actionLabel}」后触发事件「${eventTitle}」(${eventSlug})，${detail}。`;
}
