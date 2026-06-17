import { redirect } from "next/navigation";
import { PlayerShell } from "@/components/player/PlayerShell";
import { DailyReportClient } from "@/components/player/daily-report/DailyReportClient";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/prisma/client";
import { ensureProjectState, getProjectState } from "@/game/projectEngine";
import { listTasks } from "@/game/taskEngine";
import {
  getChapterInfo,
  getNextRecommendedAction,
  getPendingTaskGroups,
} from "@/game/playerGuidanceEngine";
import { buildDailyReportViewData } from "@/game/dailyReportPresentationEngine";

export default async function DailyReportPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/register");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/register");

  await ensureProjectState();
  const project = await getProjectState();
  if (!project) redirect("/register");

  const tasks = await listTasks();
  const chapterInfo = getChapterInfo(project);
  const recommendedAction = getNextRecommendedAction(project, tasks);
  const reportData = await buildDailyReportViewData(recommendedAction);

  const pendingGroups = getPendingTaskGroups(tasks);
  const pendingCount =
    pendingGroups.mainline.length + pendingGroups.emergency.length;

  return (
    <PlayerShell
      chapterSubtitle={chapterInfo.chapterSubtitle}
      userNickname={user.nickname}
      pendingTaskCount={pendingCount}
    >
      <DailyReportClient data={reportData} />
    </PlayerShell>
  );
}
