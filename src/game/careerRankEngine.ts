import type { ProjectState } from "@prisma/client";
import { CONSTRUCTION_PROJECT_MAINLINE_TASKS } from "@/data/constructionProjectMainlineTasks";
import { parseMilestones } from "./projectEngine";
import { MILESTONE_LABELS } from "./projectStages";
import {
  CAREER_RANKS,
  type CareerRankConfig,
  type CareerRankId,
} from "./careerRankConfig";
import { inferCareerTrackFromJob, type CareerTrackConfig } from "./careerTrackConfig";

const MAINLINE_TEMPLATE_IDS = new Set(
  CONSTRUCTION_PROJECT_MAINLINE_TASKS.filter((t) => t.category === "mainline").map((t) => t.slug),
);

export type CareerUserInput = {
  id: string;
  level: number;
  reputation: number;
  job: string;
};

export type CareerProjectInput = Pick<
  ProjectState,
  "milestones" | "dataIntegrity" | "latentRisk" | "currentStage"
>;

export type CareerTaskParticipantInput = {
  userId: string;
  choiceId: string | null;
};

export type CareerTaskInput = {
  templateId: string;
  status: string;
  participants: CareerTaskParticipantInput[];
};

export type CareerProgressContext = {
  userId: string;
  level: number;
  reputation: number;
  completedMainlineCount: number;
  milestones: Record<string, boolean>;
  dataIntegrity: number;
  latentRisk: number;
  currentStage: string;
};

export type CareerRequirementType =
  | "level"
  | "reputation"
  | "mainline"
  | "milestone"
  | "optional_milestones"
  | "data_integrity"
  | "latent_risk";

export type CareerPromotionRequirement = {
  label: string;
  passed: boolean;
  current: string | number;
  target: string | number;
  type: CareerRequirementType;
};

export type CareerRankView = {
  currentRank: CareerRankConfig;
  nextRank: CareerRankConfig | null;
  requirements: CareerPromotionRequirement[];
  progressPercent: number;
  unlocks: string[];
  bonusDescription: string;
  trackSuggestion: CareerTrackConfig;
};

function countUserCompletedMainline(
  userId: string,
  tasks: CareerTaskInput[],
): number {
  return tasks.filter((task) => {
    if (!MAINLINE_TEMPLATE_IDS.has(task.templateId)) return false;
    if (task.status !== "COMPLETED" && task.status !== "FAILED") return false;
    return task.participants.some(
      (p) => p.userId === userId && p.choiceId,
    );
  }).length;
}

export function getCareerProgressContext(
  user: CareerUserInput,
  project: CareerProjectInput,
  tasks: CareerTaskInput[],
): CareerProgressContext {
  return {
    userId: user.id,
    level: user.level,
    reputation: user.reputation,
    completedMainlineCount: countUserCompletedMainline(user.id, tasks),
    milestones: parseMilestones(project),
    dataIntegrity: project.dataIntegrity,
    latentRisk: project.latentRisk,
    currentStage: project.currentStage,
  };
}

function milestoneLabel(key: string): string {
  return MILESTONE_LABELS[key] ?? key;
}

function optionalGroupsSatisfied(
  groups: string[][],
  milestones: Record<string, boolean>,
): boolean {
  return groups.some((group) => group.every((key) => milestones[key]));
}

export function isCareerRankUnlocked(
  rank: CareerRankConfig,
  context: CareerProgressContext,
): boolean {
  if (context.level < rank.levelRequired) return false;
  if (context.reputation < rank.reputationRequired) return false;
  if (context.completedMainlineCount < rank.completedMainlineRequired) return false;

  if (rank.requiredMilestones?.length) {
    const allDone = rank.requiredMilestones.every((key) => context.milestones[key]);
    if (!allDone) return false;
  }

  if (rank.optionalMilestoneGroups?.length) {
    if (!optionalGroupsSatisfied(rank.optionalMilestoneGroups, context.milestones)) {
      return false;
    }
  }

  if (rank.minDataIntegrity !== undefined && context.dataIntegrity < rank.minDataIntegrity) {
    return false;
  }

  if (rank.maxLatentRisk !== undefined && context.latentRisk > rank.maxLatentRisk) {
    return false;
  }

  return true;
}

