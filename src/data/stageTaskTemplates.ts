import type { TaskTemplateData } from "@/game/types";
import type { ProjectStageId } from "@/game/projectStages";
import { CHAPTER1_TASK_TEMPLATES } from "@/data/chapter1Content";

const genericChoiceEffects = {
  immediate_fix: {},
  schedule_fix: {},
  ignore_sign: { latentRisk: 2 },
};

function stageTask(
  slug: string,
  title: string,
  stage: ProjectStageId,
  milestone: string,
  extra?: Partial<TaskTemplateData>,
): TaskTemplateData {
  return {
    slug,
    title,
    stage,
    rarity: "R",
    sourceType: "system",
    area: "项目管理部",
    requiredJobs: ["DOCUMENT_ASSISTANT", "CONSTRUCTION_ASSISTANT"],
    inkFile: slug,
    choiceEffects: genericChoiceEffects,
    successEffects: { stageProgress: 25, dataIntegrity: 2 },
    failEffects: { latentRisk: 5, ownerTrust: -2, stageProgress: -5 },
    milestoneEffects: { [milestone]: true },
    category: "mainline",
    ...extra,
  };
}

export const STAGE_TASK_TEMPLATES: TaskTemplateData[] = [
  ...CHAPTER1_TASK_TEMPLATES,

  stageTask("confirm_approval_path", "明确报批路径", "APPROVAL", "approvalPathConfirmed", {
    successEffects: { stageProgress: 25, ownerTrust: 2, dataIntegrity: 3 },
  }),
  stageTask("confirm_planning_condition", "确认规划条件", "APPROVAL", "planningConditionDone", {
    successEffects: { stageProgress: 25, dataIntegrity: 4 },
  }),
  stageTask("prepare_approval_docs", "准备报批资料", "APPROVAL", "approvalDocsReady", {
    successEffects: { stageProgress: 25, dataIntegrity: 6 },
  }),
  stageTask("plan_construction_permit", "制定施工许可计划", "APPROVAL", "permitPlanDone", {
    successEffects: { stageProgress: 25, ownerTrust: 2 },
  }),

  stageTask("complete_scheme_design", "完成方案设计", "DESIGN", "schemeDesignDone", {
    successEffects: { stageProgress: 25, quality: 3, dataIntegrity: 3 },
  }),
  stageTask("push_construction_drawings", "推进施工图出图", "DESIGN", "constructionDrawingDone", {
    successEffects: { stageProgress: 25, quality: 4, dataIntegrity: 4 },
  }),
  stageTask("organize_drawing_review", "组织图纸会审", "DESIGN", "drawingReviewDone", {
    successEffects: { stageProgress: 25, quality: 3, dataIntegrity: 3 },
  }),
  stageTask("close_design_issues", "闭合设计问题清单", "DESIGN", "designIssuesClosed", {
    successEffects: { stageProgress: 25, quality: 4, latentRisk: -3 },
  }),

  stageTask("prepare_cost_estimate", "编制控制价", "PROCUREMENT", "costEstimateDone", {
    successEffects: { stageProgress: 25, cost: 3, dataIntegrity: 2 },
  }),
  stageTask("finalize_tender_docs", "完善招标文件", "PROCUREMENT", "tenderDocsDone", {
    successEffects: { stageProgress: 25, dataIntegrity: 4, ownerTrust: 2 },
  }),
  stageTask("select_main_contractor", "确定主要参建单位", "PROCUREMENT", "mainContractorSelected", {
    successEffects: { stageProgress: 25, ownerTrust: 3 },
  }),
  stageTask("clarify_contract_boundary", "梳理合同边界", "PROCUREMENT", "contractBoundaryClear", {
    successEffects: { stageProgress: 25, dataIntegrity: 3, latentRisk: -2 },
  }),

  stageTask("ready_start_condition", "具备开工条件", "CONSTRUCTION", "startConditionReady", {
    successEffects: { stageProgress: 25, safety: 3, progress: 2 },
  }),
  stageTask("complete_main_structure", "完成主体结构", "CONSTRUCTION", "mainStructureDone", {
    successEffects: { stageProgress: 25, quality: 3, safety: 2 },
  }),
  stageTask("complete_mep_system", "完成机电系统", "CONSTRUCTION", "mepSystemDone", {
    successEffects: { stageProgress: 25, quality: 2, safety: 2 },
  }),
  stageTask("complete_decoration", "完成装饰装修", "CONSTRUCTION", "decorationDone", {
    successEffects: { stageProgress: 25, quality: 3 },
  }),

  stageTask("pass_fire_acceptance", "通过消防验收", "ACCEPTANCE", "fireAcceptancePassed", {
    successEffects: { stageProgress: 25, fireRisk: -8, safety: 3 },
    triggerBroadcast: true,
  }),
  stageTask("pass_completion_acceptance", "完成竣工验收", "ACCEPTANCE", "completionAccepted", {
    successEffects: { stageProgress: 25, quality: 4, dataIntegrity: 4 },
    triggerBroadcast: true,
  }),
  stageTask("complete_archive", "完成资料归档", "ACCEPTANCE", "archiveCompleted", {
    successEffects: { stageProgress: 25, dataIntegrity: 8 },
  }),
  stageTask("complete_property_handover", "完成物业移交", "ACCEPTANCE", "propertyHandoverDone", {
    successEffects: { stageProgress: 25, propertyHandover: 8 },
    triggerBroadcast: true,
  }),
];

export const LEGACY_TASK_STAGES: Record<string, ProjectStageId> = {
  fire_corridor_blocked: "ACCEPTANCE",
  fire_pump_sign_missing: "ACCEPTANCE",
  sprinkler_blocked: "ACCEPTANCE",
  merchant_early_entry: "CONSTRUCTION",
  finish_protection_damaged: "CONSTRUCTION",
  property_key_handover: "ACCEPTANCE",
  drawing_mismatch: "DESIGN",
  hidden_acceptance_missing: "ACCEPTANCE",
  material_retest_failed: "CONSTRUCTION",
  atrium_upgrade_request: "DESIGN",
  supervisor_reject_close: "ACCEPTANCE",
  equipment_debug_unready: "CONSTRUCTION",
  mep_collision: "CONSTRUCTION",
  design_reply_delayed: "DESIGN",
  supplier_delay: "PROCUREMENT",
  merchant_power_request: "CONSTRUCTION",
  night_construction_complaint: "CONSTRUCTION",
  quality_station_report: "ACCEPTANCE",
  property_maintenance_access: "CONSTRUCTION",
  opening_joint_inspection: "ACCEPTANCE",
};
