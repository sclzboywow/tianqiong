import { redirect } from "next/navigation";
import { PlayerShell } from "@/components/player/PlayerShell";
import { PlayerResourceBar } from "@/components/player/PlayerResourceBar";
import { RecommendedActionCard } from "@/components/player/RecommendedActionCard";
import { ProjectStatusCard } from "@/components/player/ProjectStatusCard";
import { ChapterMilestoneCard } from "@/components/player/ChapterMilestoneCard";
import { PendingTasksSummary } from "@/components/player/PendingTasksSummary";
import { RecentActivityCard } from "@/components/player/RecentActivityCard";
import { CommandCenterLayout } from "@/components/player/CommandCenterLayout";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/prisma/client";
import { getProjectState, ensureProjectState } from "@/game/projectEngine";
import { listTasks } from "@/game/taskEngine";
import { getRecentPlayerActivityLogs } from "@/game/logEngine";
import {
  getChapterGoalItems,
  getChapterInfo,
  getNextRecommendedAction,
  getPendingTaskGroups,
} from "@/game/playerGuidanceEngine";

export default async function ProjectPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/register");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/register");

  await ensureProjectState();
  const project = await getProjectState();
  if (!project) redirect("/register");

  const [tasks, recentLogs] = await Promise.all([listTasks(), getRecentPlayerActivityLogs(8)]);

  const recommendedAction = getNextRecommendedAction(project, tasks);
  const chapterInfo = getChapterInfo(project);
  const chapterGoals = getChapterGoalItems(project, tasks);
  const pendingGroups = getPendingTaskGroups(tasks);
  const pendingCount =
    pendingGroups.mainline.length + pendingGroups.emergency.length;

  return (
    <PlayerShell
      chapterSubtitle={chapterInfo.chapterSubtitle}
      userNickname={user.nickname}
      pendingTaskCount={pendingCount}
    >
      <CommandCenterLayout
        recommendedAction={<RecommendedActionCard action={recommendedAction} />}
        resourceBar={
          <PlayerResourceBar
            stamina={user.stamina}
            spirit={user.spirit}
            level={user.level}
            exp={user.exp}
            reputation={user.reputation}
            gold={user.gold}
          />
        }
        projectStatus={<ProjectStatusCard project={project} />}
        chapterMilestones={<ChapterMilestoneCard goals={chapterGoals} />}
        pendingTasks={<PendingTasksSummary groups={pendingGroups} />}
        pendingTasksMobile={<PendingTasksSummary groups={pendingGroups} maxItems={3} />}
        recentActivity={<RecentActivityCard logs={recentLogs} maxItems={5} />}
        recentActivityMobile={<RecentActivityCard logs={recentLogs} maxItems={3} />}
      />
    </PlayerShell>
  );
}
