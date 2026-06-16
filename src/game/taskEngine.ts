import { prisma } from "@/prisma/client";
import type { ProjectState, Task, TaskParticipant, User } from "@prisma/client";
import { applyMetricEffects } from "./projectEngine";
import { writeGameLog } from "./logEngine";
import { calculateRewards, applySpiritCost } from "./rewardEngine";
import { applyNpcEffectsFromMetrics } from "./npcEngine";
import { broadcastMajorEvent } from "./broadcastEngine";
import { checkAchievements } from "./achievementEngine";
import { rollSuccess } from "@/utils/random";
import type { ChoiceEffectsMap, MetricEffects, ResolutionMode, TaskTemplateData } from "./types";

const SEASON_ID = process.env.SEASON_ID || "season-1";

type ParticipantWithUser = TaskParticipant & {
  user: Pick<User, "id" | "nickname" | "job" | "level">;
};

type TaskWithParticipants = Task & { participants: ParticipantWithUser[] };

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function inferResolutionMode(rarity: string): ResolutionMode {
  if (rarity === "R") return "SOLO";
  if (rarity === "UR") return "ROLE_CHECKLIST";
  if (rarity === "SSR") return "ROLE_CHECKLIST";
  return "VOTE";
}

function getResolutionMode(task: Task): ResolutionMode {
  return (task.resolutionMode as ResolutionMode) || "SOLO";
}

function getMinResolveCount(task: Task): number {
  return task.minResolveCount || task.requiredCount || 1;
}

function getSubmittedParticipants(task: TaskWithParticipants): ParticipantWithUser[] {
  return task.participants.filter((p) => p.choiceId);
}

export function calculateVoteWeight(
  task: Task,
  user: Pick<User, "job" | "level">,
): number {
  let weight = 1;
  const requiredJobs = parseJson<string[]>(task.requiredJobs, []);

  if (requiredJobs.includes(user.job)) weight += 0.5;
  if (user.level >= 5) weight += 0.2;
  if (user.level >= 10) weight += 0.3;

  return weight;
}

function calculateRoleCoverageRate(task: Task, participants: ParticipantWithUser[]): number {
  const requiredJobs = parseJson<string[]>(task.requiredJobs, []);
  if (requiredJobs.length === 0) return 1;

  const coveredJobs = new Set(
    participants.map((p) => p.user.job).filter((job) => requiredJobs.includes(job)),
  );
  return coveredJobs.size / requiredJobs.length;
}

export function calculateFinalChoice(
  task: Task,
  participants: ParticipantWithUser[],
): string {
  const scores = new Map<string, number>();

  for (const participant of participants) {
    if (!participant.choiceId) continue;
    const current = scores.get(participant.choiceId) || 0;
    scores.set(participant.choiceId, current + (participant.voteWeight || 1));
  }

  const entries = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) throw new Error("暂无已提交选择的参与者");

  const topScore = entries[0][1];
  const tied = entries.filter((entry) => entry[1] === topScore);
  if (tied.length === 1) return tied[0][0];

  const requiredJobs = parseJson<string[]>(task.requiredJobs, []);
  let bestChoice = tied[0][0];
  let bestJobCount = -1;
  let bestEarliest: Date | null = null;

  for (const [choiceId] of tied) {
    const choiceParticipants = participants.filter((p) => p.choiceId === choiceId);
    const jobCount = choiceParticipants.filter((p) => requiredJobs.includes(p.user.job)).length;
    const earliest = choiceParticipants
      .map((p) => p.choiceSubmittedAt)
      .filter((date): date is Date => date instanceof Date)
      .sort((a, b) => a.getTime() - b.getTime())[0];

    const isBetter =
      jobCount > bestJobCount ||
      (jobCount === bestJobCount &&
        earliest &&
        (!bestEarliest || earliest.getTime() < bestEarliest.getTime()));

    if (isBetter) {
      bestChoice = choiceId;
      bestJobCount = jobCount;
      bestEarliest = earliest || null;
    }
  }

  return bestChoice;
}

