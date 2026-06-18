import { redirect } from "next/navigation";
import { PlayerShell } from "@/components/player/PlayerShell";
import { ProfilePageLayout } from "@/components/player/profile/ProfilePageLayout";
import { PlayerIdentityCard } from "@/components/player/profile/PlayerIdentityCard";
import { PlayerGrowthCard } from "@/components/player/profile/PlayerGrowthCard";
import { PlayerResourcesCard } from "@/components/player/profile/PlayerResourcesCard";
import { PlayerRoleAbilityCard } from "@/components/player/profile/PlayerRoleAbilityCard";
import { PlayerContributionCard } from "@/components/player/profile/PlayerContributionCard";
import { PlayerRecentGrowthCard } from "@/components/player/profile/PlayerRecentGrowthCard";
import { PlayerCareerRankCard } from "@/components/player/profile/PlayerCareerRankCard";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/prisma/client";
import { ensureProjectState, getProjectState } from "@/game/projectEngine";
import { listTasks } from "@/game/taskEngine";
import { getPendingTaskGroups } from "@/game/playerGuidanceEngine";
import { buildProfileViewData } from "@/game/profilePresentationEngine";

export default async function ProfilePage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/register");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/register");

  await ensureProjectState();
  const project = await getProjectState();
  if (!project) redirect("/register");

  const tasks = await listTasks();

  const profile = await buildProfileViewData(
    user,
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

  const pendingGroups = getPendingTaskGroups(tasks);
  const pendingCount =
    pendingGroups.mainline.length + pendingGroups.emergency.length;

  return (
    <PlayerShell
      chapterSubtitle={profile.chapterSubtitle}
      userNickname={profile.nickname}
      pendingTaskCount={pendingCount}
    >
      <ProfilePageLayout
        identity={<PlayerIdentityCard profile={profile} />}
        growth={<PlayerGrowthCard profile={profile} />}
        careerRank={<PlayerCareerRankCard career={profile.career} />}
        resources={<PlayerResourcesCard profile={profile} />}
        roleAbility={
          <PlayerRoleAbilityCard
            jobAbility={profile.jobAbility}
            track={profile.career.trackSuggestion}
          />
        }
        contribution={<PlayerContributionCard contribution={profile.contribution} />}
        recentGrowth={<PlayerRecentGrowthCard logs={profile.recentGrowth} />}
      />
    </PlayerShell>
  );
}
