import type { SandtableAreaRegionId } from "@/data/locationSandtableAreas";

export type MapLocationSandtablePlacement = {
  regionId: SandtableAreaRegionId;
  zoneId: string;
  shortName?: string;
};

/** 协同地图可进入地点 → 沙盘 region / zone（与前端 placement 一致） */
export const MAP_LOCATION_SANDTABLE_PLACEMENT: Record<string, MapLocationSandtablePlacement> = {
  owner_gm_office: { regionId: "owner_hub", zoneId: "owner_decision", shortName: "总办" },
  owner_leader_office: { regionId: "owner_hub", zoneId: "owner_decision", shortName: "分管" },
  owner_project_management_dept: {
    regionId: "owner_hub",
    zoneId: "owner_control",
    shortName: "项目部",
  },
  owner_pre_approval_office: {
    regionId: "owner_hub",
    zoneId: "owner_control",
    shortName: "前期",
  },
  owner_cost_contract_dept: {
    regionId: "owner_hub",
    zoneId: "owner_commercial",
    shortName: "成本",
  },
  owner_procurement_office: {
    regionId: "owner_hub",
    zoneId: "owner_commercial",
    shortName: "招采",
  },
  owner_finance_dept: { regionId: "owner_hub", zoneId: "owner_commercial", shortName: "财务" },
  owner_legal_audit_dept: {
    regionId: "owner_hub",
    zoneId: "owner_commercial",
    shortName: "法审",
  },
  owner_archive_room: { regionId: "owner_hub", zoneId: "owner_records", shortName: "档案" },
  owner_operation_prep_office: {
    regionId: "opening_prep",
    zoneId: "opening_operation",
    shortName: "运营",
  },
  project_meeting_room: {
    regionId: "command_center",
    zoneId: "command_meeting",
    shortName: "会议",
  },
  project_document_room: {
    regionId: "command_center",
    zoneId: "command_document",
    shortName: "资料",
  },
  gov_service_center: {
    regionId: "approval_regulatory",
    zoneId: "approval_window",
    shortName: "政务",
  },
  gov_natural_resources: {
    regionId: "approval_regulatory",
    zoneId: "approval_window",
    shortName: "资规",
  },
  gov_housing_construction: {
    regionId: "approval_regulatory",
    zoneId: "approval_supervision",
    shortName: "住建",
  },
  third_design_institute: {
    regionId: "professional_service",
    zoneId: "professional_design",
    shortName: "设计",
  },
  third_cost_consultant: {
    regionId: "professional_service",
    zoneId: "professional_design",
    shortName: "造价",
  },
  third_testing_center: {
    regionId: "professional_service",
    zoneId: "professional_testing",
    shortName: "检测",
  },
  third_drawing_review_agency: {
    regionId: "professional_service",
    zoneId: "professional_design",
    shortName: "审图",
  },
  third_tendering_agency: {
    regionId: "professional_service",
    zoneId: "professional_design",
    shortName: "招标",
  },
  site_l1_commercial_street: {
    regionId: "construction_site",
    zoneId: "site_building_stack",
    shortName: "L1",
  },
  site_atrium: {
    regionId: "construction_site",
    zoneId: "site_outdoor_municipal",
    shortName: "中庭",
  },
  site_b1_mep_corridor: {
    regionId: "construction_site",
    zoneId: "site_building_stack",
    shortName: "B1",
  },
  site_fire_pump_room: {
    regionId: "construction_site",
    zoneId: "site_systems",
    shortName: "消防",
  },
  site_material_yard: {
    regionId: "construction_site",
    zoneId: "site_material_yard",
    shortName: "堆场",
  },
  site_property_handover: {
    regionId: "opening_prep",
    zoneId: "opening_property",
    shortName: "物业",
  },
};

export function getMapLocationSandtablePlacement(locationId: string): MapLocationSandtablePlacement {
  return (
    MAP_LOCATION_SANDTABLE_PLACEMENT[locationId] ?? {
      regionId: "command_center",
      zoneId: "command_meeting",
    }
  );
}
