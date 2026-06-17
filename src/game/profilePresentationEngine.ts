import { prisma } from "@/prisma/client";
import type { Job } from "@/game/prisma-types";
import type { ProjectState } from "@prisma/client";
import { getChapterInfo } from "@/game/playerGuidanceEngine";
import { getRecentUserGrowthLogs, type GameLogSummary } from "@/game/logEngine";
import { getNextLevelExp } from "@/game/playerProgressEngine";
import { sanitizeTaskLogContent } from "@/game/taskEffectPlayerDisplay";
import { STAGE_TASK_TEMPLATES } from "@/data/stageTaskTemplates";
import { JOB_LABELS } from "@/utils/formatter";
import {
  buildCareerRankView,
  type CareerRankView,
  type CareerTaskInput,
} from "@/game/careerRankEngine";

const MAINLINE_TEMPLATE_IDS = new Set(
  STAGE_TASK_TEMPLATES.filter((t) => t.category === "mainline").map((t) => t.slug),
);

export type ProfileJobAbility = {
  jobLabel: string;
  roleTagline: string;
  identityLine: string;
  abilities: string[];
};

export type ProfileContribution = {
  participatedCount: number;
  submittedCount: number;
  completedCount: number;
  mainlineCount: number;
  totalContribution: number;
  lastRewardSummary: string | null;
};

export type ProfileGrowthLog = {
  id: string;
  content: string;
  createdAt: Date;
};

export type ProfileViewData = {
  nickname: string;
  jobLabel: string;
  level: number;
  exp: number;
  nextLevelExp: number;
  expProgressPercent: number;
  stamina: number;
  spirit: number;
  gold: number;
  reputation: number;
  chapterSubtitle: string;
  stageGoal: string;
  joinedAt: Date;
  jobAbility: ProfileJobAbility;
  contribution: ProfileContribution;
  recentGrowth: ProfileGrowthLog[];
  career: CareerRankView;
};

export type ProfileTaskInput = {
  templateId: string;
  status: string;
  participants: Array<{ userId: string; choiceId: string | null }>;
};

function toCareerTasks(tasks: ProfileTaskInput[]): CareerTaskInput[] {
  return tasks.map((task) => ({
    templateId: task.templateId,
    status: task.status,
    participants: task.participants.map((p) => ({
      userId: p.userId,
      choiceId: p.choiceId,
    })),
  }));
}

const JOB_ABILITY_MAP: Record<
  Job,
  { roleTagline: string; identityLine: string; abilities: string[] }
> = {
  DOCUMENT_ASSISTANT: {
    roleTagline: "资料协调型成员",
    identityLine: "擅长梳理台账、稳定推进基础资料工作。",
    abilities: [
      "提升资料完整度相关任务成功率",
      "更适合处理资料台账、报批清单、归档类任务",
    ],
  },
  CONSTRUCTION_ASSISTANT: {
    roleTagline: "现场推进型成员",
    identityLine: "熟悉工序衔接，能在现场协调中稳住进度节奏。",
    abilities: [
      "提升进度推进类任务成功率",
      "更适合处理总控计划、工序协调、现场核查类任务",
    ],
  },
  SAFETY_ASSISTANT: {
    roleTagline: "风险管控型成员",
    identityLine: "对隐患与合规敏感，能在关键节点守住安全底线。",
    abilities: [
      "降低高风险任务失败带来的连锁影响",
      "更适合处理风险登记、安全检查、应急演练类任务",
    ],
  },
  MECHANICAL_ASSISTANT: {
    roleTagline: "机电协调型成员",
    identityLine: "熟悉机电接口与设备条件，能串联多专业协同。",
    abilities: [
      "提升机电接口类任务成功率",
      "更适合处理设备选型、管线协调、调试准备类任务",
    ],
  },
  COST_ASSISTANT: {
    roleTagline: "成本管控型成员",
    identityLine: "对造价与合同边界敏感，善于在预算内推进决策。",
    abilities: [
      "提升造价与采购相关任务成功率",
      "更适合处理控制价、清单核对、合同边界类任务",
    ],
  },
  MATERIAL_ASSISTANT: {
    roleTagline: "物资保障型成员",
    identityLine: "熟悉材料计划与进场节奏，保障现场不断档。",
    abilities: [
      "提升材料供应类任务成功率",
      "更适合处理材料计划、进场验收、库存台账类任务",
    ],
  },
  QUALITY_ASSISTANT: {
    roleTagline: "质量把关型成员",
    identityLine: "注重标准与闭环，能在细节处守住交付品质。",
    abilities: [
      "提升质量验收类任务成功率",
      "更适合处理检验记录、问题闭合、验收准备类任务",
    ],
  },
};

