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
import { ensureMergedNpcProfiles, getNpcProfileRevision } from "@/game/npcProfileLoader";
import { getNpcTaskActionProgress } from "@/game/npcTaskActionProgressEngine";
import {
  getChapterInfo,
  getNextRecommendedAction,
  getPendingTaskGroups,
} from "@/game/playerGuidanceEngine";

export const dynamic = "force-dynamic";

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

  const npcProfiles = await ensureMergedNpcProfiles();
  const npcProfileRevision = await getNpcProfileRevision();

  const completedNpcTaskActionIds = await getNpcTaskActionProgress({
    taskSlugs: tasks.map((task) => task.templateId),
  });

  return (
    <PlayerShell
      chapterSubtitle={chapterInfo.chapterSubtitle}
      userNickname={user.nickname}
      pendingTaskCount={pendingCount}
    >
      <LocationSandTablePage
        data={sandtableData}
        project={project}
        tasks={tasks}
        completedNpcTaskActionIds={completedNpcTaskActionIds}
        npcProfiles={npcProfiles}
        npcProfileRevision={npcProfileRevision}
      />
    </PlayerShell>
  );
}
