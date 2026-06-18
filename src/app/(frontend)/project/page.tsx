import { redirect } from "next/navigation";
import { PlayerShell } from "@/components/player/PlayerShell";
import { PlayerResourceBar } from "@/components/player/PlayerResourceBar";
import { RecommendedActionCard } from "@/components/player/RecommendedActionCard";
import { ProjectStatusCard } from "@/components/player/ProjectStatusCard";
import { ChapterMilestoneCard } from "@/components/player/ChapterMilestoneCard";
import { PendingTasksSummary } from "@/components/player/PendingTasksSummary";
import { RecentActivityCard } from "@/components/player/RecentActivityCard";
import { CommandCenterLayout } from "@/components/player/CommandCenterLayout";
import { CommandCenterHeader } from "@/components/player/CommandCenterHeader";
import { CommandCenterQuickLinks } from "@/components/player/CommandCenterQuickLinks";
import { CommandCenterOnboardingProvider } from "@/components/player/ChapterOneOnboardingModal";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/prisma/client";
import { getProjectState, ensureProjectState, getStageDisplayInfo } from "@/game/projectEngine";
import { listTasks } from "@/game/taskEngine";
import { getRecentPlayerActivityLogs } from "@/game/logEngine";
import {
  getChapterGoalItems,
  getChapterInfo,
  getNextRecommendedAction,
  getPendingTaskGroups,
  getProjectRiskSummary,
} from "@/game/playerGuidanceEngine";
import { getCurrentCareerRank } from "@/game/careerRankEngine";
import { MAP_LOCATIONS } from "@/data/locations";
import { LOCATION_ACTIONS } from "@/data/locationActions";
import { buildTemplateToLocationIdMap } from "@/game/taskPresentationEngine";

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
  const stageInfo = getStageDisplayInfo(project);
  const riskSummary = getProjectRiskSummary(project);
  const pendingCount =
    pendingGroups.mainline.length + pendingGroups.emergency.length;

  const templateLocationIdMap = buildTemplateToLocationIdMap(MAP_LOCATIONS, LOCATION_ACTIONS);
  const locationHrefByTaskId: Record<string, string> = {};
  for (const task of tasks) {
    const locationId = templateLocationIdMap.get(task.templateId);
    if (locationId) {
      locationHrefByTaskId[task.id] = `/locations?focus=${locationId}`;
    }
  }

  const careerRank = getCurrentCareerRank(
    {
      id: user.id,
      level: user.level,
      reputation: user.reputation,
      job: user.job,
    },
    project,
    tasks.map((task) => ({
      templateId: task.templateId,
      status: task.status,
      participants: task.participants.map((p) => ({
        userId: p.userId,
        choiceId: p.choiceId,
      })),
    })),
  );

  const onboardingProps = {
    recommendedHref: recommendedAction.href,
    recommendedLocationName: recommendedAction.locationName,
    recommendedActionLabel: recommendedAction.actionLabel,
  };

  return (
    <PlayerShell
      chapterSubtitle={chapterInfo.chapterSubtitle}
      userNickname={user.nickname}
      pendingTaskCount={pendingCount}
    >
      <CommandCenterOnboardingProvider {...onboardingProps}>
        <CommandCenterLayout
          recommendedAction={<RecommendedActionCard action={recommendedAction} />}
          header={
            <CommandCenterHeader
              chapterInfo={chapterInfo}
              stageName={stageInfo.stageConfig.name}
              stageProgress={project.stageProgress}
              overallProgress={project.overallProgress}
              mainlineBlockerCount={pendingGroups.mainline.length}
              riskCount={riskSummary.riskCount}
              riskLabel={riskSummary.latentRiskLabel}
              resources={{
                stamina: user.stamina,
                spirit: user.spirit,
                level: user.level,
                exp: user.exp,
                reputation: user.reputation,
                gold: user.gold,
              }}
            />
          }
          chapterMilestones={<ChapterMilestoneCard goals={chapterGoals} variant="hud" />}
          pendingTasks={
            <PendingTasksSummary
              groups={pendingGroups}
              maxItems={3}
              locationHrefByTaskId={locationHrefByTaskId}
            />
          }
          projectStatus={<ProjectStatusCard project={project} />}
          recentActivity={<RecentActivityCard logs={recentLogs} maxItems={3} />}
          quickLinks={<CommandCenterQuickLinks />}
          resourceBar={
            <PlayerResourceBar
              variant="compact"
              stamina={user.stamina}
              spirit={user.spirit}
              level={user.level}
              exp={user.exp}
              reputation={user.reputation}
              gold={user.gold}
              careerRankTitle={careerRank.title}
            />
          }
        />
      </CommandCenterOnboardingProvider>
    </PlayerShell>
  );
}
