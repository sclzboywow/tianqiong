import { redirect } from "next/navigation";
import { PlayerShell } from "@/components/player/PlayerShell";
import { TaskBoardLayout } from "@/components/player/tasks/TaskBoardLayout";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/prisma/client";
import { getProjectState, ensureProjectState } from "@/game/projectEngine";
import { listTasks } from "@/game/taskEngine";
import { getRecentTaskBoardLogs } from "@/game/logEngine";
import { buildTaskBoardData } from "@/game/taskPresentationEngine";
import { getAllLocations } from "@/game/locationEngine";
import { getLocationActions } from "@/game/locationActionLoader";
import {
  getChapterGoalItems,
  getChapterInfo,
  getPendingTaskGroups,
} from "@/game/playerGuidanceEngine";

export default async function TasksPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/register");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/register");

  await ensureProjectState();
  const project = await getProjectState();
  if (!project) redirect("/register");

  const [tasks, recentTaskLogs, locations, locationActions] = await Promise.all([
    listTasks(),
    getRecentTaskBoardLogs(3),
    getAllLocations(),
    getLocationActions(),
  ]);

  const chapterInfo = getChapterInfo(project);
  const chapterGoals = getChapterGoalItems(project, tasks);
  const pendingGroups = getPendingTaskGroups(tasks);
  const pendingCount =
    pendingGroups.mainline.length + pendingGroups.emergency.length;

  const boardData = buildTaskBoardData({
    project,
    tasks,
    chapterGoals,
    recentTaskLogs,
    locations,
    locationActions,
  });

  return (
    <PlayerShell
      chapterSubtitle={chapterInfo.chapterSubtitle}
      userNickname={user.nickname}
      pendingTaskCount={pendingCount}
    >
      <TaskBoardLayout data={boardData} />
    </PlayerShell>
  );
}
