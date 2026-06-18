/**
 * 一次性从 Excel 生成 NPC 静态配置 TS 文件。
 * 用法: npx tsx scripts/generate-npc-config-from-xlsx.ts
 */
import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import { LOCATION_SANDTABLE_AREAS } from "../src/data/locationSandtableAreas";
import { MAP_LOCATION_SEED } from "../src/data/locations";
import { getOrganizationPayload } from "../src/lib/npcOrganizationPayload";

const ROOT = path.resolve(__dirname, "..");
const XLSX_PATH = path.join(ROOT, "天穹_分区沙盘NPC分级配置表.xlsx");

/** 按 Excel「职务/身份」映射稳定 profile id（勿按 NPC 序号硬编码，Excel 行序与旧序号不一致） */
const PROFILE_ID_BY_TITLE: Record<string, string> = {
  业主总经理: "owner_general_manager",
  分管领导: "owner_executive_leader",
  业主项目负责人: "owner_project_director",
  项目管理专员: "owner_project_coordinator",
  成本合约负责人: "owner_cost_contract_lead",
  招采专员: "owner_procurement_lead",
  财务资金负责人: "owner_finance_reviewer",
  档案资料管理员: "owner_archive_manager",
  运营筹备经理: "owner_operation_prep_lead",
  法审与审计联络人: "legal_audit_liaison",
  总包项目经理: "contractor_project_manager",
  生产经理: "contractor_production_manager",
  "技术/BIM负责人": "bim_technical_lead",
  安全总监: "contractor_safety_quality_lead",
  质量负责人: "contractor_technical_lead",
  商务经理: "contractor_business_lead",
  材料设备主管: "contractor_material_equipment_lead",
  资料主管: "supervisor_document_engineer",
  总监理工程师: "chief_supervisor",
  专业监理工程师: "supervisor_engineer",
  劳务实名制管理员: "labor_realname_officer",
  班组长: "team_coordination_lead",
  样板与精装工程师: "sample_disclosure_lead",
  综合窗口受理员: "government_window_officer",
  发改审批经办: "dev_reform_window_officer",
  规划审查负责人: "natural_resources_officer",
  施工许可科长: "housing_bureau_officer",
  质安监督员: "quality_safety_station_officer",
  消防设计审查工程师: "fire_design_review_officer",
  消防验收专员: "fire_acceptance_officer",
  人防窗口经办: "civil_defense_window_officer",
  生态环境窗口经办: "ecology_window_officer",
  水务排水接入专员: "water_drainage_window_officer",
  市政园林窗口经办: "municipal_garden_window_officer",
  交易中心项目经办: "public_resource_center_officer",
  竣工备案审查员: "completion_filing_officer",
  设计总负责人: "design_lead",
  勘察项目负责人: "survey_unit_lead",
  施工图审查工程师: "drawing_review_lead",
  造价咨询负责人: "cost_consultant_lead",
  招标代理项目经理: "bidding_agent_lead",
  全过程咨询项目经理: "whole_process_consultant",
  材料检测工程师: "material_testing_engineer",
  "桩基/基坑检测负责人": "pile_foundation_testing_engineer",
  沉降监测工程师: "settlement_monitoring_engineer",
  消防检测工程师: "fire_testing_engineer",
  环境检测工程师: "environment_testing_engineer",
  节能绿建咨询师: "green_building_consultant",
  测绘项目负责人: "survey_mapping_engineer",
  审计结算负责人: "audit_settlement_officer",
  专项顾问: "special_consultant",
  门卫与实名制管理员: "site_main_gate_officer",
  车辆与机械调度员: "site_vehicle_wash_officer",
  临电电工: "temp_utilities_officer",
  临水排水工长: "site_temp_road_officer",
  安全体验区讲解员: "site_safety_officer",
  后勤主管: "site_office_admin",
  材料仓库管理员: "site_material_yard_manager",
  危化品管理员: "site_medical_officer",
  钢筋工长: "site_rebar_processing_lead",
  木工工长: "site_carpentry_lead",
  机电工长: "site_mep_processing_lead",
  幕墙工长: "engineering_supervisor_lead",
  精装工长: "finishing_team_lead",
  周转材料管理员: "site_unloading_dispatcher",
  设备管理员: "site_equipment_yard_manager",
  垃圾清运负责人: "logistics_lane_coordinator",
  栋号长: "floor_construction_worker",
  水电消防工长: "mep_system_lead",
  电梯厂家工程师: "fire_pump_room_engineer",
  暖通工程师: "hvac_room_engineer",
  市政管网工长: "outdoor_municipal_coordinator",
  消防车道巡查员: "site_fire_lane_officer",
  景观工程师: "atrium_operations_lead",
  停车系统工程师: "parking_lot_manager",
  卸货调度员: "site_canteen_manager",
  通信接入工程师: "site_realname_officer",
  燃气接入协调人: "supplier_representative",
  供电接入经理: "subcontractor_lead",
  给水接入经理: "quality_supervision_officer",
  招商经理: "opening_leasing_manager",
  商户服务专员: "merchant_fitout_manager",
  二装管理员: "second_fitout_admin",
  物业客服主管: "property_customer_manager",
  物业工程经理: "property_engineering_manager",
  消防控制室值班长: "fire_control_room_officer",
  安保经理: "security_roster_manager",
  保洁环境经理: "site_living_area_manager",
  停车场运营经理: "parking_operation_manager",
  智能化运维工程师: "smart_weak_current_manager",
  开业联检总协调: "floor_supervision_engineer",
  试营业值班指挥官: "owner_pre_approval_officer",
  商户证照专员: "merchant_representative",
  导视美陈设计师: "wayfinding_design_lead",
  后勤收货协调人: "logistics_receiving_coordinator",
};

