import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/prisma/client";
import { getLocationOverview } from "@/game/locationEngine";
import { getRecentLocationActionLogs } from "@/game/logEngine";
import { NPC_TASK_ACTION_LOG_PREFIX } from "@/game/npcTaskActionProgressEngine";
import { buildActionDisplayItems } from "@/game/locationPresentationEngine";
import { getProjectState } from "@/game/projectEngine";
import { getStageConfig } from "@/game/projectStages";
import { getNextRecommendedAction } from "@/game/playerGuidanceEngine";
import { listTasks } from "@/game/taskEngine";
import { sanitizePlayerLogContent } from "@/game/taskEffectPlayerDisplay";

const SEASON_ID = process.env.SEASON_ID || "season-1";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 401 });
  }

  const { id } = await params;
  const overview = await getLocationOverview(id);
  if (!overview) {
    return NextResponse.json({ error: "地点不存在" }, { status: 404 });
  }

  const project = await getProjectState();
  if (!project) {
    return NextResponse.json({ error: "项目状态不存在" }, { status: 404 });
  }

  const tasks = await listTasks();
  const recommendedAction = getNextRecommendedAction(project, tasks);
  const stageConfig = getStageConfig(project.currentStage);

  let recommendedActionId = overview.availableActions[0]?.id;
  if (
    recommendedAction.locationId === overview.location.id &&
    recommendedAction.actionLabel
  ) {
    const matched = overview.availableActions.find(
      (action) => action.label === recommendedAction.actionLabel,
    );
    if (matched) recommendedActionId = matched.id;
  }

  const actionItems = buildActionDisplayItems(
    overview.availableActions,
    tasks,
    recommendedActionId,
  );

  const mapLogs = await getRecentLocationActionLogs(
    { id: overview.location.id, name: overview.location.name },
    5,
  );

  const npcActionLogs = await prisma.gameLog.findMany({
    where: {
      seasonId: SEASON_ID,
      content: { startsWith: NPC_TASK_ACTION_LOG_PREFIX },
      OR: [
        { content: { contains: overview.location.name } },
        { content: { contains: overview.location.id } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, content: true, createdAt: true },
  });

  const npcInteractionLogs = await prisma.gameLog.findMany({
    where: {
      seasonId: SEASON_ID,
      AND: [
        { content: { startsWith: "【NPC互动】" } },
        { content: { contains: overview.location.name } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, content: true, createdAt: true },
  });

  const logs = [...mapLogs, ...npcActionLogs, ...npcInteractionLogs]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8)
    .map((log) => ({
      id: log.id,
      content: sanitizePlayerLogContent(log.content),
      createdAt: log.createdAt.toISOString(),
    }));

  return NextResponse.json({
    locationId: overview.location.id,
    locationName: overview.location.name,
    unlocked: overview.unlocked,
    stageName: stageConfig?.name || project.currentStage,
    actionItems,
    logs,
    user: {
      stamina: user.stamina,
      spirit: user.spirit,
      level: user.level,
      reputation: user.reputation,
    },
  });
}