export function calculateGroupSuccessRate(
  task: Task,
  submittedParticipants: ParticipantWithUser[],
  finalChoiceId: string,
  projectState: ProjectState | null,
): number {
  let rate = task.baseSuccessRate ?? 60;
  const submittedCount = submittedParticipants.length;

  if (submittedCount >= task.requiredCount) rate += 8;

  const roleCoverageRate = calculateRoleCoverageRate(task, submittedParticipants);
  rate += roleCoverageRate * 12;

  if (getResolutionMode(task) === "ROLE_CHECKLIST" && roleCoverageRate < 0.5) {
    rate -= 10;
  }

  const totalWeight = submittedParticipants.reduce((sum, p) => sum + (p.voteWeight || 1), 0);
  const finalChoiceWeight = submittedParticipants
    .filter((p) => p.choiceId === finalChoiceId)
    .reduce((sum, p) => sum + (p.voteWeight || 1), 0);
  const consensusRate = totalWeight > 0 ? finalChoiceWeight / totalWeight : 0;

  if (consensusRate >= 0.7) rate += 6;
  if (consensusRate < 0.45) rate -= 8;

  const avgLevel =
    submittedParticipants.reduce((sum, p) => sum + (p.user.level || 1), 0) / submittedCount;
  rate += Math.min(8, avgLevel);

  if (projectState) {
    if (projectState.fireRisk > 70) rate -= 8;
    if (projectState.safety < 40) rate -= 8;
    if ((projectState.latentRisk ?? 20) > 70) rate -= 6;
  }

  return Math.max(5, Math.min(95, rate));
}

function resolveFinalEffects(task: Task, finalChoiceId: string, success: boolean): MetricEffects {
  const choiceEffects = parseJson<ChoiceEffectsMap>(task.choiceEffects, {});
  const successEffects = parseJson<MetricEffects>(task.successEffects, {});
  const failEffects = parseJson<MetricEffects>(task.failEffects, {});
  const effects = choiceEffects[finalChoiceId] || {};

  return success ? { ...effects, ...successEffects } : { ...effects, ...failEffects };
}

function getBaseContribution(rarity: string): number {
  const map: Record<string, number> = { R: 1, SR: 2, SSR: 3, UR: 5 };
  return map[rarity] || 1;
}

async function grantParticipantRewards(
  task: Task,
  submittedParticipants: ParticipantWithUser[],
  success: boolean,
  finalChoiceId: string,
) {
  const requiredJobs = parseJson<string[]>(task.requiredJobs, []);
  const rewardsList: Array<{
    userId: string;
    contribution: number;
    exp: number;
    gold: number;
    reputation: number;
  }> = [];

  for (const participant of submittedParticipants) {
    const user = await prisma.user.findUnique({ where: { id: participant.userId } });
    if (!user) continue;

    const isJobMatched = requiredJobs.includes(user.job);
    const contribution =
      getBaseContribution(task.rarity) +
      (isJobMatched ? 1 : 0) +
      (participant.choiceId === finalChoiceId ? 2 : 0) +
      (success ? 2 : 0);

    const rewards = calculateRewards({ rarity: task.rarity, success, contribution });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        exp: user.exp + rewards.exp,
        gold: user.gold + rewards.gold,
        reputation: user.reputation + rewards.reputation,
        spirit: applySpiritCost(user.spirit),
        level: user.exp + rewards.exp >= user.level * 100 ? user.level + 1 : user.level,
      },
    });

    await prisma.taskParticipant.update({
      where: { id: participant.id },
      data: {
        contribution,
        rewardStatus: "GRANTED",
        status: success ? "RESOLVED" : "FAILED",
      },
    });

    await checkAchievements(user.id, {
      choiceId: participant.choiceId!,
      taskRarity: task.rarity,
      success,
    });

    rewardsList.push({ userId: user.id, ...rewards });
  }

  return rewardsList;
}

export async function listTasks(status?: string) {
  return prisma.task.findMany({
    where: {
      seasonId: SEASON_ID,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      participants: {
        include: { user: { select: { id: true, nickname: true, job: true, level: true } } },
      },
    },
  });
}

export async function getTaskById(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      participants: {
        include: { user: { select: { id: true, nickname: true, job: true, level: true } } },
      },
    },
  });
}

