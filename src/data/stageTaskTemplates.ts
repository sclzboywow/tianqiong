import type { ProjectStageId } from "@/game/projectStages";

/** 现场/支线任务 slug → 阶段映射（不含已删除的旧阶段主线） */
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
