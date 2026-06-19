import type { ProjectState, Task } from "@prisma/client";
import { prisma } from "@/prisma/client";
import { getNpcTaskActionById } from "@/data/npcTaskActions";
import { getNpcTaskRequirement } from "@/data/npcTaskRequirements";
import { getProjectState } from "./projectEngine";
import { listTasks } from "./taskEngine";
import { writeGameLog } from "./logEngine";
import { getLocationDisplayNameById } from "./locationDisplayName";
import { resolveNpcTaskActionsForTask } from "./npcTaskActionResolver";

export const NPC_TASK_ACTION_LOG_PREFIX = "【NPC任务动作】";

const SEASON_ID = process.env.SEASON_ID || "season-1";

function buildNpcTaskActionLogContent(params: {
  locationId: string;
  actionLabel: string;
  detail: string;
}): string {
  const locationName = getLocationDisplayNameById(params.locationId);
  const detail = params.detail.replace(/。$/, "");
  return `${NPC_TASK_ACTION_LOG_PREFIX}在「${locationName}」执行「${params.actionLabel}」，${detail}。`;
}

export async function getNpcTaskActionProgress(params: {
  seasonId?: string;
  taskSlugs?: string[];
  locationId?: string;
}): Promise<string[]> {
  const seasonId = params.seasonId || SEASON_ID;
  const rows = await prisma.npcTaskActionProgress.findMany({
    where: {
      seasonId,
      ...(params.taskSlugs?.length ? { taskSlug: { in: params.taskSlugs } } : {}),
      ...(params.locationId ? { locationId: params.locationId } : {}),
    },
    select: { actionId: true },
  });
  return rows.map((row) => row.actionId);
}

export async function completeNpcTaskAction(params: {
  seasonId?: string;
  taskSlug: string;
  locationId: string;
  actionId: string;
  userId?: string;
  project?: ProjectState;
  tasks?: Task[];
}): Promise<{
  ok: boolean;
  actionId: string;
  alreadyCompleted: boolean;
  message: string;
}> {
  const seasonId = params.seasonId || SEASON_ID;
  const action = getNpcTaskActionById(params.actionId);

  if (!action) {
    return {
      ok: false,
      actionId: params.actionId,
      alreadyCompleted: false,
      message: "动作不存在",
    };
  }

  if (action.taskSlug !== params.taskSlug || action.locationId !== params.locationId) {
    return {
      ok: false,
      actionId: params.actionId,
      alreadyCompleted: false,
      message: "动作与任务或地点不匹配",
    };
  }

  const existing = await prisma.npcTaskActionProgress.findUnique({
    where: {
      seasonId_taskSlug_locationId_actionId: {
        seasonId,
        taskSlug: params.taskSlug,
        locationId: params.locationId,
        actionId: params.actionId,
      },
    },
  });

  if (existing) {
    return {
      ok: true,
      actionId: params.actionId,
      alreadyCompleted: true,
      message: action.successLog ?? `「${action.label}」已完成`,
    };
  }

  const project = params.project ?? (await getProjectState(seasonId));
  if (!project) {
    return {
      ok: false,
      actionId: params.actionId,
      alreadyCompleted: false,
      message: "项目状态不存在",
    };
  }

  const tasks = params.tasks ?? (await listTasks());
  const completedActionIds = await getNpcTaskActionProgress({
    seasonId,
    taskSlugs: [params.taskSlug],
    locationId: params.locationId,
  });

  const resolvedActions = resolveNpcTaskActionsForTask({
    taskSlug: params.taskSlug,
    currentLocationId: params.locationId,
    project,
    tasks,
    completedActionIds,
  });

  const resolvedAction = resolvedActions.find((item) => item.id === params.actionId);
  if (!resolvedAction?.enabled) {
    return {
      ok: false,
      actionId: params.actionId,
      alreadyCompleted: false,
      message: resolvedAction?.reason ?? "动作条件尚未满足",
    };
  }

  await prisma.npcTaskActionProgress.create({
    data: {
      seasonId,
      taskSlug: params.taskSlug,
      locationId: params.locationId,
      actionId: params.actionId,
      userId: params.userId,
    },
  });

  const detail = action.successLog ?? `已执行「${action.label}」`;
  const requirement = getNpcTaskRequirement(params.taskSlug);
  const taskHint =
    action.requiresCanProgress && requirement?.taskTitle
      ? `${detail}，可前往任务页继续推进「${requirement.taskTitle}」。`
      : detail;

  await writeGameLog({
    seasonId,
    userId: params.userId,
    logType: "SYSTEM",
    content: buildNpcTaskActionLogContent({
      locationId: params.locationId,
      actionLabel: action.label,
      detail: taskHint,
    }),
  });

  return {
    ok: true,
    actionId: params.actionId,
    alreadyCompleted: false,
    message: taskHint,
  };
}
