import type { TaskTemplateData } from "@/game/types";
import type { ProjectStageId } from "@/game/projectStages";
import type { LocationAction } from "@/data/locationActions";
import type { EventTemplateData } from "@/game/types";
import type { StoryEntryData } from "@/game/types";

export const CHAPTER1_ID = "chapter1_initiation";
export const CHAPTER1_NAME = "第一章：总控计划与风险清单";
export const CHAPTER1_STAGE: ProjectStageId = "INITIATION";

export const CHAPTER1_TASK_SLUGS = [
  "setup_project_team",
  "prepare_master_plan",
  "create_risk_register",
  "create_document_ledger",
  "coordinate_first_meeting",
] as const;

export type Chapter1TaskSlug = (typeof CHAPTER1_TASK_SLUGS)[number];

export const CHAPTER1_STAGE_GATE_MILESTONES = [
  "projectOrgDone",
  "masterPlanDone",
  "riskRegisterDone",
  "documentLedgerDone",
] as const;

const CHAPTER1_CHOICE_EFFECTS = {
  steady_push: { ownerTrust: 2, dataIntegrity: 1, latentRisk: -2 },
  fast_push: { progress: 3, stageProgress: 5, latentRisk: 4 },
  delay_coord: { stageProgress: -2, latentRisk: 2 },
};

const CHAPTER1_FAIL_EFFECTS = { latentRisk: 5, ownerTrust: -2, stageProgress: -5 };

function chapter1Task(
  slug: Chapter1TaskSlug,
  title: string,
  milestone: string,
  successEffects: TaskTemplateData["successEffects"],
  extra?: Partial<TaskTemplateData>,
): TaskTemplateData {
  return {
    slug,
    title,
    description: extra?.description,
    stage: CHAPTER1_STAGE,
    rarity: "R",
    sourceType: "system",
    area: "项目总控",
    category: "mainline",
    requiredJobs: ["DOCUMENT_ASSISTANT", "CONSTRUCTION_ASSISTANT"],
    inkFile: slug,
    storySlug: `story_${slug}`,
    baseSuccessRate: 65,
    choiceEffects: CHAPTER1_CHOICE_EFFECTS,
    successEffects,
    failEffects: CHAPTER1_FAIL_EFFECTS,
    milestoneEffects: { [milestone]: true },
    ...extra,
  };
}

export const CHAPTER1_TASK_TEMPLATES: TaskTemplateData[] = [
  chapter1Task("setup_project_team", "建立项目组织架构", "projectOrgDone", {
    stageProgress: 20,
    ownerTrust: 3,
    latentRisk: -2,
  }, {
    description: "明确项目推进小组与岗位职责，形成正式组织架构。",
  }),
  chapter1Task("prepare_master_plan", "编制项目总控计划", "masterPlanDone", {
    stageProgress: 25,
    progress: 3,
    latentRisk: -3,
  }, {
    description: "编制带关键节点的项目总控计划，作为后续报批与招采基准。",
  }),
  chapter1Task("create_risk_register", "建立风险登记台账", "riskRegisterDone", {
    stageProgress: 20,
    dataIntegrity: 3,
    latentRisk: -5,
  }, {
    description: "汇总各部门风险点，建立分级风险登记台账。",
  }),
  chapter1Task("create_document_ledger", "建立资料台账", "documentLedgerDone", {
    stageProgress: 20,
    dataIntegrity: 6,
    ownerTrust: 2,
  }, {
    description: "在档案资料室建立统一资料台账与归档责任清单。",
    area: "项目资料室",
  }),
  chapter1Task("coordinate_first_meeting", "召开第一次项目协调会", "firstCoordinationMeetingDone", {
    stageProgress: 15,
    ownerTrust: 3,
    latentRisk: -2,
  }, {
    description: "召集参建各方召开首次项目协调会，明确接口与推进节奏。",
  }),
];

export const CHAPTER1_STORY_SLUGS = CHAPTER1_TASK_SLUGS.map((slug) => `story_${slug}`);

export const CHAPTER1_STORY_ENTRIES: Omit<StoryEntryData, "payloadDocId">[] =
  CHAPTER1_TASK_TEMPLATES.map((task) => ({
    slug: task.storySlug!,
    title: task.title,
    description: task.description,
    storyType: "task_story" as const,
    status: "published" as const,
    inkFile: task.inkFile,
    compiledFile: `${task.inkFile}.json`,
    stage: CHAPTER1_STAGE,
    relatedTaskSlugs: [task.slug],
    enabled: true,
    sortOrder: CHAPTER1_TASK_SLUGS.indexOf(task.slug as Chapter1TaskSlug),
  }));