function resolveJobAbility(job: string, nickname: string): ProfileJobAbility {
  const key = job as Job;
  const jobLabel = JOB_LABELS[key] ?? "项目成员";
  const preset = JOB_ABILITY_MAP[key];

  if (preset) {
    return {
      jobLabel,
      roleTagline: preset.roleTagline,
      identityLine: `你是天穹综合体项目组的一名${preset.roleTagline}，${preset.identityLine}`,
      abilities: preset.abilities,
    };
  }

  return {
    jobLabel,
    roleTagline: "综合协作型成员",
    identityLine: `你是天穹综合体项目组的一员，${nickname}，正在项目中积累经验与贡献。`,
    abilities: ["参与各类项目任务", "与团队协作推进章节目标"],
  };
}

function sanitizeGrowthLogContent(content: string): string {
  return sanitizeTaskLogContent(content)
    .replace(/\b[A-Z][A-Z0-9_]{2,}\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractLastRewardSummary(logs: GameLogSummary[]): string | null {
  const rewardLog = logs.find(
    (log) =>
      log.content.includes("获得经验") ||
      log.content.includes("获得") ||
      log.content.includes("完成「"),
  );
  if (!rewardLog) return null;
  return sanitizeGrowthLogContent(rewardLog.content);
}

async function loadContributionStats(userId: string): Promise<Omit<ProfileContribution, "lastRewardSummary">> {
  const participants = await prisma.taskParticipant.findMany({
    where: { userId },
    select: {
      contribution: true,
      choiceId: true,
      task: {
        select: {
          status: true,
          templateId: true,
        },
      },
    },
  });

  const participatedCount = participants.length;
  const submittedCount = participants.filter((p) => p.choiceId).length;
  const completedCount = participants.filter(
    (p) =>
      p.choiceId &&
      (p.task.status === "COMPLETED" || p.task.status === "FAILED"),
  ).length;
  const mainlineCount = participants.filter(
    (p) =>
      p.choiceId &&
      MAINLINE_TEMPLATE_IDS.has(p.task.templateId) &&
      (p.task.status === "COMPLETED" || p.task.status === "FAILED"),
  ).length;
  const totalContribution = participants.reduce((sum, p) => sum + p.contribution, 0);

  return {
    participatedCount,
    submittedCount,
    completedCount,
    mainlineCount,
    totalContribution,
  };
}

export async function buildProfileViewData(
  user: {
    id: string;
    nickname: string;
    job: string;
    level: number;
    exp: number;
    stamina: number;
    spirit: number;
    gold: number;
    reputation: number;
    createdAt: Date;
  },
  project: ProjectState,
  tasks: ProfileTaskInput[] = [],
): Promise<ProfileViewData> {
  const chapterInfo = getChapterInfo(project);
  const nextLevelExp = getNextLevelExp(user.level);
  const expProgressPercent =
    nextLevelExp > 0 ? Math.min(100, Math.round((user.exp / nextLevelExp) * 100)) : 0;

  const careerTasks = toCareerTasks(tasks);
  const career = buildCareerRankView(
    {
      id: user.id,
      level: user.level,
      reputation: user.reputation,
      job: user.job,
    },
    project,
    careerTasks,
  );

  const [contributionBase, growthLogs] = await Promise.all([
    loadContributionStats(user.id),
    getRecentUserGrowthLogs(user.id, 5),
  ]);

  const jobAbility = resolveJobAbility(user.job, user.nickname);

  return {
    nickname: user.nickname,
    jobLabel: jobAbility.jobLabel,
    level: user.level,
    exp: user.exp,
    nextLevelExp,
    expProgressPercent,
    stamina: user.stamina,
    spirit: user.spirit,
    gold: user.gold,
    reputation: user.reputation,
    chapterSubtitle: chapterInfo.chapterSubtitle,
    stageGoal: chapterInfo.stageGoal,
    joinedAt: user.createdAt,
    jobAbility,
    contribution: {
      ...contributionBase,
      lastRewardSummary: extractLastRewardSummary(growthLogs),
    },
    recentGrowth: growthLogs.map((log) => ({
      id: log.id,
      content: sanitizeGrowthLogContent(log.content),
      createdAt: log.createdAt,
    })),
    career,
  };
}