function profileIdForRow(row: Record<string, string>): string {
  const title = row["职务/身份"];
  const id = PROFILE_ID_BY_TITLE[title];
  if (id) return id;
  const excelId = row.NPC_ID;
  console.warn("Missing title map:", excelId, title);
  return excelId?.toLowerCase() || title;
}

/** @deprecated 仅作 title 映射缺失时的兜底 */
const NPC_ID_TO_PROFILE_ID: Record<string, string> = {
  NPC001: "owner_general_manager",
  NPC002: "owner_executive_leader",
  NPC003: "owner_project_director",
  NPC004: "owner_project_coordinator",
  NPC005: "owner_pre_approval_officer",
  NPC006: "owner_cost_contract_lead",
  NPC007: "owner_procurement_lead",
  NPC008: "owner_archive_manager",
  NPC009: "owner_finance_reviewer",
  NPC010: "owner_operation_prep_lead",
  NPC011: "legal_audit_liaison",
  NPC012: "contractor_project_manager",
  NPC013: "contractor_production_manager",
  NPC014: "contractor_technical_lead",
  NPC015: "contractor_safety_quality_lead",
  NPC016: "contractor_business_lead",
  NPC017: "contractor_material_equipment_lead",
  NPC018: "chief_supervisor",
  NPC019: "supervisor_engineer",
  NPC020: "supervisor_document_engineer",
  NPC021: "labor_realname_officer",
  NPC022: "team_coordination_lead",
  NPC023: "sample_disclosure_lead",
  NPC024: "bim_technical_lead",
  NPC025: "government_window_officer",
  NPC026: "dev_reform_window_officer",
  NPC027: "natural_resources_officer",
  NPC028: "housing_bureau_officer",
  NPC029: "quality_safety_station_officer",
  NPC030: "fire_design_review_officer",
  NPC031: "fire_acceptance_officer",
  NPC032: "civil_defense_window_officer",
  NPC033: "ecology_window_officer",
  NPC034: "water_drainage_window_officer",
  NPC035: "municipal_garden_window_officer",
  NPC036: "public_resource_center_officer",
  NPC037: "completion_filing_officer",
  NPC038: "design_lead",
  NPC039: "survey_unit_lead",
  NPC040: "drawing_review_lead",
  NPC041: "cost_consultant_lead",
  NPC042: "bidding_agent_lead",
  NPC043: "whole_process_consultant",
  NPC044: "engineering_supervisor_lead",
  NPC045: "material_testing_engineer",
  NPC046: "pile_foundation_testing_engineer",
  NPC047: "settlement_monitoring_engineer",
  NPC048: "fire_testing_engineer",
  NPC049: "environment_testing_engineer",
  NPC050: "green_building_consultant",
  NPC051: "survey_mapping_engineer",
  NPC052: "audit_settlement_officer",
  NPC053: "special_consultant",
  NPC054: "site_main_gate_officer",
  NPC055: "site_realname_officer",
  NPC056: "site_vehicle_wash_officer",
  NPC057: "site_temp_road_officer",
  NPC058: "site_fire_lane_officer",
  NPC059: "site_office_admin",
  NPC060: "site_living_area_manager",
  NPC061: "site_canteen_manager",
  NPC062: "site_medical_officer",
  NPC063: "site_rebar_processing_lead",
  NPC064: "site_carpentry_lead",
  NPC065: "site_mep_processing_lead",
  NPC066: "site_equipment_yard_manager",
  NPC067: "site_unloading_dispatcher",
  NPC068: "site_material_yard_manager",
  NPC069: "floor_construction_worker",
  NPC070: "floor_supervision_engineer",
  NPC071: "finishing_team_lead",
  NPC072: "site_safety_officer",
  NPC073: "mep_system_lead",
  NPC074: "fire_pump_room_engineer",
  NPC075: "hvac_room_engineer",
  NPC076: "atrium_operations_lead",
  NPC077: "outdoor_municipal_coordinator",
  NPC078: "temp_utilities_officer",
  NPC079: "parking_lot_manager",
  NPC080: "logistics_lane_coordinator",
  NPC081: "opening_leasing_manager",
  NPC082: "merchant_fitout_manager",
  NPC083: "second_fitout_admin",
  NPC084: "property_customer_manager",
  NPC085: "property_engineering_manager",
  NPC086: "fire_control_room_officer",
  NPC087: "security_roster_manager",
  NPC088: "parking_operation_manager",
  NPC089: "smart_weak_current_manager",
  NPC090: "wayfinding_design_lead",
  NPC091: "logistics_receiving_coordinator",
  NPC092: "merchant_representative",
  NPC093: "supplier_representative",
  NPC094: "subcontractor_lead",
  NPC095: "quality_supervision_officer",
};