export const CHAPTER1_LOCATION_ACTIONS: LocationAction[] = [
  {
    id: "action_chapter1_kickoff",
    locationId: "owner_project_management_dept",
    label: "召开项目启动会",
    description: "召集甲方与参建代表，启动项目组织架构编制与首次协调会。",
    unlockStage: CHAPTER1_STAGE,
    triggerTaskSlugs: ["setup_project_team", "coordinate_first_meeting"],
    relatedNpcNames: ["甲方代表"],
    riskTags: ["coordination", "progress"],
    spiritCost: 10,
    minLevel: 1,
    resultText: "项目启动会已召开，相关主线任务已生成。",
    noTaskText: "相关主线任务已在进行中或已完成，未重复生成。",
    sortOrder: 0,
  },
  {
    id: "action_chapter1_master_plan",
    locationId: "owner_project_management_dept",
    label: "梳理总控计划",
    description: "与项目管理部对接，编制项目总控计划与关键节点。",
    unlockStage: CHAPTER1_STAGE,
    triggerTaskSlugs: ["prepare_master_plan"],
    relatedNpcNames: ["甲方代表"],
    riskTags: ["progress", "coordination"],
    spiritCost: 8,
    minLevel: 1,
    resultText: "总控计划编制任务已生成。",
    noTaskText: "总控计划任务已存在，未重复生成。",
    sortOrder: 1,
  },
  {
    id: "action_risk_register",
    locationId: "owner_project_management_dept",
    label: "建立风险清单",
    description: "梳理项目潜在风险，建立风险登记台账。",
    unlockStage: CHAPTER1_STAGE,
    triggerTaskSlugs: ["create_risk_register"],
    relatedNpcNames: ["甲方代表"],
    riskTags: ["coordination"],
    spiritCost: 6,
    minLevel: 1,
    resultText: "风险清单任务已生成。",
    noTaskText: "风险清单任务已存在，未重复生成。",
    sortOrder: 2,
  },
  {
    id: "action_document_ledger",
    locationId: "owner_archive_room",
    label: "建立资料台账",
    description: "在档案资料室建立项目资料台账与归档规范。",
    unlockStage: CHAPTER1_STAGE,
    triggerTaskSlugs: ["create_document_ledger"],
    relatedNpcNames: ["监理单位"],
    riskTags: ["document"],
    spiritCost: 6,
    minLevel: 1,
    resultText: "资料台账任务已生成。",
    noTaskText: "资料台账任务已存在，未重复生成。",
    sortOrder: 0,
  },
];

export const CHAPTER1_EVENT_SLUGS = [
  "evt_role_boundary_unclear",
  "evt_master_plan_disagreement",
  "evt_document_list_missing",
] as const;

export const CHAPTER1_EVENTS: Partial<EventTemplateData>[] = [
  {
    slug: "evt_role_boundary_unclear",
    title: "参建单位职责边界不清",
    description: "首次协调会后，总包与监理对部分事项职责界面仍有分歧。",
    rarity: "R",
    area: "项目总控",
    triggerStage: CHAPTER1_STAGE,
    triggerLocationSlugs: ["owner_project_management_dept"],
    triggerTaskSlugs: ["coordinate_first_meeting"],
    riskTags: ["coordination"],
    weight: 10,
    cooldownDays: 2,
    onceOnly: false,
    enabled: true,
    inkFile: "coordinate_first_meeting",
  },
  {
    slug: "evt_master_plan_disagreement",
    title: "总控计划口径不统一",
    description: "各部门提交的总控计划节点口径不一致，需要项目部协调统一。",
    rarity: "R",
    area: "项目总控",
    triggerStage: CHAPTER1_STAGE,
    triggerLocationSlugs: ["owner_project_management_dept"],
    triggerTaskSlugs: ["prepare_master_plan"],
    riskTags: ["progress"],
    weight: 10,
    cooldownDays: 2,
    onceOnly: false,
    enabled: true,
    inkFile: "prepare_master_plan",
  },
  {
    slug: "evt_document_list_missing",
    title: "资料清单缺项",
    description: "资料台账建立过程中发现关键资料目录缺项，影响后续归档。",
    rarity: "R",
    area: "项目资料室",
    triggerStage: CHAPTER1_STAGE,
    triggerLocationSlugs: ["owner_archive_room"],
    triggerTaskSlugs: ["create_document_ledger"],
    riskTags: ["document"],
    weight: 10,
    cooldownDays: 2,
    onceOnly: false,
    enabled: true,
    inkFile: "create_document_ledger",
  },
];

export function isChapter1TaskSlug(slug: string): slug is Chapter1TaskSlug {
  return CHAPTER1_TASK_SLUGS.includes(slug as Chapter1TaskSlug);
}
