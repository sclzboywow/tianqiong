import { notFound, redirect } from "next/navigation";
import { PlayerShell } from "@/components/player/PlayerShell";
import { TaskDetailClient } from "@/components/player/tasks/detail/TaskDetailClient";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/prisma/client";
import { getTaskById } from "@/game/taskEngine";
import { getProjectState, ensureProjectState } from "@/game/projectEngine";
import { buildTaskDetailViewData } from "@/game/taskDetailPresentationEngine";
import {
  getChapterInfo,
  getPendingTaskGroups,
} from "@/game/playerGuidanceEngine";
import { listTasks } from "@/game/taskEngine";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/register");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/register");

  await ensureProjectState();
  const project = await getProjectState();
  if (!project) redirect("/register");

  const { id } = await params;
  const task = await getTaskById(id);
  if (!task) notFound();

  const viewData = await buildTaskDetailViewData(task, project, userId);

  const tasks = await listTasks();
  const chapterInfo = getChapterInfo(project);
  const pendingGroups = getPendingTaskGroups(tasks);
  const pendingCount =
    pendingGroups.mainline.length + pendingGroups.emergency.length;

  return (
    <PlayerShell
      chapterSubtitle={chapterInfo.chapterSubtitle}
      userNickname={user.nickname}
      pendingTaskCount={pendingCount}
    >
      <TaskDetailClient initialData={viewData} />
    </PlayerShell>
  );
}