const REGION_MAP: Record<string, string> = {
  业主: "owner_hub",
  业主中枢: "owner_hub",
  现场指挥区: "command_center",
  审批监管区: "approval_regulatory",
  专业服务区: "professional_service",
  施工现场: "construction_site",
  开业筹备: "opening_prep",
  开业筹备区: "opening_prep",
};

function inferRole(actionType: string, priority: number): string {
  const t = actionType || "";
  if (/拍板|主责|主线|最终|主持|主责管理|主责审核|主责办理|主责筹备|主责调度|生产执行|设计主责|监理主责|楼层施工|中庭管理|材料堆场|变配电|消防泵房|运营筹备|招商运营|物业工程/.test(t)) {
    return "primary";
  }
  if (/监管|审核|监督|验收|窗口|经办|备案|审图|检测|监测|实名制|消防通道|车辆冲洗|门岗|安保|消防控制/.test(t)) {
    return "regulator";
  }
  if (/阻力|冲突|博弈|审计风险|卡得|退回|敏感|临时/.test(t)) {
    return "blocker";
  }
  if (/临时|事件|突发/.test(t)) {
    return "temporary";
  }
  if (priority === 1) return "primary";
  if (priority === 2) return "support";
  if (priority >= 4) return "blocker";
  return "support";
}

function normalizePlace(value: string): string {
  return value.replace(/\s+/g, "").replace(/\/.*$/, "").trim();
}

