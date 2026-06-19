import type { TaskTemplateData } from "@/game/types";
import type { ProjectStageId } from "@/game/projectStages";
import type { LocationAction } from "@/data/locationActions";
import type { EventTemplateData } from "@/game/types";
import type { StoryEntryData } from "@/game/types";
import type { ChoiceEffectsMap } from "@/game/types";

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

const CHAPTER1_FAIL_EFFECTS = { latentRisk: 5, ownerTrust: -2, stageProgress: -5 };

const CHAPTER1_CHOICE_EFFECTS: Record<Chapter1TaskSlug, ChoiceEffectsMap> = {
  setup_project_team: {
    steady_push: { ownerTrust: 3, dataIntegrity: 2, latentRisk: -2 },
    fast_push: { stageProgress: 4, ownerTrust: 1, latentRisk: 3 },
    delay_coord: { latentRisk: 4, ownerTrust: -2 },
  },
  prepare_master_plan: {
    steady_push: { dataIntegrity: 2, latentRisk: -3, stageProgress: 1 },
    fast_push: { stageProgress: 5, progress: 2, latentRisk: 4 },
    delay_coord: { latentRisk: 3, stageProgress: -2 },
  },
  create_risk_register: {
    steady_push: { dataIntegrity: 3, latentRisk: -4, ownerTrust: 1 },
    fast_push: { stageProgress: 3, latentRisk: -2, dataIntegrity: 1 },
    delay_coord: { latentRisk: 5, ownerTrust: -1 },
  },
  create_document_ledger: {
    steady_push: { dataIntegrity: 4, ownerTrust: 2, latentRisk: -2 },
    fast_push: { stageProgress: 3, dataIntegrity: 2, latentRisk: 2 },
    delay_coord: { latentRisk: 3, dataIntegrity: -2 },
  },
  coordinate_first_meeting: {
    steady_push: { ownerTrust: 3, latentRisk: -3, dataIntegrity: 1 },
    fast_push: { stageProgress: 4, ownerTrust: 1, latentRisk: 2 },
    delay_coord: { latentRisk: 4, stageProgress: -3, ownerTrust: -1 },
  },
};

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
    area: "项目管理部",
    category: "mainline",
    requiredJobs: ["DOCUMENT_ASSISTANT", "CONSTRUCTION_ASSISTANT"],
    inkFile: slug,
    storySlug: `story_${slug}`,
    baseSuccessRate: 65,
    choiceEffects: CHAPTER1_CHOICE_EFFECTS[slug],
    successEffects,
    failEffects: CHAPTER1_FAIL_EFFECTS,
    milestoneEffects: { [milestone]: true },
    ...extra,
  };
}

