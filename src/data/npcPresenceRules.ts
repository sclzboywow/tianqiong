import type { ProjectStageId } from "@/game/projectStages";

export type NpcTemporaryPresenceRule = {
  locationId: string;
  reason: string;
  taskSlugs?: string[];
  eventSlugs?: string[];
  fromStage?: ProjectStageId;
  priority?: number;
};

export type NpcPresenceRule = {
  npcId: string;
  homeLocationId: string;
  appearStage?: ProjectStageId;
  reachableWhenAway?: boolean;
  temporaryLocations?: NpcTemporaryPresenceRule[];
  awayHint?: string;
};

export const NPC_PRESENCE_RULES: NpcPresenceRule[] = [
  {
    npcId: "owner_general_manager",
    homeLocationId: "owner_gm_office",
    appearStage: "INITIATION",
    reachableWhenAway: false,
    awayHint: "通常在业主·总经理办公室。重大节点汇报或资源申请时才会出现。",
  },
  {
    npcId: "owner_executive_leader",
    homeLocationId: "owner_leader_office",
    appearStage: "INITIATION",
    reachableWhenAway: false,
    awayHint: "通常在业主·分管领导办公室。节点风险较高时会参与协调。",
  },
  {
    npcId: "owner_project_director",
    homeLocationId: "owner_project_management_dept",
    appearStage: "INITIATION",
    reachableWhenAway: true,
    awayHint:
      "通常在业主·项目管理部。重大汇报时可能去总经理办公室，现场问题升级时会去项目部会议室。",
    temporaryLocations: [
      {
        locationId: "owner_gm_office",
        reason: "重大节点汇报",
        taskSlugs: ["prepare_master_control_plan"],
        priority: 1,
      },
      {
        locationId: "project_meeting_room",
        reason: "现场协调会",
        taskSlugs: ["hold_project_kickoff_meeting", "organize_drawing_review"],
        priority: 2,
      },
    ],
  },
  {
    npcId: "contractor_project_manager",
    homeLocationId: "area_contractor_pm_office",
    appearStage: "CONSTRUCTION",
    reachableWhenAway: true,
    awayHint: "通常在项目部·总包项目经理办公室。协调会或现场重大问题时会离开办公室。",
    temporaryLocations: [
      {
        locationId: "project_meeting_room",
        reason: "参加综合协调会",
        taskSlugs: ["hold_project_kickoff_meeting", "opening_joint_inspection"],
        priority: 1,
      },
    ],
  },
  {
    npcId: "chief_supervisor",
    homeLocationId: "area_supervisor_office",
    appearStage: "CONSTRUCTION",
    reachableWhenAway: true,
    awayHint: "通常在项目部·监理办公室。隐蔽验收、质量问题和资料签认时会去现场或资料室。",
    temporaryLocations: [
      {
        locationId: "project_document_room",
        reason: "核查验收资料",
        taskSlugs: ["hidden_acceptance_missing", "complete_archive"],
        priority: 1,
      },
    ],
  },
  {
    npcId: "design_lead",
    homeLocationId: "third_design_institute",
    appearStage: "DESIGN",
    reachableWhenAway: true,
    awayHint: "通常在设计院。图纸会审或设计答疑时会参加项目部会议。",
    temporaryLocations: [
      {
        locationId: "project_meeting_room",
        reason: "参加图纸会审",
        taskSlugs: ["organize_drawing_review", "close_design_issues"],
        priority: 1,
      },
    ],
  },
  {
    npcId: "fire_acceptance_officer",
    homeLocationId: "gov_housing_construction",
    appearStage: "ACCEPTANCE",
    reachableWhenAway: false,
    awayHint: "通常在消防验收窗口或住建相关窗口。消防验收阶段才会到现场复核。",
    temporaryLocations: [
      {
        locationId: "site_fire_pump_room",
        reason: "消防验收现场复核",
        taskSlugs: ["pass_fire_acceptance", "fire_pump_sign_missing"],
        priority: 1,
      },
    ],
  },
  {
    npcId: "fire_testing_engineer",
    homeLocationId: "third_testing_center",
    appearStage: "CONSTRUCTION",
    reachableWhenAway: true,
    awayHint: "通常在消防检测机构。消防联动测试或复测时会到消防泵房、消防控制室。",
    temporaryLocations: [
      {
        locationId: "site_fire_pump_room",
        reason: "消防系统检测",
        taskSlugs: ["fire_pump_sign_missing", "pass_fire_acceptance"],
        priority: 1,
      },
      {
        locationId: "area_fire_control_room",
        reason: "消防联动测试",
        taskSlugs: ["fire_pump_sign_missing", "pass_fire_acceptance"],
        priority: 2,
      },
    ],
  },
  {
    npcId: "property_engineering_manager",
    homeLocationId: "area_property_engineering_dept",
    appearStage: "ACCEPTANCE",
    reachableWhenAway: true,
    awayHint: "通常在物业工程部。物业移交时会到设备房、消防控制室和地下机电区域。",
    temporaryLocations: [
      {
        locationId: "site_property_handover",
        reason: "物业移交检查",
        taskSlugs: ["property_key_handover", "complete_property_handover"],
        priority: 1,
      },
      {
        locationId: "site_b1_mep_corridor",
        reason: "检查后期维保通道",
        taskSlugs: ["property_maintenance_access"],
        priority: 2,
      },
      {
        locationId: "area_fire_control_room",
        reason: "消防系统移交检查",
        taskSlugs: ["property_key_handover", "complete_property_handover"],
        priority: 2,
      },
    ],
  },
];

export function getNpcPresenceRule(npcId: string): NpcPresenceRule | undefined {
  return NPC_PRESENCE_RULES.find((rule) => rule.npcId === npcId);
}
