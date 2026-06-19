import type { ProjectStageId } from "@/game/projectStages";
import { getMapLocationSandtablePlacement } from "@/data/mapLocationSandtable";

export type LocationType =
  | "owner_office"
  | "project_office"
  | "government"
  | "third_party"
  | "site_zone";

export type MapLocation = {
  id: string;
  name: string;
  type: LocationType;
  group: string;
  sandtableRegionId: string;
  sandtableZoneId: string;
  description: string;
  unlockStage: ProjectStageId;
  unlockMilestones?: string[];
  relatedTaskSlugs?: string[];
  relatedAreaNames?: string[];
  relatedNpcNames?: string[];
  riskTags?: string[];
  achievementHooks?: string[];
};

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  owner_office: "建设主体",
  project_office: "项目部",
  government: "政府单位",
  third_party: "第三方机构",
  site_zone: "施工现场",
};

export const LOCATION_GROUP_ORDER = [
  "建设主体",
  "项目部",
  "政府单位",
  "第三方机构",
  "施工现场",
] as const;

export const MAP_LOCATION_SEED: Omit<MapLocation, "sandtableRegionId" | "sandtableZoneId">[] = [
  // —— 建设主体（10） ——
  {
    id: "owner_gm_office",
    name: "建设主体·总经理办公室",
    type: "owner_office",
    group: "建设主体",
    description: "项目最高决策层，重大节点汇报与资源协调的入口。",
    unlockStage: "INITIATION",
    relatedTaskSlugs: ["setup_project_team"],
    relatedNpcNames: ["甲方代表"],
    riskTags: ["progress", "coordination"],
    achievementHooks: ["first_owner_gm_visit"],
  },
  {
    id: "owner_project_management_dept",
    name: "建设主体·项目管理部",
    type: "owner_office",
    group: "建设主体",
    description: "项目推进的核心协调部门，负责总控计划、阶段推进、问题协调和跨单位沟通。",
    unlockStage: "INITIATION",
    relatedTaskSlugs: [
      "setup_project_team",
      "prepare_master_plan",
      "create_risk_register",
      "coordinate_first_meeting",
      "confirm_project_need",
      "prepare_master_control_plan",
    ],
    relatedAreaNames: ["项目管理部"],
    relatedNpcNames: ["甲方代表", "总承包单位"],
    riskTags: ["progress", "coordination"],
    achievementHooks: ["first_owner_office_visit"],
  },
  {
    id: "owner_archive_room",
    name: "建设主体·档案资料室",
    type: "owner_office",
    group: "建设主体",
    description: "建设主体侧资料归档、台账管理与验收资料统筹区域。",
    unlockStage: "INITIATION",
    relatedTaskSlugs: ["create_document_ledger", "complete_archive"],
    relatedAreaNames: ["档案资料室"],
    riskTags: ["document", "acceptance"],
    achievementHooks: ["first_archive_visit"],
  },
  {
    id: "owner_leader_office",
    name: "建设主体·分管领导办公室",
    type: "owner_office",
    group: "建设主体",
    description: "分管建设的领导层办公室，组织架构确定后可参与重大协调。",
    unlockStage: "INITIATION",
    unlockMilestones: ["projectOrgDone"],
    relatedTaskSlugs: ["setup_project_team"],
    relatedNpcNames: ["甲方代表"],
    riskTags: ["coordination", "ownerTrust"],
    achievementHooks: ["unlock_leader_office"],
  },
  {
    id: "owner_pre_approval_office",
    name: "建设主体·前期手续办公室",
    type: "owner_office",
    group: "建设主体",
    description: "负责报批路径、规划条件、手续资料和施工许可计划。",
    unlockStage: "APPROVAL",
    unlockMilestones: ["masterPlanDone"],
    relatedTaskSlugs: [
      "confirm_approval_path",
      "confirm_planning_condition",
      "prepare_approval_docs",
      "plan_construction_permit",
      "prepare_approval_application_package",
    ],
    relatedNpcNames: ["甲方代表"],
    riskTags: ["approval", "document"],
    achievementHooks: ["unlock_pre_approval_office"],
  },
  {
    id: "owner_cost_contract_dept",
    name: "建设主体·成本合约部",
    type: "owner_office",
    group: "建设主体",
    description: "负责控制价、合同边界、签证变更和成本压力控制。",
    unlockStage: "PROCUREMENT",
    relatedTaskSlugs: ["prepare_cost_estimate", "clarify_contract_boundary"],
    relatedNpcNames: ["甲方代表"],
    riskTags: ["cost", "contract"],
    achievementHooks: ["unlock_cost_dept"],
  },
  {
    id: "owner_procurement_office",
    name: "建设主体·招采办公室",
    type: "owner_office",
    group: "建设主体",
    description: "负责招标文件编制、单位比选和合同签订协调。",
    unlockStage: "PROCUREMENT",
    relatedTaskSlugs: ["finalize_tender_docs", "select_main_contractor", "prepare_bidding_plan", "sign_supervision_contract", "sign_construction_contract"],
    relatedNpcNames: ["甲方代表", "供应商"],
    riskTags: ["contract", "schedule"],
    achievementHooks: ["unlock_procurement_office"],
  },
  {
    id: "owner_finance_dept",
    name: "建设主体·财务资金部",
    type: "owner_office",
    group: "建设主体",
    description: "负责资金计划、付款审核和成本压力监控。",
    unlockStage: "PROCUREMENT",
    relatedTaskSlugs: ["prepare_cost_estimate", "supplier_delay", "prepare_funding_source_statement", "prepare_funding_certificate"],
    relatedNpcNames: ["甲方代表"],
    riskTags: ["cost"],
    achievementHooks: ["unlock_finance_dept"],
  },
  {
    id: "owner_legal_audit_dept",
    name: "建设主体·法务审计部",
    type: "owner_office",
    group: "建设主体",
    description: "负责合同合规审查、审计配合和争议协调。",
    unlockStage: "PROCUREMENT",
    unlockMilestones: ["contractBoundaryClear"],
    relatedTaskSlugs: ["clarify_contract_boundary", "supervisor_reject_close"],
    riskTags: ["contract", "document"],
    achievementHooks: ["unlock_legal_dept"],
  },
  {
    id: "owner_operation_prep_office",
    name: "建设主体·运营筹备办公室",
    type: "owner_office",
    group: "建设主体",
    description: "负责开业筹备、商户协调和运营移交对接。",
    unlockStage: "ACCEPTANCE",
    relatedTaskSlugs: ["complete_property_handover", "opening_joint_inspection", "merchant_early_entry"],
    relatedNpcNames: ["商户/运营团队", "物业公司"],
    riskTags: ["merchant", "handover"],
    achievementHooks: ["unlock_operation_prep"],
  },

  // —— 项目部 ——
  {
    id: "project_meeting_room",
    name: "项目部·综合会议室",
    type: "project_office",
    group: "项目部",
    description: "用于召开协调会、推进会和多人协作任务。",
    unlockStage: "INITIATION",
    relatedTaskSlugs: [
      "setup_project_team",
      "coordinate_first_meeting",
      "close_design_issues",
      "organize_drawing_review",
      "opening_joint_inspection",
      "hold_project_kickoff_meeting",
    ],
    relatedNpcNames: ["监理单位", "总承包单位"],
    riskTags: ["coordination"],
    achievementHooks: ["first_meeting_room"],
  },
  {
    id: "project_document_room",
    name: "项目部·资料室",
    type: "project_office",
    group: "项目部",
    description: "资料台账、图纸、签字、验收资料和归档事项集中处理区域。",
    unlockStage: "INITIATION",
    relatedTaskSlugs: [
      "create_document_ledger",
      "drawing_mismatch",
      "hidden_acceptance_missing",
      "complete_archive",
    ],
    relatedAreaNames: ["资料室"],
    relatedNpcNames: ["监理单位"],
    riskTags: ["document", "acceptance"],
    achievementHooks: ["first_document_room"],
  },

  // —— 政府单位 ——
  {
    id: "gov_service_center",
    name: "政务服务中心",
    type: "government",
    group: "政府单位",
    description: "集中办理发改、自规、住建等前期审批事项，是报批阶段的重要外部地点。",
    unlockStage: "APPROVAL",
    unlockMilestones: ["approvalPathConfirmed"],
    relatedTaskSlugs: ["confirm_approval_path", "prepare_approval_docs", "submit_approval_application", "obtain_approval_reply"],
    riskTags: ["approval"],
    achievementHooks: ["first_gov_service_visit"],
  },
  {
    id: "gov_natural_resources",
    name: "自然资源和规划局",
    type: "government",
    group: "政府单位",
    description: "涉及规划条件、方案审查、建设工程规划许可和规划核实。",
    unlockStage: "APPROVAL",
    unlockMilestones: ["approvalPathConfirmed"],
    relatedTaskSlugs: ["confirm_planning_condition", "consult_planning_condition", "obtain_land_pre_review_opinion"],
    riskTags: ["planning", "approval"],
    achievementHooks: ["first_planning_bureau_visit"],
  },
  {
    id: "gov_housing_construction",
    name: "住房城乡建设局",
    type: "government",
    group: "政府单位",
    description: "涉及施工许可、质量安全监督、消防审查、竣工验收备案等事项。",
    unlockStage: "CONSTRUCTION",
    unlockMilestones: ["contractBoundaryClear"],
    relatedTaskSlugs: [
      "plan_construction_permit",
      "pass_fire_acceptance",
      "pass_completion_acceptance",
      "prepare_quality_safety_supervision",
      "submit_construction_permit_application",
    ],
    relatedNpcNames: ["质监站"],
    riskTags: ["permit", "fire", "acceptance"],
    achievementHooks: ["first_housing_bureau_visit"],
  },

  // —— 第三方机构 ——
  {
    id: "third_design_institute",
    name: "设计院",
    type: "third_party",
    group: "第三方机构",
    description: "负责方案设计、施工图设计、设计答疑、图纸会审和变更配合。",
    unlockStage: "DESIGN",
    relatedTaskSlugs: [
      "complete_scheme_design",
      "push_construction_drawings",
      "organize_drawing_review",
      "close_design_issues",
      "design_reply_delayed",
      "drawing_mismatch",
      "atrium_upgrade_request",
      "organize_scheme_design",
      "prepare_construction_drawing",
      "revise_scheme_design_text",
      "revise_construction_drawing",
    ],
    relatedNpcNames: ["设计院"],
    riskTags: ["design", "quality", "schedule"],
    achievementHooks: ["first_design_institute_visit"],
  },
  {
    id: "third_cost_consultant",
    name: "造价咨询公司",
    type: "third_party",
    group: "第三方机构",
    description: "负责编制控制价、清单、预算审核和成本测算。",
    unlockStage: "APPROVAL",
    relatedTaskSlugs: [
      "prepare_cost_estimate",
      "commission_project_proposal",
      "prepare_feasibility_report",
    ],
    riskTags: ["cost"],
    achievementHooks: ["first_cost_consultant_visit"],
  },
  {
    id: "third_testing_center",
    name: "检测机构",
    type: "third_party",
    group: "第三方机构",
    description: "负责材料复检、现场检测和检测报告出具。",
    unlockStage: "CONSTRUCTION",
    relatedTaskSlugs: ["material_retest_failed", "quality_station_report"],
    relatedNpcNames: ["质监站"],
    riskTags: ["quality", "document"],
    achievementHooks: ["first_testing_center_visit"],
  },
  {
    id: "third_drawing_review_agency",
    name: "施工图审查机构",
    type: "third_party",
    group: "第三方机构",
    description: "负责施工图审查并出具审查合格书。",
    unlockStage: "DESIGN",
    relatedTaskSlugs: ["submit_drawing_review"],
    relatedAreaNames: ["施工图审查机构"],
    riskTags: ["design", "quality"],
  },
  {
    id: "third_tendering_agency",
    name: "招标代理公司",
    type: "third_party",
    group: "第三方机构",
    description: "负责招标文件编制、开评标组织与中标通知。",
    unlockStage: "PROCUREMENT",
    relatedTaskSlugs: [
      "prepare_tender_document",
      "approve_tender_document",
      "issue_bid_winning_notice",
    ],
    relatedAreaNames: ["招标代理公司"],
    riskTags: ["contract"],
  },

  // —— 施工现场 ——
  {
    id: "site_l1_commercial_street",
    name: "施工现场·L1商业街",
    type: "site_zone",
    group: "施工现场",
    description: "商户进场、消防通道、夜间施工投诉等事件高发区域。",
    unlockStage: "CONSTRUCTION",
    relatedAreaNames: ["L1 · 首层"],
    relatedTaskSlugs: [
      "fire_corridor_blocked",
      "merchant_early_entry",
      "night_construction_complaint",
      "merchant_power_request",
    ],
    relatedNpcNames: ["商户/运营团队", "消防专家"],
    riskTags: ["fire", "merchant", "schedule"],
    achievementHooks: ["first_l1_visit"],
  },
  {
    id: "site_fire_pump_room",
    name: "施工现场·消防泵房",
    type: "site_zone",
    group: "施工现场",
    description: "消防验收关键区域，涉及设备、标识、联动测试和整改闭合。",
    unlockStage: "CONSTRUCTION",
    relatedAreaNames: ["消防泵房"],
    relatedTaskSlugs: ["fire_pump_sign_missing", "pass_fire_acceptance"],
    relatedNpcNames: ["消防专家"],
    riskTags: ["fire", "acceptance"],
    achievementHooks: ["first_fire_pump_visit"],
  },
  {
    id: "site_atrium",
    name: "施工现场·商业中庭",
    type: "site_zone",
    group: "施工现场",
    description: "开业形象核心区，涉及装修品质、喷淋点位和效果提升。",
    unlockStage: "CONSTRUCTION",
    relatedAreaNames: ["商业中庭"],
    relatedTaskSlugs: [
      "sprinkler_blocked",
      "finish_protection_damaged",
      "atrium_upgrade_request",
      "opening_joint_inspection",
    ],
    riskTags: ["quality", "fire", "merchant"],
    achievementHooks: ["first_atrium_visit"],
  },
  {
    id: "site_material_yard",
    name: "施工现场·材料堆场",
    type: "site_zone",
    group: "施工现场",
    description: "材料进场、复检和堆放管理区域。",
    unlockStage: "CONSTRUCTION",
    relatedAreaNames: ["材料堆场"],
    relatedTaskSlugs: ["material_retest_failed", "supplier_delay"],
    relatedNpcNames: ["供应商"],
    riskTags: ["material", "quality", "schedule"],
    achievementHooks: ["first_material_yard_visit"],
  },
  {
    id: "site_b1_mep_corridor",
    name: "施工现场·B1设备走廊",
    type: "site_zone",
    group: "施工现场",
    description: "机电设备通道，涉及管线碰撞、调试和检修通道。",
    unlockStage: "CONSTRUCTION",
    relatedAreaNames: ["B1 · 地下一层"],
    relatedTaskSlugs: [
      "mep_collision",
      "equipment_debug_unready",
      "property_maintenance_access",
      "complete_mep_system",
    ],
    relatedNpcNames: ["专业分包"],
    riskTags: ["mep", "safety"],
    achievementHooks: ["first_b1_visit"],
  },
  {
    id: "site_property_handover",
    name: "施工现场·物业交接区",
    type: "site_zone",
    group: "施工现场",
    description: "物业钥匙移交、接管协调和缺陷消项办理区域。",
    unlockStage: "ACCEPTANCE",
    relatedAreaNames: ["物业工程部"],
    relatedTaskSlugs: ["property_key_handover", "complete_property_handover"],
    relatedNpcNames: ["物业公司"],
    riskTags: ["handover", "document"],
    achievementHooks: ["first_handover_zone_visit"],
  },
];

export const MAP_LOCATIONS: MapLocation[] = MAP_LOCATION_SEED.map((location) => {
  const placement = getMapLocationSandtablePlacement(location.id);
  return {
    ...location,
    sandtableRegionId: placement.regionId,
    sandtableZoneId: placement.zoneId,
  };
});

export function getMapLocationById(id: string): MapLocation | undefined {
  return MAP_LOCATIONS.find((loc) => loc.id === id);
}