export const CHAPTER1_TASK_TEMPLATES: TaskTemplateData[] = [
  chapter1Task("setup_project_team", "启动会余波：划定谁管什么", "projectOrgDone", {
    stageProgress: 20,
    ownerTrust: 3,
    latentRisk: -2,
  }, {
    description:
      "甲方把组织架构草稿推到你面前，三处职责重叠还没谈拢。今天不定下来，后面的协调会排不进日程。",
    area: "项目管理部",
    outputArtifacts: [{ artifactSlug: "project_org_chart", status: "confirmed" }],
  }),
  chapter1Task("prepare_master_plan", "抢时间：总控计划定稿", "masterPlanDone", {
    stageProgress: 25,
    progress: 3,
    latentRisk: -3,
  }, {
    description:
      "造价、设计、施工的节点互相打架。有人想跳过计划先动土，甲方却在等一版能马上用的总控计划。",
    area: "项目管理部",
    inputArtifacts: [{ artifactSlug: "project_org_chart", minStatus: "confirmed" }],
    prerequisiteTaskSlugs: ["setup_project_team"],
    outputArtifacts: [{ artifactSlug: "master_plan_doc", status: "confirmed" }],
  }),
  chapter1Task("create_risk_register", "隐患不能只挂在嘴上", "riskRegisterDone", {
    stageProgress: 20,
    dataIntegrity: 3,
    latentRisk: -5,
  }, {
    description:
      "消防、资料、进度几条线在同时冒头。监理要分级，总包要先清单——本周必须拿出一份能翻得动的风险台账。",
    area: "项目管理部",
    inputArtifacts: [{ artifactSlug: "master_plan_doc", minStatus: "confirmed" }],
    prerequisiteTaskSlugs: ["prepare_master_plan"],
    outputArtifacts: [{ artifactSlug: "risk_register", status: "confirmed" }],
  }),
  chapter1Task("create_document_ledger", "资料室快被纸淹了", "documentLedgerDone", {
    stageProgress: 20,
    dataIntegrity: 6,
    ownerTrust: 2,
  }, {
    description:
      "各家单位的竣工资料各放各的，监理催着要统一目录。档案室位置有限，再拖就要影响报批。",
    area: "档案资料室",
    outputArtifacts: [{ artifactSlug: "document_ledger", status: "confirmed" }],
  }),
  chapter1Task("coordinate_first_meeting", "第一次协调会：别白开一场", "firstCoordinationMeetingDone", {
    stageProgress: 15,
    ownerTrust: 3,
    latentRisk: -2,
  }, {
    description:
      "下午三点各方已落座。职责界面和变更联络还没谈拢——散会时得带走能执行的结论，不是又一堆「再研究研究」。",
    area: "项目管理部",
    inputArtifacts: [{ artifactSlug: "project_org_chart", minStatus: "confirmed" }],
    prerequisiteTaskSlugs: ["setup_project_team"],
    outputArtifacts: [{ artifactSlug: "first_meeting_minutes", status: "confirmed" }],
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
    description: "把甲方和参建代表拉到一张桌上，启动组织架构和首次协调会两条线。",
    unlockStage: CHAPTER1_STAGE,
    triggerTaskSlugs: ["setup_project_team", "coordinate_first_meeting"],
    relatedNpcNames: ["甲方代表"],
    riskTags: ["coordination", "progress"],
    spiritCost: 10,
    minLevel: 1,
    resultText: "启动会散场，相关主线任务已进入任务台，请尽快处理。",
    noTaskText: "相关主线已在任务台或已完成，未重复生成。",
    sortOrder: 0,
  },
  {
    id: "action_chapter1_master_plan",
    locationId: "owner_project_management_dept",
    label: "梳理总控计划",
    description: "和项目管理部一起对节点、对责任，把总控计划从争论变成能用的版本。",
    unlockStage: CHAPTER1_STAGE,
    triggerTaskSlugs: ["prepare_master_plan"],
    relatedNpcNames: ["甲方代表"],
    riskTags: ["progress", "coordination"],
    spiritCost: 8,
    minLevel: 1,
    resultText: "总控计划相关任务已生成，请前往任务台处理。",
    noTaskText: "总控计划任务已在任务台或已完成，未重复生成。",
    sortOrder: 1,
  },
  {
    id: "action_risk_register",
    locationId: "owner_project_management_dept",
    label: "建立风险清单",
    description: "把各部门口头提到的隐患收拢成册，别让风险只留在聊天记录里。",
    unlockStage: CHAPTER1_STAGE,
    triggerTaskSlugs: ["create_risk_register"],
    relatedNpcNames: ["甲方代表"],
    riskTags: ["coordination"],
    spiritCost: 6,
    minLevel: 1,
    resultText: "风险台账任务已生成，请前往任务台处理。",
    noTaskText: "风险台账任务已在任务台或已完成，未重复生成。",
    sortOrder: 2,
  },
  {
    id: "action_document_ledger",
    locationId: "owner_archive_room",
    label: "建立资料台账",
    description: "进档案资料室清点各家交来的资料，把散落的文件夹变成可追踪的台账。",
    unlockStage: CHAPTER1_STAGE,
    triggerTaskSlugs: ["create_document_ledger"],
    relatedNpcNames: ["监理单位"],
    riskTags: ["document"],
    spiritCost: 6,
    minLevel: 1,
    resultText: "资料台账任务已生成，请前往任务台处理。",
    noTaskText: "资料台账任务已在任务台或已完成，未重复生成。",
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
    area: "项目管理部",
    triggerStage: CHAPTER1_STAGE,
    triggerLocationSlugs: ["owner_project_management_dept"],
    triggerTaskSlugs: ["coordinate_first_meeting"],
    riskTags: ["coordination"],
    weight: 10,
    cooldownDays: 2,
    onceOnly: false,
    enabled: true,
    inkFile: "coordinate_first_meeting",
    artifactEffects: [{ artifactSlug: "project_org_chart", status: "in_review" }],
  },
  {
    slug: "evt_master_plan_disagreement",
    title: "总控计划口径不统一",
    description: "各部门提交的总控计划节点口径不一致，需要项目部协调统一。",
    rarity: "R",
    area: "项目管理部",
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
    area: "资料室",
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