export function getCurrentCareerRank(
  user: CareerUserInput,
  project: CareerProjectInput,
  tasks: CareerTaskInput[],
): CareerRankConfig {
  const context = getCareerProgressContext(user, project, tasks);

  let current = CAREER_RANKS[0];
  for (const rank of CAREER_RANKS) {
    if (isCareerRankUnlocked(rank, context)) {
      current = rank;
    }
  }
  return current;
}

export function getNextCareerRank(
  user: CareerUserInput,
  project: CareerProjectInput,
  tasks: CareerTaskInput[],
): CareerRankConfig | null {
  const current = getCurrentCareerRank(user, project, tasks);
  return CAREER_RANKS.find((rank) => rank.order === current.order + 1) ?? null;
}

export function getCareerPromotionRequirements(
  rank: CareerRankConfig,
  context: CareerProgressContext,
): CareerPromotionRequirement[] {
  const requirements: CareerPromotionRequirement[] = [];

  requirements.push({
    type: "level",
    label: "角色等级",
    passed: context.level >= rank.levelRequired,
    current: context.level,
    target: rank.levelRequired,
  });

  requirements.push({
    type: "reputation",
    label: "声望",
    passed: context.reputation >= rank.reputationRequired,
    current: context.reputation,
    target: rank.reputationRequired,
  });

  requirements.push({
    type: "mainline",
    label: "完成主线任务",
    passed: context.completedMainlineCount >= rank.completedMainlineRequired,
    current: context.completedMainlineCount,
    target: rank.completedMainlineRequired,
  });

  for (const key of rank.requiredMilestones ?? []) {
    requirements.push({
      type: "milestone",
      label: `项目里程碑：${milestoneLabel(key)}`,
      passed: Boolean(context.milestones[key]),
      current: context.milestones[key] ? "已完成" : "未完成",
      target: "已完成",
    });
  }

  if (rank.optionalMilestoneGroups?.length) {
    const groupLabels = rank.optionalMilestoneGroups.map((group) =>
      group.map((key) => milestoneLabel(key)).join(" + "),
    );
    const satisfied = optionalGroupsSatisfied(rank.optionalMilestoneGroups, context.milestones);
    requirements.push({
      type: "optional_milestones",
      label: `专项里程碑（满足其一）：${groupLabels.join(" / ")}`,
      passed: satisfied,
      current: satisfied ? "已满足" : "未满足",
      target: "满足任一组",
    });
  }

  if (rank.minDataIntegrity !== undefined) {
    requirements.push({
      type: "data_integrity",
      label: "资料完整度",
      passed: context.dataIntegrity >= rank.minDataIntegrity,
      current: Math.round(context.dataIntegrity),
      target: rank.minDataIntegrity,
    });
  }

  if (rank.maxLatentRisk !== undefined) {
    requirements.push({
      type: "latent_risk",
      label: "潜在风险",
      passed: context.latentRisk <= rank.maxLatentRisk,
      current: Math.round(context.latentRisk),
      target: `≤ ${rank.maxLatentRisk}`,
    });
  }

  return requirements;
}

function calcProgressPercent(requirements: CareerPromotionRequirement[]): number {
  if (requirements.length === 0) return 100;
  const passed = requirements.filter((r) => r.passed).length;
  return Math.round((passed / requirements.length) * 100);
}

export function buildCareerRankView(
  user: CareerUserInput,
  project: CareerProjectInput,
  tasks: CareerTaskInput[],
): CareerRankView {
  const context = getCareerProgressContext(user, project, tasks);
  const currentRank = getCurrentCareerRank(user, project, tasks);
  const nextRank = getNextCareerRank(user, project, tasks);
  const requirements = nextRank
    ? getCareerPromotionRequirements(nextRank, context)
    : [];

  return {
    currentRank,
    nextRank,
    requirements,
    progressPercent: nextRank ? calcProgressPercent(requirements) : 100,
    unlocks: currentRank.unlocks,
    bonusDescription: currentRank.bonusDescription,
    trackSuggestion: inferCareerTrackFromJob(user.job),
  };
}

export function getCareerRankById(id: CareerRankId): CareerRankConfig {
  const rank = CAREER_RANKS.find((r) => r.id === id);
  if (!rank) throw new Error(`Unknown career rank: ${id}`);
  return rank;
}
