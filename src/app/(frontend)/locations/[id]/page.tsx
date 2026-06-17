import { notFound, redirect } from "next/navigation";
import { PlayerShell } from "@/components/player/PlayerShell";
import { LocationDetailLayout } from "@/components/player/locations/LocationDetailLayout";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/prisma/client";
import { getLocationOverview } from "@/game/locationEngine";
import { getProjectState, ensureProjectState } from "@/game/projectEngine";
import { getStageConfig } from "@/game/projectStages";
import { buildActionDisplayItems } from "@/game/locationPresentationEngine";
import {
  getChapterInfo,
  getNextRecommendedAction,
  getPendingTaskGroups,
} from "@/game/playerGuidanceEngine";
import { listTasks } from "@/game/taskEngine";

export default async function LocationDetailPage({
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
  const overview = await getLocationOverview(id);
  if (!overview) notFound();

  const tasks = await listTasks();
  const chapterInfo = getChapterInfo(project);
  const pendingGroups = getPendingTaskGroups(tasks);
  const pendingCount =
    pendingGroups.mainline.length + pendingGroups.emergency.length;

  const stageConfig = getStageConfig(project.currentStage);
  const recommendedAction = getNextRecommendedAction(project, tasks);

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
    recommendedActionId,
  );

  return (
    <PlayerShell
      chapterSubtitle={chapterInfo.chapterSubtitle}
      userNickname={user.nickname}
      pendingTaskCount={pendingCount}
    >
      <LocationDetailLayout
        overview={overview}
        stageName={stageConfig?.name || project.currentStage}
        actionItems={actionItems}
        user={{
          stamina: user.stamina,
          spirit: user.spirit,
          level: user.level,
          reputation: user.reputation,
        }}
      />
    </PlayerShell>
  );
}
