import type { SandtableAreaRegionId } from "@/data/locationSandtableAreas";

export type SandtableRegionDef = {
  id: SandtableAreaRegionId;
  name: string;
  description: string;
  zones: { id: string; name: string }[];
};

/** 协同地图六区定义（与前端沙盘一致） */
export const SANDTABLE_REGION_DEFS: SandtableRegionDef[] = [
  {
    id: "owner_hub",
    name: "业主中枢",
    description: "业主决策、计划总控、资金合同与资料统筹。",
    zones: [
      { id: "owner_decision", name: "决策办公室" },
      { id: "owner_control", name: "项目管理" },
      { id: "owner_commercial", name: "成本招采" },
      { id: "owner_records", name: "资料归档" },
    ],
  },
  {
    id: "command_center",
    name: "现场指挥区",
    description: "项目部会议、资料、安全质量和现场调度。",
    zones: [
      { id: "command_meeting", name: "会议调度" },
      { id: "command_document", name: "资料与图纸" },
      { id: "command_quality", name: "安全质量" },
    ],
  },
  {
    id: "approval_regulatory",
    name: "审批监管区",
    description: "政务审批、规划住建、消防质监等外部监管窗口。",
    zones: [
      { id: "approval_window", name: "审批窗口" },
      { id: "approval_supervision", name: "监管专项" },
    ],
  },
  {
    id: "professional_service",
    name: "专业服务区",
    description: "设计、造价、检测、咨询等专业支撑单位。",
    zones: [
      { id: "professional_design", name: "设计与造价" },
      { id: "professional_testing", name: "检测咨询" },
      { id: "professional_special", name: "专项顾问" },
    ],
  },
  {
    id: "construction_site",
    name: "施工现场",
    description: "项目推进的核心区域，聚合现场入口、楼栋、机电和室外配套。",
    zones: [
      { id: "site_entry_temp", name: "场区入口与临建区" },
      { id: "site_office_living", name: "办公生活区" },
      { id: "site_material_yard", name: "材料加工与堆场区" },
      { id: "site_building_stack", name: "楼栋垂直空间" },
      { id: "site_systems", name: "专业系统区" },
      { id: "site_outdoor_municipal", name: "室外与市政配套区" },
    ],
  },
  {
    id: "opening_prep",
    name: "开业筹备区",
    description: "物业移交、商户进场、联检整改与开业保障。",
    zones: [
      { id: "opening_operation", name: "运营筹备" },
      { id: "opening_property", name: "物业移交" },
      { id: "opening_joint_check", name: "开业联检" },
    ],
  },
];

export const SANDTABLE_REGION_OPTIONS = SANDTABLE_REGION_DEFS.map((region) => ({
  label: region.name,
  value: region.id,
}));

export const SANDTABLE_ZONE_OPTIONS = SANDTABLE_REGION_DEFS.flatMap((region) =>
  region.zones.map((zone) => ({
    label: `${region.name} / ${zone.name}`,
    value: zone.id,
  })),
);

export function getSandtableRegionLabel(regionId?: string | null): string {
  if (!regionId) return "未分区";
  return SANDTABLE_REGION_DEFS.find((region) => region.id === regionId)?.name || regionId;
}

export function getSandtableZoneLabel(zoneId?: string | null): string {
  if (!zoneId) return "未分区";
  for (const region of SANDTABLE_REGION_DEFS) {
    const zone = region.zones.find((item) => item.id === zoneId);
    if (zone) return zone.name;
  }
  return zoneId;
}
