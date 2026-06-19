import type { ProjectStageId } from "@/game/projectStages";
import { CONSTRUCTION_PROJECT_LOCATION_ACTIONS } from "@/data/constructionProjectLocationActions";

export type LocationAction = {
  id: string;
  locationId: string;
  label: string;
  description: string;
  unlockStage?: ProjectStageId;
  unlockMilestones?: string[];
  triggerTaskSlugs?: string[];
  relatedNpcNames?: string[];
  riskTags?: string[];
  staminaCost?: number;
  spiritCost?: number;
  minLevel?: number;
  minReputation?: number;
  resultText?: string;
  noTaskText?: string;
  storySlug?: string;
  sortOrder?: number;
};

/** 兼容旧地点入口（触发建设项目主线，非旧阶段主线） */
export const LEGACY_LOCATION_ACTIONS: LocationAction[] = [
  {
    id: "action_pre_approval_push",
    locationId: "owner_pre_approval_office",
    label: "推进前期报批",
    description: "梳理报批路径并准备报批资料包。",
    unlockStage: "APPROVAL",
    unlockMilestones: ["masterPlanDone"],
    triggerTaskSlugs: ["commission_project_proposal", "prepare_approval_application_package"],
    relatedNpcNames: ["甲方代表"],
    riskTags: ["approval", "document"],
    spiritCost: 12,
    minLevel: 2,
    minReputation: 20,
  },
  {
    id: "action_gov_service_approval",
    locationId: "gov_service_center",
    label: "办理审批事项",
    description: "前往政务服务中心办理前期审批相关事项。",
    unlockStage: "APPROVAL",
    unlockMilestones: ["approvalPathConfirmed"],
    triggerTaskSlugs: ["submit_approval_application", "obtain_approval_reply"],
    riskTags: ["approval"],
    spiritCost: 12,
    minLevel: 2,
    minReputation: 20,
  },
  {
    id: "action_planning_condition",
    locationId: "gov_natural_resources",
    label: "确认规划条件",
    description: "与自然资源和规划局对接，确认规划条件与许可路径。",
    unlockStage: "APPROVAL",
    unlockMilestones: ["approvalPathConfirmed"],
    triggerTaskSlugs: ["consult_planning_condition"],
    riskTags: ["planning", "approval"],
    spiritCost: 14,
    minLevel: 2,
    minReputation: 25,
  },
  {
    id: "action_design_review",
    locationId: "third_design_institute",
    label: "推进设计会审",
    description: "组织图纸会审并推动设计问题闭合。",
    unlockStage: "DESIGN",
    triggerTaskSlugs: ["hold_scheme_review_meeting", "submit_drawing_review"],
    relatedNpcNames: ["设计院"],
    riskTags: ["design", "quality"],
    spiritCost: 15,
    minLevel: 3,
    minReputation: 30,
  },
];

export const LOCATION_ACTIONS: LocationAction[] = [
  ...CONSTRUCTION_PROJECT_LOCATION_ACTIONS,
  {
    id: "action_fire_pump_check",
    locationId: "site_fire_pump_room",
    label: "消防泵房检查",
    description: "检查消防泵房设备与标识，推进消防专项整改。",
    unlockStage: "CONSTRUCTION",
    triggerTaskSlugs: ["fire_pump_sign_missing"],
    relatedNpcNames: ["消防专家"],
    riskTags: ["fire", "acceptance"],
    staminaCost: 10,
    spiritCost: 5,
    minLevel: 2,
  },
  {
    id: "action_l1_site_coordination",
    locationId: "site_l1_commercial_street",
    label: "商业街现场协调",
    description: "处理 L1 商业街消防通道占用与商户提前进场诉求。",
    unlockStage: "CONSTRUCTION",
    triggerTaskSlugs: ["fire_corridor_blocked", "merchant_early_entry"],
    relatedNpcNames: ["商户/运营团队", "消防专家"],
    riskTags: ["fire", "merchant"],
    staminaCost: 8,
    spiritCost: 8,
    minLevel: 2,
    minReputation: 20,
  },
  {
    id: "action_material_retest",
    locationId: "site_material_yard",
    label: "材料进场复检",
    description: "对堆场进场材料组织复检，处理不合格批次。",
    unlockStage: "CONSTRUCTION",
    triggerTaskSlugs: ["material_retest_failed"],
    relatedNpcNames: ["供应商"],
    riskTags: ["material", "quality"],
    staminaCost: 8,
    spiritCost: 4,
    minLevel: 2,
  },
  {
    id: "action_property_handover",
    locationId: "site_property_handover",
    label: "物业钥匙移交",
    description: "在物业交接区办理钥匙移交与接管协调。",
    unlockStage: "ACCEPTANCE",
    triggerTaskSlugs: ["property_key_handover", "opening_joint_inspection"],
    relatedNpcNames: ["物业公司"],
    riskTags: ["handover", "document"],
    spiritCost: 15,
    minLevel: 3,
    minReputation: 35,
  },
];
