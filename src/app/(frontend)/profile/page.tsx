import { redirect } from "next/navigation";
import { PlayerShell } from "@/components/player/PlayerShell";
import { ProfilePageLayout } from "@/components/player/profile/ProfilePageLayout";
import { PlayerIdentityCard } from "@/components/player/profile/PlayerIdentityCard";
import { PlayerGrowthCard } from "@/components/player/profile/PlayerGrowthCard";
import { PlayerResourcesCard } from "@/components/player/profile/PlayerResourcesCard";
import { PlayerJobAbilityCard } from "@/components/player/profile/PlayerJobAbilityCard";
import { PlayerContributionCard } from "@/components/player/profile/PlayerContributionCard";
import { PlayerRecentGrowthCard } from "@/components/player/profile/PlayerRecentGrowthCard";
import { PlayerCareerRankCard } from "@/components/player/profile/PlayerCareerRankCard";
import { PlayerCareerTrackCard } from "@/components/player/profile/PlayerCareerTrackCard";
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
        pageHeader={
          <header>
            <h1 className="text-xl font-semibold text-[#EAF3FF] lg:text-2xl">角色档案</h1>
            <p className="mt-1 text-sm text-[#8EA3B8]">
              查看你的岗位、等级、职业阶位、资源与项目贡献。
            </p>
          </header>
        }
        identity={<PlayerIdentityCard profile={profile} />}
        growth={<PlayerGrowthCard profile={profile} />}
        careerRank={<PlayerCareerRankCard career={profile.career} />}
        resources={<PlayerResourcesCard profile={profile} />}
        jobAbility={<PlayerJobAbilityCard jobAbility={profile.jobAbility} />}
        careerTrack={<PlayerCareerTrackCard track={profile.career.trackSuggestion} />}
        contribution={<PlayerContributionCard contribution={profile.contribution} />}
        recentGrowth={<PlayerRecentGrowthCard logs={profile.recentGrowth} maxItems={5} />}
      />
    </PlayerShell>
  );
}
