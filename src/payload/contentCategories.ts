export type CategoryOption = { label: string; value: string };

export const NPC_CATEGORIES: CategoryOption[] = [
  { label: "甲方与监管", value: "owner_regulator" },
  { label: "施工体系", value: "construction" },
  { label: "设计与供应", value: "design_supply" },
  { label: "运营与物业", value: "operation" },
];

export const AREA_CATEGORIES: CategoryOption[] = [
  { label: "营业区域", value: "commercial" },
  { label: "机电后勤", value: "mep" },
  { label: "消防安全", value: "fire_safety" },
  { label: "验收移交", value: "handover" },
  { label: "材料后勤", value: "logistics" },
];

export const EVENT_CATEGORIES: CategoryOption[] = [
  { label: "建设主线", value: "mainline" },
  { label: "现场事件", value: "site_event" },
  { label: "消防专项", value: "fire" },
  { label: "质量资料", value: "quality" },
  { label: "进度协调", value: "schedule" },
  { label: "商户运营", value: "merchant" },
  { label: "验收移交", value: "acceptance" },
  { label: "多人协作", value: "collaboration" },
];

export const TASK_CATEGORIES: CategoryOption[] = EVENT_CATEGORIES;

export const ITEM_CATEGORIES: CategoryOption[] = [
  { label: "安全防护", value: "safety" },
  { label: "资料工具", value: "document" },
  { label: "协调道具", value: "coordination" },
  { label: "消耗恢复", value: "consumable" },
  { label: "品质交付", value: "quality" },
];

export const ACHIEVEMENT_CATEGORIES: CategoryOption[] = [
  { label: "入门引导", value: "onboarding" },
  { label: "任务成就", value: "task" },
  { label: "指标成就", value: "metric" },
  { label: "剧情彩蛋", value: "story" },
];

export const MAP_LOCATION_CATEGORIES: CategoryOption[] = [
  { label: "建设主体", value: "owner_entity" },
  { label: "项目部", value: "project_team" },
  { label: "政府单位", value: "government" },
  { label: "第三方机构", value: "third_party" },
  { label: "施工现场", value: "site" },
];

const NPC_TYPE_CATEGORY: Record<string, string> = {
  owner: "owner_regulator",
  supervisor: "owner_regulator",
  regulator: "owner_regulator",
  fire: "owner_regulator",
  contractor: "construction",
  subcontractor: "construction",
  design: "design_supply",
  supplier: "design_supply",
  merchant: "operation",
  property: "operation",
};

const LEGACY_TASK_CATEGORY: Record<string, string> = {
  fire_corridor_blocked: "fire",
  fire_pump_sign_missing: "fire",
  sprinkler_blocked: "fire",
  hidden_acceptance_missing: "acceptance",
  quality_station_report: "acceptance",
  supervisor_reject_close: "acceptance",
  opening_joint_inspection: "acceptance",
  property_key_handover: "acceptance",
  drawing_mismatch: "quality",
  design_reply_delayed: "quality",
  atrium_upgrade_request: "quality",
  merchant_early_entry: "merchant",
  merchant_power_request: "merchant",
  night_construction_complaint: "merchant",
  finish_protection_damaged: "site_event",
  material_retest_failed: "site_event",
  equipment_debug_unready: "site_event",
  mep_collision: "site_event",
  property_maintenance_access: "site_event",
  supplier_delay: "schedule",
};

const ITEM_EFFECT_CATEGORY: Record<string, string> = {
  safety: "safety",
  fireRisk: "safety",
  dataIntegrity: "document",
  quality: "quality",
  progress: "coordination",
  ownerTrust: "coordination",
  propertyHandover: "coordination",
  cost: "coordination",
  spirit: "consumable",
  stamina: "consumable",
};

export function inferNpcCategory(type: string, category?: string) {
  if (category) return category;
  return NPC_TYPE_CATEGORY[type] || "construction";
}

