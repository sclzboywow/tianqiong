import type { NpcPresenceStatus } from "@/game/npcPresenceResolver";

export type NpcTaskRequirement = {
  taskSlug: string;
  taskTitle?: string;
  locationId: string;
  hintLocationIds?: string[];
  primaryNpcId: string;
  supportNpcIds?: string[];
  blockerNpcIds?: string[];
  requiredPrimaryPresence?: NpcPresenceStatus | "any";
  requiredSupportPresence?: NpcPresenceStatus | "reachable" | "any";
  hintWhenBlocked?: string;
};

export const NPC_TASK_REQUIREMENTS: NpcTaskRequirement[] = [
  {
    taskSlug: "coordinate_first_meeting",
    taskTitle: "组织第一次综合协调会",
    locationId: "project_meeting_room",
    primaryNpcId: "owner_project_director",
    supportNpcIds: [
      "contractor_project_manager",
      "chief_supervisor",
      "design_lead",
    ],
    requiredPrimaryPresence: "present",
    requiredSupportPresence: "reachable",
    hintWhenBlocked: "需要先确认业主项目负责人到场，并联络总包、监理和设计负责人参会。",
  },
  {
    taskSlug: "close_design_issues",
    taskTitle: "闭合图纸会审问题",
    locationId: "project_meeting_room",
    hintLocationIds: ["third_design_institute"],
    primaryNpcId: "design_lead",
    supportNpcIds: [
      "bim_technical_lead",
      "chief_supervisor",
      "owner_project_director",
    ],
    requiredPrimaryPresence: "present",
    requiredSupportPresence: "reachable",
    hintWhenBlocked: "设计负责人未到场时，先去设计院沟通，或完成图纸会审前置动作。",
  },
  {
    taskSlug: "fire_pump_sign_missing",
    taskTitle: "组织消防泵房联动测试",
    locationId: "site_fire_pump_room",
    primaryNpcId: "fire_testing_engineer",
    supportNpcIds: [
      "fire_acceptance_officer",
      "property_engineering_manager",
      "mep_system_lead",
    ],
    requiredPrimaryPresence: "present",
    requiredSupportPresence: "reachable",
    hintWhenBlocked: "消防检测工程师必须到消防泵房现场，其他人员至少可联络。",
  },
];

export function getNpcTaskRequirement(taskSlug: string): NpcTaskRequirement | undefined {
  return NPC_TASK_REQUIREMENTS.find((requirement) => requirement.taskSlug === taskSlug);
}