function buildPlaceToLocationIdMap(): Map<string, string> {
  const map = new Map<string, string>();

  const register = (label: string, locationId: string) => {
    if (!label) return;
    map.set(label, locationId);
    map.set(normalizePlace(label), locationId);
  };

  for (const area of LOCATION_SANDTABLE_AREAS) {
    const locationId = area.relatedLocationSlugs?.[0] || area.id;
    register(area.name, locationId);

    const prefixes: Record<string, string[]> = {
      owner_hub: ["业主·"],
      command_center: ["项目部·"],
      construction_site: ["施工现场·", "机电·", "室外·", "楼栋·"],
      opening_prep: ["开业·"],
    };
    for (const prefix of prefixes[area.regionId] || []) {
      register(`${prefix}${area.name}`, locationId);
    }
  }

  for (const loc of MAP_LOCATION_SEED) {
    register(loc.name, loc.id);
    const shortName = loc.name.split("·").pop()?.trim() || loc.name;
    register(shortName, loc.id);
  }

  const manual: Record<string, string> = {
    "发改窗口 / 投资项目审批窗口": "area_dev_reform_window",
    "水务 / 排水接入窗口": "area_water_drainage_window",
    "市政园林 / 占道开口窗口": "area_municipal_garden_window",
    "桩基 / 基坑检测机构": "area_pile_foundation_testing",
    "沉降观测 / 基坑监测单位": "area_settlement_monitoring_unit",
    "节能 / 绿建咨询单位": "area_green_building_consultant",
    "施工现场·门卫实名制通道": "area_site_realname_channel",
    "施工现场·临电配电房": "area_site_temp_power",
    "施工现场·临水泵房": "area_site_temp_water",
    "施工现场·沉淀池 / 排水沟": "area_site_rain_sewage_pipe",
    "施工现场·安全体验区": "area_site_fire_lane",
    "施工现场·五牌一图展示区": "area_site_main_gate",
    "施工现场·现场办公室": "area_site_project_office_building",
    "施工现场·工人生活区": "area_site_worker_dorm",
    "施工现场·食堂": "area_site_canteen_market",
    "施工现场·医务 / 应急点": "area_site_medical_room",
    "施工现场·材料仓库": "area_site_material_yard",
    "施工现场·危化品库": "area_site_material_yard",
    "施工现场·幕墙材料堆场": "area_site_material_yard",
    "施工现场·精装材料堆场": "area_site_material_yard",
    "施工现场·周转材料堆场": "area_site_equipment_yard",
    "施工现场·垃圾集中堆放点": "area_site_unloading_zone",
    "施工现场·木工加工棚": "area_site_carpentry_processing",
    "施工现场·钢筋加工棚": "area_site_rebar_processing",
    "施工现场·机电加工区": "area_site_mep_processing",
    "施工现场·设备堆场": "area_site_equipment_yard",
    "施工现场·卸货区": "area_site_unloading_zone",
    "施工现场·车辆冲洗区": "area_site_vehicle_wash",
    "施工现场·临时道路": "area_site_temp_road",
    "施工现场·消防通道": "area_site_fire_lane",
    "施工现场·主大门": "area_site_main_gate",
    "施工现场·卫生间/浴室": "area_site_washroom_bath",
    "楼栋·首层 1F": "site_l1_commercial_street",
    "楼栋·地下一层 B1": "site_b1_mep_corridor",
    "楼栋·地下二层 B2": "area_site_b2",
    "楼栋·商业二层 2F": "area_site_2f",
    "楼栋·商业三层 3F": "area_site_3f",
    "楼栋·标准层": "area_site_5f",
    "楼栋·设备层": "area_site_b1",
    "楼栋·屋面层": "area_site_roof_floor",
    "楼栋·外立面": "area_site_atrium",
    "机电·消防泵房": "site_fire_pump_room",
    "机电·消防水泵房": "site_fire_pump_room",
    "室外·商业中庭": "site_atrium",
    "室外·材料堆场": "site_material_yard",
    "室外·停车场": "area_site_parking_lot",
    "室外·卸货区": "area_site_unloading_zone",
    "室外·后勤通道": "area_site_logistics_lane",
    "室外·垃圾房": "area_site_unloading_zone",
    "室外·景观广场": "area_site_atrium",
    "室外·消防车道": "area_site_fire_lane",
    "室外·燃气接驳点": "area_site_temp_power",
    "室外·电力接驳点": "area_site_temp_power",
    "室外·给水接驳点": "area_site_temp_water",
    "室外·通信接入点": "area_site_temp_power",
    "室外·雨污水管网": "area_site_rain_sewage_pipe",
    "保洁 / 环境管理办公室": "area_security_roster_room",
    "停车场管理中心": "area_parking_management_center",
    "后勤收货 / 垃圾清运协调点": "area_logistics_dispatch",
    "机电·水管井": "area_site_hvac_room",
    "机电·风管区": "area_site_hvac_room",
    "机电·柴油发电机房": "area_site_transformer_room",
    "机电·消防水池": "site_fire_pump_room",
    "机电·电梯机房": "area_site_hvac_room",
    "机电·生活水泵房": "area_site_hvac_room",
    安保指挥室: "area_security_roster_room",
  };

  for (let f = 4; f <= 10; f += 1) {
    manual[`楼栋·${f}F`] = `area_site_${f}f`;
  }

  Object.entries(manual).forEach(([k, v]) => register(k, v));

  // fuzzy: match by sandtable area name contained in Excel place label
  for (const area of LOCATION_SANDTABLE_AREAS) {
    const locationId = area.relatedLocationSlugs?.[0] || area.id;
    register(area.name, locationId);
  }

  return map;
}

