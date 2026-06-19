/** 旧 STAGE_TASK_TEMPLATES 主线 slug（已由建设项目主线替代，仅供清理与校验） */

export const LEGACY_STAGE_MAINLINE_TASK_SLUGS = [
  "confirm_approval_path",
  "confirm_planning_condition",
  "prepare_approval_docs",
  "plan_construction_permit",
  "complete_scheme_design",
  "push_construction_drawings",
  "organize_drawing_review",
  "close_design_issues",
  "prepare_cost_estimate",
  "finalize_tender_docs",
  "select_main_contractor",
  "clarify_contract_boundary",
  "ready_start_condition",
  "complete_main_structure",
  "complete_mep_system",
  "complete_decoration",
  "pass_fire_acceptance",
  "pass_completion_acceptance",
  "complete_archive",
  "complete_property_handover",
] as const;

export const LEGACY_STAGE_STORY_ENTRY_SLUGS = LEGACY_STAGE_MAINLINE_TASK_SLUGS.map(
  (slug) => `story_${slug}`,
);

/** 旧库中 StoryEntry.slug 常与任务 slug / inkFile 相同，清理时需同时匹配上述两类 */
