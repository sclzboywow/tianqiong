/** 占位 Ink，供尚未录入 Payload 的 NPC 演示对话框架 */
export const NPC_DIALOGUE_PLACEHOLDER_INK = "npc_dialogue_placeholder";

export type NpcDialogueCatalogEntry = {
  slug: string;
  title: string;
  inkFile: string;
  npcIds?: string[];
  npcNames: string[];
};

/** 静态兜底目录：Payload 无 npc_dialogue 条目时仍可验收框架 */
export const NPC_DIALOGUE_STATIC_CATALOG: NpcDialogueCatalogEntry[] = [
  {
    slug: "npc_dialogue_owner_general_manager_demo",
    title: "与许承岳寒暄（占位）",
    inkFile: NPC_DIALOGUE_PLACEHOLDER_INK,
    npcIds: ["owner_general_manager"],
    npcNames: ["许承岳", "业主总经理"],
  },
  {
    slug: "npc_dialogue_owner_project_coordinator_demo",
    title: "与赵清寒暄（占位）",
    inkFile: NPC_DIALOGUE_PLACEHOLDER_INK,
    npcIds: ["owner_project_coordinator"],
    npcNames: ["赵清", "项目管理专员"],
  },
  {
    slug: "npc_dialogue_contractor_project_manager_demo",
    title: "与陈建峰寒暄（占位）",
    inkFile: NPC_DIALOGUE_PLACEHOLDER_INK,
    npcIds: ["contractor_project_manager"],
    npcNames: ["陈建峰", "总包项目经理"],
  },
  {
    slug: "npc_dialogue_government_window_officer_demo",
    title: "与杜青寒暄（占位）",
    inkFile: NPC_DIALOGUE_PLACEHOLDER_INK,
    npcIds: ["government_window_officer"],
    npcNames: ["杜青", "综合窗口受理员"],
  },
];