function resolveLocationId(place: string, placeMap: Map<string, string>): string | undefined {
  if (placeMap.has(place)) return placeMap.get(place);
  const normalized = normalizePlace(place);
  if (placeMap.has(normalized)) return placeMap.get(normalized);

  for (const area of LOCATION_SANDTABLE_AREAS) {
    const locationId = area.relatedLocationSlugs?.[0] || area.id;
    if (place.includes(area.name) || area.name.includes(normalized)) {
      return locationId;
    }
  }
  return undefined;
}

function splitList(value: string): string[] {
  return (value || "")
    .split(/[、,，/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function main() {
  const wb = XLSX.readFile(XLSX_PATH);
  const profileRows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets["NPC角色库"], {
    defval: "",
  });
  const assignRows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets["NPC配置总表"], {
    defval: "",
  });

  const placeMap = buildPlaceToLocationIdMap();
  const unresolvedPlaces = new Set<string>();

  const excelNpcIdToProfileId: Record<string, string> = {};
  for (const row of profileRows) {
    excelNpcIdToProfileId[row.NPC_ID] = profileIdForRow(row);
  }

  const profiles = profileRows.map((row) => {
    const id = excelNpcIdToProfileId[row.NPC_ID];
    const organization = row["所属阵营/单位"];
    const orgPayload = getOrganizationPayload(organization);
    const helpsWith = splitList(row["可推动任务"]);
    const blocksWhen = splitList(row["可能制造阻力"]);
    const taskFunction = row["任务功能"] || row["核心诉求"] || row["职务/身份"];
    return {
      id,
      excelId: row.NPC_ID,
      name: row["NPC姓名"],
      title: row["职务/身份"],
      organization,
      faction: orgPayload.faction,
      level: row["基础等级"] || "B",
      residentRegion: row["常驻大区"],
      sandtableRegionId: REGION_MAP[row["常驻大区"]],
      description: taskFunction,
      personality: row["性格/立场"],
      agenda: row["核心诉求"],
      helpsWith,
      blocksWhen,
      payloadCategory: orgPayload.category,
      payloadType: orgPayload.type,
    };
  });

  const assignments: Array<Record<string, unknown>> = [];
  for (const row of assignRows) {
    const place = row["地点"];
    const locationId = resolveLocationId(place, placeMap);
    if (!locationId) {
      unresolvedPlaces.add(place);
      continue;
    }
    const excelNpcId = row.NPC_ID;
    const npcId = excelNpcIdToProfileId[excelNpcId] || NPC_ID_TO_PROFILE_ID[excelNpcId];
    if (!npcId) continue;
    const priority = Number(row["优先级"] || 3);
    assignments.push({
      locationId,
      npcId,
      level: row["NPC等级"] || "B",
      role: inferRole(row["作用类型"] || "", priority),
      regionId: REGION_MAP[row["大区"]] || undefined,
      note: row["剧情/事件钩子"] || undefined,
    });
  }

  if (unresolvedPlaces.size > 0) {
    console.warn("Unresolved places:", [...unresolvedPlaces].slice(0, 20), "count", unresolvedPlaces.size);
  }

  const regionDefaults = [
    { regionId: "owner_hub", npcIds: ["owner_project_director", "owner_project_coordinator"] },
    { regionId: "command_center", npcIds: ["contractor_project_manager", "chief_supervisor"] },
    {
      regionId: "approval_regulatory",
      npcIds: ["government_window_officer", "housing_bureau_officer"],
    },
    { regionId: "professional_service", npcIds: ["design_lead", "cost_consultant_lead"] },
    {
      regionId: "construction_site",
      npcIds: ["contractor_production_manager", "site_safety_officer", "floor_construction_worker"],
    },
    {
      regionId: "opening_prep",
      npcIds: ["owner_operation_prep_lead", "property_engineering_manager"],
    },
  ];

  const profilesTs = `import type { ProjectStageId } from "@/game/projectStages";
import type { LocationRegionId } from "@/game/locationSandtablePresentationEngine";

export type NpcFaction =
  | "owner"
  | "contractor"
  | "supervisor"
  | "government"
  | "consultant"
  | "supplier"
  | "merchant"
  | "property"
  | "labor"
  | "public"
  | "other";

export type NpcLevel = "S" | "A" | "B" | "C";

export type NpcProfile = {
  id: string;
  excelId: string;
  name: string;
  title: string;
  organization: string;
  faction: NpcFaction;
  level: NpcLevel;
  residentRegion: string;
  sandtableRegionId?: LocationRegionId;
  description: string;
  personality?: string;
  agenda?: string;
  helpsWith?: string[];
  blocksWhen?: string[];
  riskTags?: string[];
  appearStages?: ProjectStageId[];
  payloadCategory: string;
  payloadType: string;
};

/** 旧 MapLocation.relatedNpcNames → profile id */
export const LEGACY_NPC_NAME_ALIASES: Record<string, string> = {
  甲方代表: "owner_project_director",
  监理单位: "chief_supervisor",
  总承包单位: "contractor_project_manager",
  消防专家: "fire_pump_room_engineer",
  设计院: "design_lead",
  供应商: "supplier_representative",
  "商户/运营团队": "merchant_representative",
  物业公司: "property_engineering_manager",
  质监站: "quality_supervision_officer",
  专业分包: "subcontractor_lead",
};

export const NPC_PROFILES: NpcProfile[] = ${JSON.stringify(profiles, null, 2)};

export function getNpcProfileById(id: string): NpcProfile | undefined {
  return NPC_PROFILES.find((npc) => npc.id === id);
}

export function getNpcProfilesByIds(ids: string[]): NpcProfile[] {
  const map = new Map(NPC_PROFILES.map((npc) => [npc.id, npc]));
  return ids.map((id) => map.get(id)).filter(Boolean) as NpcProfile[];
}
`;

  const assignmentsTs = `import type { ProjectStageId } from "@/game/projectStages";
import type { LocationRegionId } from "@/game/locationSandtablePresentationEngine";
import type { NpcLevel } from "./npcProfiles";

export type LocationNpcRole =
  | "primary"
  | "support"
  | "regulator"
  | "blocker"
  | "temporary";

export type LocationNpcAssignment = {
  locationId: string;
  npcId: string;
  level: NpcLevel;
  role: LocationNpcRole;
  regionId?: LocationRegionId;
  zoneId?: string;
  appearStage?: ProjectStageId;
  taskHooks?: string[];
  eventHooks?: string[];
  note?: string;
};

export const LOCATION_NPC_ASSIGNMENTS: LocationNpcAssignment[] = ${JSON.stringify(assignments, null, 2)};

export function getNpcAssignmentsByLocationId(locationId: string): LocationNpcAssignment[] {
  return LOCATION_NPC_ASSIGNMENTS.filter((item) => item.locationId === locationId);
}
`;

  const defaultsTs = `import type { LocationRegionId } from "@/game/locationSandtablePresentationEngine";

export type RegionNpcDefault = {
  regionId: LocationRegionId;
  npcIds: string[];
};

export const REGION_NPC_DEFAULTS: RegionNpcDefault[] = ${JSON.stringify(regionDefaults, null, 2)};

export function getDefaultNpcIdsByRegion(regionId: LocationRegionId): string[] {
  return REGION_NPC_DEFAULTS.find((item) => item.regionId === regionId)?.npcIds ?? [];
}
`;

  fs.writeFileSync(path.join(ROOT, "src/data/npcProfiles.ts"), profilesTs, "utf8");
  fs.writeFileSync(path.join(ROOT, "src/data/locationNpcAssignments.ts"), assignmentsTs, "utf8");
  fs.writeFileSync(path.join(ROOT, "src/data/regionNpcDefaults.ts"), defaultsTs, "utf8");

  console.log(
    JSON.stringify(
      {
        profiles: profiles.length,
        assignments: assignments.length,
        unresolvedPlaces: unresolvedPlaces.size,
      },
      null,
      2,
    ),
  );
}

main();