export async function joinTask(taskId: string, userId: string) {
  const task = await getTaskById(taskId);
  if (!task) throw new Error("TASK_NOT_FOUND");
  if (task.status !== "PENDING" && task.status !== "IN_PROGRESS") {
    throw new Error("TASK_NOT_AVAILABLE");
  }

  const existing = task.participants.find((p) => p.userId === userId);
  if (existing) return existing;

  const participant = await prisma.taskParticipant.create({
    data: { taskId, userId, status: "JOINED" },
  });

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      currentCount: { increment: 1 },
      status: "IN_PROGRESS",
    },
  });

  await writeGameLog({
    userId,
    logType: "TASK",
    content: `加入任务【${updated.title}】`,
  });

  return participant;
}

export async function canFinalizeTask(taskId: string): Promise<boolean> {
  const task = await getTaskById(taskId);
  if (!task) return false;

  const submittedCount = getSubmittedParticipants(task).length;
  const mode = getResolutionMode(task);
  const minResolve = getMinResolveCount(task);

  if (mode === "SOLO") return submittedCount >= 1;
  return submittedCount >= minResolve;
}

export async function submitChoice(taskId: string, userId: string, choiceId: string) {
  const task = await getTaskById(taskId);
  if (!task) throw new Error("任务不存在");

  const participant = task.participants.find((p) => p.userId === userId);
  if (!participant) throw new Error("请先加入任务");

  if (participant.choiceId) throw new Error("你已经提交过选择");

  if (["COMPLETED", "FAILED", "EXPIRED"].includes(task.status)) {
    throw new Error("任务已结束");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("用户不存在");

  const voteWeight = calculateVoteWeight(task, user);

  await prisma.taskParticipant.update({
    where: { id: participant.id },
    data: {
      choiceId,
      voteWeight,
      choiceSubmittedAt: new Date(),
      status: "RESOLVED",
    },
  });

  if (task.status === "PENDING") {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "IN_PROGRESS" },
    });
  }

  const shouldFinalize = await canFinalizeTask(taskId);
  const updatedTask = await getTaskById(taskId);

  return { shouldFinalize, task: updatedTask };
}

export async function finalizeTask(taskId: string, currentUserId?: string) {
  const task = await getTaskById(taskId);
  if (!task) throw new Error("任务不存在");

  if (["COMPLETED", "FAILED", "EXPIRED"].includes(task.status)) {
    return {
      finalized: true,
      alreadyResolved: true,
      success: task.status === "COMPLETED",
      finalChoiceId: task.finalChoiceId,
      successRate: task.baseSuccessRate,
      effects: {},
      participants: getSubmittedParticipants(task).length,
    };
  }

  const submittedParticipants = getSubmittedParticipants(task);
  if (submittedParticipants.length === 0) {
    throw new Error("暂无已提交选择的参与者");
  }

  const finalChoiceId = calculateFinalChoice(task, submittedParticipants);
  const project = await prisma.projectState.findUnique({ where: { seasonId: SEASON_ID } });
  const successRate = calculateGroupSuccessRate(
    task,
    submittedParticipants,
    finalChoiceId,
    project,
  );
  const success = rollSuccess(successRate);
  const appliedEffects = resolveFinalEffects(task, finalChoiceId, success);

  await applyMetricEffects(appliedEffects);
  const npcList = task.sourceName ? [task.sourceName] : [];
  await applyNpcEffectsFromMetrics(appliedEffects, npcList);

  const allRewards = await grantParticipantRewards(
    task,
    submittedParticipants,
    success,
    finalChoiceId,
  );

  await prisma.task.update({
    where: { id: task.id },
    data: {
      status: success ? "COMPLETED" : "FAILED",
      finalChoiceId,
      resolvedAt: new Date(),
    },
  });

  const effectSummary = JSON.stringify(appliedEffects);
  await writeGameLog({
    logType: "TASK",
    content: `${success ? "完成" : "失败"}任务【${task.title}】，最终方案：${finalChoiceId}，${submittedParticipants.length} 人参与`,
    effectSummary,
    broadcastLevel: task.rarity,
  });

  if (task.triggerBroadcast || ["SR", "SSR", "UR"].includes(task.rarity)) {
    await broadcastMajorEvent(
      task.title,
      `团队 ${success ? "处理完成" : "处理失败"}，最终方案：${finalChoiceId}`,
      task.rarity,
    );
  }

  const userReward =
    allRewards.find((reward) => reward.userId === currentUserId) || allRewards[0] || null;

  return {
    finalized: true,
    success,
    finalChoiceId,
    successRate,
    effects: appliedEffects,
    rewards: userReward,
    participants: submittedParticipants.length,
  };
}

