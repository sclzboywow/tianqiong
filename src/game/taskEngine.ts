import { prisma } from "@/prisma/client";
import type { Job } from "@/game/prisma-types";
import { applyMetricEffects } from "./projectEngine";
import { writeGameLog } from "./logEngine";
import { calculateRewards, getJobMatchBonus, applySpiritCost } from "./rewardEngine";
import { applyNpcEffectsFromMetrics } from "./npcEngine";
import { broadcastMajorEvent } from "./broadcastEngine";
import { checkAchievements } from "./achievementEngine";
import { rollSuccess } from "@/utils/random";
import type { ChoiceEffectsMap, MetricEffects, TaskTemplateData } from "./types";

const SEASON_ID = process.env.SEASON_ID || "season-1";

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
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
        include: { user: { select: { id: true, nickname: true, job: true } } },
      },
    },
  });
}

export async function getTaskById(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      participants: {
        include: { user: { select: { id: true, nickname: true, job: true } } },
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

function calculateSuccessRate(params: {
  baseSuccessRate: number;
  job: Job;
  requiredJobs: string[];
  participantCount: number;
  requiredCount: number;
  level: number;
  spirit: number;
  fireRisk: number;
  safety: number;
}) {
  let rate = params.baseSuccessRate;
  rate += getJobMatchBonus(params.job, params.requiredJobs);
  if (params.participantCount >= params.requiredCount) rate += 10;
  rate += params.level * 0.5;
  if (params.spirit < 30) rate -= 10;
  if (params.fireRisk > 70) rate -= 8;
  if (params.safety < 40) rate -= 5;
  return Math.max(5, Math.min(95, rate));
}

export async function resolveChoice(taskId: string, userId: string, choiceId: string) {
  const task = await getTaskById(taskId);
  if (!task) throw new Error("TASK_NOT_FOUND");
  if (task.status === "COMPLETED" || task.status === "FAILED" || task.status === "EXPIRED") {
    throw new Error("TASK_ALREADY_RESOLVED");
  }

  const participant = task.participants.find((p) => p.userId === userId);
  if (!participant) throw new Error("NOT_PARTICIPANT");

  const resolvedParticipant = task.participants.find((p) => p.status === "RESOLVED");
  if (resolvedParticipant && resolvedParticipant.userId !== userId) {
    throw new Error("TASK_ALREADY_RESOLVED_BY_OTHER");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("USER_NOT_FOUND");

  const project = await prisma.projectState.findUnique({ where: { seasonId: SEASON_ID } });
  const requiredJobs = parseJson<string[]>(task.requiredJobs, []);
  const choiceEffects = parseJson<ChoiceEffectsMap>(task.choiceEffects, {});
  const successEffects = parseJson<MetricEffects>(task.successEffects, {});
  const failEffects = parseJson<MetricEffects>(task.failEffects, {});

  const effects = choiceEffects[choiceId] || {};
  const successRate = calculateSuccessRate({
    baseSuccessRate: task.baseSuccessRate,
    job: user.job as Job,
    requiredJobs,
    participantCount: task.currentCount,
    requiredCount: task.requiredCount,
    level: user.level,
    spirit: user.spirit,
    fireRisk: project?.fireRisk || 50,
    safety: project?.safety || 50,
  });

  const success = rollSuccess(successRate);
  const appliedEffects: MetricEffects = success
    ? { ...effects, ...successEffects }
    : { ...effects, ...failEffects };

  await applyMetricEffects(appliedEffects);
  const npcList = task.sourceName ? [task.sourceName] : [];
  await applyNpcEffectsFromMetrics(appliedEffects, npcList);

  const rewards = calculateRewards({
    rarity: task.rarity,
    success,
    contribution: success ? 10 : 3,
  });

  await prisma.user.update({
    where: { id: userId },
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
      status: success ? "RESOLVED" : "FAILED",
      contribution: rewards.contribution,
      choiceId,
    },
  });

  await prisma.task.update({
    where: { id: taskId },
    data: { status: success ? "COMPLETED" : "FAILED" },
  });

  const effectSummary = JSON.stringify(appliedEffects);
  await writeGameLog({
    userId,
    logType: "TASK",
    content: `${success ? "完成" : "失败"}任务【${task.title}】，选择：${choiceId}`,
    effectSummary,
    broadcastLevel: task.rarity,
  });

  if (task.triggerBroadcast || ["SR", "SSR", "UR"].includes(task.rarity)) {
    await broadcastMajorEvent(
      task.title,
      `${user.nickname} ${success ? "处理完成" : "处理失败"}`,
      task.rarity,
    );
  }

  await checkAchievements(userId, {
    choiceId,
    taskRarity: task.rarity,
    success,
  });

  return {
    success,
    effects: appliedEffects,
    rewards,
    successRate,
  };
}

export async function createTaskFromTemplate(template: TaskTemplateData) {
  const existing = await prisma.task.findFirst({
    where: { seasonId: SEASON_ID, templateId: template.slug, status: { in: ["PENDING", "IN_PROGRESS"] } },
  });
  if (existing) return existing;

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
  const created = [];
  for (const template of templates) {
    if (template) {
      created.push(await createTaskFromTemplate(template));
    }
  }
  return created;
}

export async function expireTasks() {
  const now = new Date();
  const expired = await prisma.task.findMany({
    where: {
      seasonId: SEASON_ID,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      deadline: { lt: now },
    },
  });

  for (const task of expired) {
    await prisma.task.update({
      where: { id: task.id },
      data: { status: "EXPIRED" },
    });
    await writeGameLog({
      logType: "SYSTEM",
      content: `任务【${task.title}】已过期`,
    });
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
