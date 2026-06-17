import type { ProjectStageId } from "./projectStages";

export type CareerRankId =
  | "project_rookie"
  | "project_assistant"
  | "site_coordinator"
  | "specialist_lead"
  | "project_supervisor"
  | "deputy_project_manager"
  | "project_manager"
  | "project_controller"
  | "city_project_operator";

export type CareerRankConfig = {
  id: CareerRankId;
  title: string;
  shortTitle: string;
  order: number;
  description: string;
  levelRequired: number;
  reputationRequired: number;
  completedMainlineRequired: number;
  requiredMilestones?: string[];
  optionalMilestoneGroups?: string[][];
  minDataIntegrity?: number;
  maxLatentRisk?: number;
  unlocks: string[];
  bonusDescription: string;
  visibleFromChapter?: ProjectStageId | "INITIATION";
};

export const CAREER_RANKS: CareerRankConfig[] = [
  {
    id: "project_rookie",
    title: "项目新人",
    shortTitle: "新人",
    order: 1,
    description: "刚进入项目组，主要参与基础协助任务。",
    levelRequired: 1,
    reputationRequired: 0,
    completedMainlineRequired: 0,
    unlocks: ["查看指挥中心", "参与基础任务", "执行低消耗地点行动"],
    bonusDescription: "熟悉项目基础流程，从协助任务开始积累声望。",
    visibleFromChapter: "INITIATION",
  },
  {
    id: "project_assistant",
    title: "项目助理",
    shortTitle: "助理",
    order: 2,
    description: "能独立完成明确边界的小任务，如会议纪要、资料清单和基础台账。",
    levelRequired: 2,
    reputationRequired: 5,
    completedMainlineRequired: 1,
    unlocks: ["资料台账类任务提示", "简单协调任务", "第一章基础行动推荐增强"],
    bonusDescription: "小任务独立完成度提升，资料类行动更易被推荐。",
    visibleFromChapter: "INITIATION",
  },
  {
    id: "site_coordinator",
    title: "现场协调员",
    shortTitle: "协调员",
    order: 3,
    description: "能在现场和办公室之间跑动，处理一般协调问题。",
    levelRequired: 3,
    reputationRequired: 15,
    completedMainlineRequired: 2,
    requiredMilestones: ["projectOrgDone"],
    unlocks: ["一般突发事件", "现场协调任务提示", "协调类任务成功率提示"],
    bonusDescription: "协调类任务与现场行动在推荐列表中权重提高。",
    visibleFromChapter: "INITIATION",
  },
  {
    id: "specialist_lead",
    title: "专项负责人",
    shortTitle: "专项",
    order: 4,
    description: "能独立牵头资料、风险、进度等专项工作。",
    levelRequired: 4,
    reputationRequired: 25,
    completedMainlineRequired: 3,
    optionalMilestoneGroups: [["riskRegisterDone"], ["documentLedgerDone"]],
    unlocks: ["专项任务链", "风险/资料类任务提示", "更复杂的选择项"],
    bonusDescription: "专项任务链解锁，风险与资料类提示更精准。",
    visibleFromChapter: "INITIATION",
  },
  {
    id: "project_supervisor",
    title: "项目主管",
    shortTitle: "主管",
    order: 5,
    description: "能同时压住几条线，开始承担项目推进责任。",
    levelRequired: 5,
    reputationRequired: 35,
    completedMainlineRequired: 4,
    requiredMilestones: ["masterPlanDone", "riskRegisterDone"],
    unlocks: ["多目标任务", "跨 NPC 事件", "阶段门前置任务"],
    bonusDescription: "可同时关注多条任务线，阶段推进建议更完整。",
    visibleFromChapter: "INITIATION",
  },
  {
    id: "deputy_project_manager",
    title: "项目副经理",
    shortTitle: "副经理",
    order: 6,
    description: "能代项目经理处理复杂冲突和推进事项。",
    levelRequired: 6,
    reputationRequired: 45,
    completedMainlineRequired: 5,
    requiredMilestones: [
      "projectOrgDone",
      "masterPlanDone",
      "riskRegisterDone",
      "documentLedgerDone",
    ],
    unlocks: ["高级突发事件", "资源调配选项", "阶段推进建议权"],
    bonusDescription: "高级事件与资源调配选项可见，推进建议权重提升。",
    visibleFromChapter: "APPROVAL",
  },
  {
    id: "project_manager",
    title: "项目经理",
    shortTitle: "经理",
    order: 7,
    description: "对项目目标负责，能做关键取舍和阶段推进决策。",
    levelRequired: 8,
    reputationRequired: 60,
    completedMainlineRequired: 8,
    unlocks: ["阶段门决策", "高级项目指标统筹", "项目经理专属任务"],
    bonusDescription: "阶段门决策参与权，项目指标统筹视图增强。",
    visibleFromChapter: "APPROVAL",
  },
  {
    id: "project_controller",
    title: "项目总控负责人",
    shortTitle: "总控",
    order: 8,
    description: "从单个任务处理转向全过程控制。",
    levelRequired: 10,
    reputationRequired: 80,
    completedMainlineRequired: 12,
    unlocks: ["多阶段总控", "总控计划重排", "风险与资源联动"],
    bonusDescription: "跨阶段总控视图，计划重排与风险联动提示。",
    visibleFromChapter: "DESIGN",
  },
  {
    id: "city_project_operator",
    title: "城市项目操盘手",
    shortTitle: "操盘手",
    order: 9,
    description: "具备城市级项目资源协调能力。",
    levelRequired: 12,
    reputationRequired: 120,
    completedMainlineRequired: 18,
    unlocks: ["跨项目资源", "城市级协同事件", "战略任务"],
    bonusDescription: "城市级协同事件与战略任务链可见。",
    visibleFromChapter: "CONSTRUCTION",
  },
];

export const CAREER_RANK_BY_ID = Object.fromEntries(
  CAREER_RANKS.map((rank) => [rank.id, rank]),
) as Record<CareerRankId, CareerRankConfig>;

export function getCareerRankByOrder(order: number): CareerRankConfig | undefined {
  return CAREER_RANKS.find((rank) => rank.order === order);
}
