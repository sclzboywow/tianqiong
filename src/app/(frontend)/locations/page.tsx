import { redirect } from "next/navigation";
import { PlayerShell } from "@/components/player/PlayerShell";
import { ExplorePageLayout } from "@/components/player/locations/ExplorePageLayout";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/prisma/client";
import { getProjectState, ensureProjectState } from "@/game/projectEngine";
import { listTasks } from "@/game/taskEngine";
import { getMapLocations } from "@/game/locationLoader";
import { getLocationActions } from "@/game/locationActionLoader";
import { getRecentMapActionLogs } from "@/game/logEngine";
import { buildExplorePageData } from "@/game/locationPresentationEngine";
import {
  getChapterGoalItems,
  getChapterInfo,
  getNextRecommendedAction,
  getPendingTaskGroups,
} from "@/game/playerGuidanceEngine";

export default async function LocationsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/register");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/register");

  await ensureProjectState();
  const project = await getProjectState();
  if (!project) redirect("/register");

  const [tasks, locations, actions, recentLogs] = await Promise.all([
    listTasks(),
    getMapLocations(),
    getLocationActions(),
    getRecentMapActionLogs(8),
  ]);

  const recommendedAction = getNextRecommendedAction(project, tasks);
  const chapterInfo = getChapterInfo(project);
  const chapterGoals = getChapterGoalItems(project, tasks);
  const pendingGroups = getPendingTaskGroups(tasks);
  const pendingCount =
    pendingGroups.mainline.length + pendingGroups.emergency.length;

  const exploreData = await buildExplorePageData({
    project,
    tasks,
    locations,
    actions,
    recommendedAction,
    chapterGoals,
    recentLogs,
  });

  return (
    <PlayerShell
      chapterSubtitle={chapterInfo.chapterSubtitle}
      userNickname={user.nickname}
      pendingTaskCount={pendingCount}
    >
      <ExplorePageLayout data={exploreData} />
    </PlayerShell>
  );
}
