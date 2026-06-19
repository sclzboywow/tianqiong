export type NpcTaskActionType =
  | "contact_npc"
  | "invite_npc"
  | "go_to_location"
  | "hold_meeting"
  | "site_check"
  | "complete_step";

export type NpcTaskActionDefinition = {
  id: string;
  taskSlug: string;
  locationId: string;
  type: NpcTaskActionType;
  label: string;
  sortOrder: number;
  targetNpcId?: string;
  targetLocationId?: string;
  dependsOnActionIds?: string[];
  requiresCanProgress?: boolean;
  successLog?: string;
};

export const NPC_TASK_ACTIONS: NpcTaskActionDefinition[] = [
  // —— 召开项目启动会 ——
  {
    id: "coord_contact_primary",
    taskSlug: "hold_project_kickoff_meeting",
    locationId: "project_meeting_room",
    type: "contact_npc",
    label: "联络业主项目负责人",
    sortOrder: 1,
    targetNpcId: "owner_project_director",
    successLog: "已联络林知远，确认其知晓会议安排。",
  },
  {
    id: "coord_confirm_attendees",
    taskSlug: "hold_project_kickoff_meeting",
    locationId: "project_meeting_room",
    type: "complete_step",
    label: "确认参会名单",
    sortOrder: 2,
    dependsOnActionIds: ["coord_contact_primary"],
    successLog: "参会名单已确认：业主、总包、监理、设计负责人。",
  },
  {
    id: "coord_send_notice",
    taskSlug: "hold_project_kickoff_meeting",
    locationId: "project_meeting_room",
    type: "complete_step",
    label: "发送会议通知",
    sortOrder: 3,
    dependsOnActionIds: ["coord_confirm_attendees"],
    successLog: "会议通知已发送，各方确认收到。",
  },
  {
    id: "coord_hold_meeting",
    taskSlug: "hold_project_kickoff_meeting",
    locationId: "project_meeting_room",
    type: "hold_meeting",
    label: "召开项目启动会",
    sortOrder: 4,
    dependsOnActionIds: ["coord_send_notice"],
    requiresCanProgress: true,
    successLog: "项目启动会已召开，可前往任务页继续推进。",
  },

  // —— 闭合图纸会审问题 · 设计院 ——
  {
    id: "design_talk_at_institute",
    taskSlug: "hold_scheme_review_meeting",
    locationId: "third_design_institute",
    type: "contact_npc",
    label: "与设计负责人沟通",
    sortOrder: 1,
    targetNpcId: "design_lead",
    successLog: "已与蓝澈沟通会审遗留问题，明确闭合路径。",
  },
  {
    id: "design_prepare_bim_list",
    taskSlug: "hold_scheme_review_meeting",
    locationId: "third_design_institute",
    type: "complete_step",
    label: "整理 BIM 问题清单",
    sortOrder: 2,
    dependsOnActionIds: ["design_talk_at_institute"],
    successLog: "BIM 与技术问题清单已整理完毕。",
  },
  {
    id: "design_go_meeting_room",
    taskSlug: "hold_scheme_review_meeting",
    locationId: "third_design_institute",
    type: "go_to_location",
    label: "前往综合会议室闭合",
    sortOrder: 3,
    dependsOnActionIds: ["design_prepare_bim_list"],
    targetLocationId: "project_meeting_room",
    successLog: "下一步请前往项目部·综合会议室组织闭合。",
  },

  // —— 闭合图纸会审问题 · 会议室 ——
  {
    id: "design_invite_lead",
    taskSlug: "hold_scheme_review_meeting",
    locationId: "project_meeting_room",
    type: "invite_npc",
    label: "邀请设计负责人到会议室",
    sortOrder: 1,
    targetNpcId: "design_lead",
    successLog: "已邀请蓝澈到综合会议室参与闭合。",
  },
  {
    id: "design_close_issues",
    taskSlug: "hold_scheme_review_meeting",
    locationId: "project_meeting_room",
    type: "complete_step",
    label: "闭合设计问题清单",
    sortOrder: 2,
    dependsOnActionIds: ["design_invite_lead"],
    requiresCanProgress: true,
    successLog: "设计问题清单已闭合，可前往任务页继续推进。",
  },

  // —— 消防泵房联动测试 ——
  {
    id: "fire_contact_engineer",
    taskSlug: "fire_pump_sign_missing",
    locationId: "site_fire_pump_room",
    type: "contact_npc",
    label: "联络消防检测工程师",
    sortOrder: 1,
    targetNpcId: "fire_testing_engineer",
    successLog: "已联络消防检测工程师，确认到场时间。",
  },
  {
    id: "fire_notify_mep",
    taskSlug: "fire_pump_sign_missing",
    locationId: "site_fire_pump_room",
    type: "contact_npc",
    label: "通知机电工长到场",
    sortOrder: 2,
    targetNpcId: "mep_system_lead",
    successLog: "已通知机电工长准备配合联动测试。",
  },
  {
    id: "fire_site_check",
    taskSlug: "fire_pump_sign_missing",
    locationId: "site_fire_pump_room",
    type: "site_check",
    label: "组织联动测试",
    sortOrder: 3,
    dependsOnActionIds: ["fire_contact_engineer", "fire_notify_mep"],
    requiresCanProgress: true,
    successLog: "消防泵房联动测试已完成。",
  },
  {
    id: "fire_record_issue",
    taskSlug: "fire_pump_sign_missing",
    locationId: "site_fire_pump_room",
    type: "complete_step",
    label: "形成整改记录",
    sortOrder: 4,
    dependsOnActionIds: ["fire_site_check"],
    successLog: "整改记录已形成，可前往任务页继续推进。",
  },
];

export function getNpcTaskActions(params: {
  taskSlug: string;
  locationId: string;
}): NpcTaskActionDefinition[] {
  return NPC_TASK_ACTIONS.filter(
    (action) => action.taskSlug === params.taskSlug && action.locationId === params.locationId,
  ).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getNpcTaskActionById(actionId: string): NpcTaskActionDefinition | undefined {
  return NPC_TASK_ACTIONS.find((action) => action.id === actionId);
}