export async function resolveChoice(taskId: string, userId: string, choiceId: string) {
  const submitResult = await submitChoice(taskId, userId, choiceId);

  if (submitResult.shouldFinalize) {
    return finalizeTask(taskId, userId);
  }

  const task = submitResult.task!;
  const submittedCount = getSubmittedParticipants(task).length;
  const minResolveCount = getMinResolveCount(task);

  return {
    finalized: false,
    message: "已提交选择，等待其他成员参与后统一结算",
    submittedCount,
    requiredCount: minResolveCount,
    task,
  };
}

export async function createTaskFromTemplate(template: TaskTemplateData) {
  const existing = await prisma.task.findFirst({
    where: { seasonId: SEASON_ID, templateId: template.slug, status: { in: ["PENDING", "IN_PROGRESS"] } },
  });
  if (existing) return existing;

  const resolutionMode = template.resolutionMode ?? inferResolutionMode(template.rarity);
  const minResolveCount =
    template.minResolveCount ?? template.requiredCount ?? (resolutionMode === "SOLO" ? 1 : 1);

  const deadline = template.deadlineHours
    ? new Date(Date.now() + template.deadlineHours * 60 * 60 * 1000)
    : null;

  return prisma.task.create({
    data: {
      seasonId: SEASON_ID,
      templateId: template.slug,
      title: template.title,
      description: template.description,
      sourceType: template.sourceType,
      sourceName: template.sourceName,
      rarity: template.rarity,
      area: template.area,
      requiredJobs: JSON.stringify(template.requiredJobs || []),
      requiredCount: template.requiredCount || 1,
      resolutionMode,
      minResolveCount,
      inkFile: template.inkFile,
      successEffects: JSON.stringify(template.successEffects || {}),
      failEffects: JSON.stringify(template.failEffects || {}),
      choiceEffects: JSON.stringify(template.choiceEffects || {}),
      baseSuccessRate: template.baseSuccessRate || 60,
      triggerBroadcast: template.triggerBroadcast || false,
      deadline,
    },
  });
}

export async function spawnTasksFromTemplates(templates: TaskTemplateData[]) {
  await backfillTaskResolutionModes();
  const created = [];
  for (const template of templates) {
    if (template) {
      created.push(await createTaskFromTemplate(template));
    }
  }
  return created;
}

export async function backfillTaskResolutionModes() {
  const tasks = await prisma.task.findMany({
    where: {
      seasonId: SEASON_ID,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
  });

  for (const task of tasks) {
    const expectedMode = inferResolutionMode(task.rarity);
    const expectedMinResolve = task.requiredCount || 1;

    if (task.resolutionMode !== expectedMode || task.minResolveCount !== expectedMinResolve) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          resolutionMode: expectedMode,
          minResolveCount: expectedMinResolve,
        },
      });
    }
  }
}

export async function expireTasks() {
  const now = new Date();
  const expired = await prisma.task.findMany({
    where: {
      seasonId: SEASON_ID,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      deadline: { lt: now },
    },
    include: {
      participants: true,
    },
  });

  for (const task of expired) {
    const submittedCount = task.participants.filter((p) => p.choiceId).length;
    const mode = getResolutionMode(task);

    if (submittedCount > 0 && mode !== "SOLO") {
      try {
        await finalizeTask(task.id);
      } catch (error) {
        console.error("过期任务统一结算失败:", error);
      }
    } else {
      await prisma.task.update({
        where: { id: task.id },
        data: { status: "EXPIRED" },
      });
      await writeGameLog({
        logType: "SYSTEM",
        content: `任务【${task.title}】已过期`,
      });
    }
  }

  return expired.length;
}

export async function getRanking(limit = 20) {
  const participants = await prisma.taskParticipant.groupBy({
    by: ["userId"],
    _sum: { contribution: true },
    orderBy: { _sum: { contribution: "desc" } },
    take: limit,
  });

  const users = await prisma.user.findMany({
    where: { id: { in: participants.map((p) => p.userId) } },
    select: { id: true, nickname: true, job: true, reputation: true },
  });

  return participants.map((p, index) => ({
    rank: index + 1,
    user: users.find((u) => u.id === p.userId),
    contribution: p._sum.contribution || 0,
  }));
}
