import { redirect } from "next/navigation";
import { PlayerShell } from "@/components/player/PlayerShell";
import { LocationSandTablePage } from "@/components/player/locations/LocationSandTablePage";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/prisma/client";
import { getProjectState, ensureProjectState } from "@/game/projectEngine";
import { listTasks } from "@/game/taskEngine";
import { getMapLocations } from "@/game/locationLoader";
import { getLocationActions } from "@/game/locationActionLoader";
import { buildLocationSandtableViewData } from "@/game/locationSandtablePresentationEngine";
import {
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

  const [tasks, locations, actions] = await Promise.all([
    listTasks(),
    getMapLocations(),
    getLocationActions(),
  ]);

  const recommendedAction = getNextRecommendedAction(project, tasks);
  const chapterInfo = getChapterInfo(project);
  const pendingGroups = getPendingTaskGroups(tasks);
  const pendingCount =
    pendingGroups.mainline.length + pendingGroups.emergency.length;

  const sandtableData = await buildLocationSandtableViewData({
    project,
    tasks,
    locations,
    actions,
    recommendedAction,
  });

  return (
    <PlayerShell
      chapterSubtitle={chapterInfo.chapterSubtitle}
      userNickname={user.nickname}
      pendingTaskCount={pendingCount}
    >
      <LocationSandTablePage data={sandtableData} />
    </PlayerShell>
  );
}
