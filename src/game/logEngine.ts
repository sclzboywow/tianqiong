import { prisma } from "@/prisma/client";
import type { LogType } from "@/game/prisma-types";

const SEASON_ID = process.env.SEASON_ID || "season-1";

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