export function inferAreaCategory(name: string, stage?: string, category?: string) {
  if (category) return category;
  if (name.includes("消防")) return "fire_safety";
  if (name.includes("资料")) return "handover";
  if (name.includes("物业") || name.includes("交接")) return "handover";
  if (name.includes("材料")) return "logistics";
  if (name.includes("设备") || stage === "机电") return "mep";
  return "commercial";
}

export function inferTaskCategory(input: {
  slug: string;
  category?: string;
  milestoneEffects?: Record<string, boolean>;
  requiredCount?: number;
  rarity?: string;
}) {
  if (input.category) return input.category;
  if (LEGACY_TASK_CATEGORY[input.slug]) return LEGACY_TASK_CATEGORY[input.slug];
  if (input.milestoneEffects && Object.keys(input.milestoneEffects).length > 0) return "mainline";
  if ((input.requiredCount || 0) > 1 || ["SR", "SSR", "UR"].includes(input.rarity || "")) {
    return "collaboration";
  }
  return "site_event";
}

export function inferItemCategory(effectType?: string, category?: string) {
  if (category) return category;
  if (!effectType) return "coordination";
  return ITEM_EFFECT_CATEGORY[effectType] || "coordination";
}

const MAP_LOCATION_GROUP_CATEGORY: Record<string, string> = {
  建设主体: "owner_entity",
  项目部: "project_team",
  政府单位: "government",
  第三方机构: "third_party",
  施工现场: "site",
};

export function inferMapLocationCategory(group: string, category?: string) {
  if (category) return category;
  return MAP_LOCATION_GROUP_CATEGORY[group] || "site";
}

const NPC_TYPE_UNLOCK_STAGE: Record<string, string> = {
  owner: "INITIATION",
  design: "DESIGN",
  supplier: "PROCUREMENT",
  contractor: "CONSTRUCTION",
  subcontractor: "CONSTRUCTION",
  supervisor: "CONSTRUCTION",
  fire: "CONSTRUCTION",
  merchant: "CONSTRUCTION",
  regulator: "ACCEPTANCE",
  property: "ACCEPTANCE",
};

const AREA_NAME_UNLOCK_STAGE: Record<string, string> = {
  项目资料室: "INITIATION",
  物业交接区: "ACCEPTANCE",
  L1商业街: "CONSTRUCTION",
  商业中庭: "CONSTRUCTION",
  B1设备走廊: "CONSTRUCTION",
  消防泵房: "CONSTRUCTION",
  材料堆场: "CONSTRUCTION",
};

const AREA_STAGE_UNLOCK_STAGE: Record<string, string> = {
  资料: "INITIATION",
  移交: "ACCEPTANCE",
};

export function inferNpcUnlockStage(type: string, unlockStage?: string) {
  if (unlockStage) return unlockStage;
  return NPC_TYPE_UNLOCK_STAGE[type] || "INITIATION";
}

export function inferAreaUnlockStage(name: string, stage?: string, unlockStage?: string) {
  if (unlockStage) return unlockStage;
  if (AREA_NAME_UNLOCK_STAGE[name]) return AREA_NAME_UNLOCK_STAGE[name];
  if (stage && AREA_STAGE_UNLOCK_STAGE[stage]) return AREA_STAGE_UNLOCK_STAGE[stage];
  return "CONSTRUCTION";
}

export function inferAchievementCategory(input: {
  category?: string;
  conditionType: string;
  slug: string;
}) {
  if (input.category) return input.category;
  if (input.conditionType === "choice_made") return "story";
  if (input.conditionType === "metric_threshold") return "metric";
  if (input.slug === "first_task") return "onboarding";
  if (input.conditionType === "task_complete_count" && input.slug === "first_task") return "onboarding";
  if (input.conditionType === "task_complete_count") return "task";
  if (input.conditionType === "task_rarity_complete") return "task";
  return "task";
}

export function getCategoryLabel(options: CategoryOption[], value?: string | null) {
  if (!value) return "未分类";
  return options.find((option) => option.value === value)?.label || value;
}
