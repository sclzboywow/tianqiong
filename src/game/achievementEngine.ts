import { prisma } from "@/prisma/client";
import { broadcastAchievement } from "./broadcastEngine";
import { writeGameLog } from "./logEngine";
import { ACHIEVEMENTS } from "@/data/achievements";

export async function checkAchievements(
  userId: string,
  context: {
    choiceId?: string;
    taskRarity?: string;
    success?: boolean;
  },
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return [];

  const existing = await prisma.userAchievement.findMany({ where: { userId } });
  const unlockedIds = new Set(existing.map((a) => a.achievementId));
  const newlyUnlocked = [];

  const completedCount = await prisma.taskParticipant.count({
    where: { userId, status: "RESOLVED" },
  });

  const project = await prisma.projectState.findFirst();

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedIds.has(achievement.slug)) continue;

    let shouldUnlock = false;
    switch (achievement.conditionType) {
      case "task_complete_count":
        shouldUnlock = completedCount >= Number(achievement.conditionValue.count || 1);
        break;
      case "choice_made":
        shouldUnlock = context.choiceId === achievement.conditionValue.choiceId;
        break;
      case "metric_threshold": {
        const metric = achievement.conditionValue.metric as string;
        const threshold = Number(achievement.conditionValue.threshold || 0);
        const value = project ? (project as Record<string, unknown>)[metric] : 0;
        shouldUnlock = typeof value === "number" && value >= threshold;
        break;
      }
      case "task_rarity_complete":
        shouldUnlock =
          context.success === true &&
          context.taskRarity === achievement.conditionValue.rarity;
        break;
      default:
        break;
    }

    if (!shouldUnlock) continue;

    await prisma.userAchievement.create({
      data: { userId, achievementId: achievement.slug },
    });

    const reward = achievement.rewardConfig || {};
    await prisma.user.update({
      where: { id: userId },
      data: {
        reputation: user.reputation + Number(reward.reputation || 0),
        title: (reward.title as string) || user.title,
      },
    });

    await writeGameLog({
      userId,
      logType: "ACHIEVEMENT",
      content: `解锁成就【${achievement.name}】`,
    });

    if (achievement.broadcastEnabled) {
      await broadcastAchievement(user.nickname, achievement.name, achievement.description);
      await prisma.userAchievement.updateMany({
        where: { userId, achievementId: achievement.slug },
        data: { broadcasted: true },
      });
    }

    newlyUnlocked.push(achievement);
  }

  return newlyUnlocked;
}

export async function getUserAchievements(userId: string) {
  const records = await prisma.userAchievement.findMany({
    where: { userId },
    orderBy: { unlockedAt: "desc" },
  });
  return records.map((r) => ({
    ...r,
    achievement: ACHIEVEMENTS.find((a) => a.slug === r.achievementId),
  }));
}
