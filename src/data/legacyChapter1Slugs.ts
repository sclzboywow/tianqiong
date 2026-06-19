/** 旧 Chapter1 内容 slug 清单（仅供清理脚本与编排台检测使用） */

export const LEGACY_CHAPTER1_TASK_SLUGS = [
  "setup_project_team",
  "prepare_master_plan",
  "create_risk_register",
  "create_document_ledger",
  "coordinate_first_meeting",
] as const;

export const LEGACY_CHAPTER1_EVENT_SLUGS = [
  "evt_role_boundary_unclear",
  "evt_master_plan_disagreement",
  "evt_document_list_missing",
] as const;

export const LEGACY_CHAPTER1_STORY_ENTRY_SLUGS = LEGACY_CHAPTER1_TASK_SLUGS.map(
  (slug) => `story_${slug}`,
);

export const LEGACY_CHAPTER1_LOCATION_ACTION_SLUGS = [
  "action_chapter1_kickoff",
  "action_chapter1_master_plan",
  "action_risk_register",
  "action_document_ledger",
] as const;

export const LEGACY_CHAPTER1_INK_FILES = [...LEGACY_CHAPTER1_TASK_SLUGS];

export const ALL_LEGACY_CHAPTER1_SLUGS = [
  ...LEGACY_CHAPTER1_TASK_SLUGS,
  ...LEGACY_CHAPTER1_EVENT_SLUGS,
  ...LEGACY_CHAPTER1_STORY_ENTRY_SLUGS,
  ...LEGACY_CHAPTER1_LOCATION_ACTION_SLUGS,
];
