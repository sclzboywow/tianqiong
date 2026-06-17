export type MapNodePosition = { x: number; y: number };

/** 第一版固定坐标；未配置的地点按 group 自动追加排列 */
export const LOCATION_NODE_POSITIONS: Record<string, MapNodePosition> = {
  owner_gm_office: { x: 0, y: 0 },
  owner_project_management_dept: { x: 240, y: 0 },
  owner_pre_approval_office: { x: 480, y: 0 },
  owner_archive_room: { x: 720, y: 0 },
  owner_leader_office: { x: 960, y: 0 },
  owner_cost_contract_dept: { x: 0, y: 120 },
  owner_procurement_office: { x: 240, y: 120 },
  owner_finance_dept: { x: 480, y: 120 },
  owner_legal_audit_dept: { x: 720, y: 120 },
  owner_operation_prep_office: { x: 960, y: 120 },

  gov_service_center: { x: 0, y: 220 },
  gov_natural_resources: { x: 240, y: 220 },
  gov_housing_construction: { x: 480, y: 220 },

  project_meeting_room: { x: 0, y: 440 },
  project_document_room: { x: 240, y: 440 },

  third_design_institute: { x: 0, y: 660 },
  third_cost_consultant: { x: 240, y: 660 },
  third_testing_center: { x: 480, y: 660 },

  site_l1_commercial_street: { x: 0, y: 880 },
  site_fire_pump_room: { x: 240, y: 880 },
  site_atrium: { x: 480, y: 880 },
  site_material_yard: { x: 720, y: 880 },
  site_b1_mep_corridor: { x: 960, y: 880 },
  site_property_handover: { x: 1200, y: 880 },
};

const GROUP_ROW_BASE: Record<string, number> = {
  建设主体: 0,
  政府单位: 220,
  项目部: 440,
  第三方机构: 660,
  施工现场: 880,
};

export type MapGroupHeaderDef = {
  id: string;
  label: string;
  position: MapNodePosition;
};

/** 地图分区标题节点（不可点击、不参与连线） */
export const MAP_GROUP_HEADER_DEFS: MapGroupHeaderDef[] = [
  { id: "map-group-owner", label: "建设主体", position: { x: 0, y: -55 } },
  { id: "map-group-gov", label: "政府单位", position: { x: 0, y: 165 } },
  { id: "map-group-project", label: "项目部", position: { x: 0, y: 385 } },
  { id: "map-group-third", label: "第三方机构", position: { x: 0, y: 605 } },
  { id: "map-group-site", label: "施工现场", position: { x: 0, y: 825 } },
];

export type ProjectMapEdgeDef = {
  id: string;
  source: string;
  target: string;
  type?: "smoothstep";
};

/** 主关系连线（缺失 locationId 时构建阶段会跳过） */
export const PROJECT_MAP_EDGE_DEFS: ProjectMapEdgeDef[] = [
  { id: "e-owner-gov", source: "owner_project_management_dept", target: "gov_service_center" },
  { id: "e-gov-nr", source: "gov_service_center", target: "gov_natural_resources" },
  { id: "e-gov-hc", source: "gov_service_center", target: "gov_housing_construction" },
  { id: "e-owner-meeting", source: "owner_project_management_dept", target: "project_meeting_room" },
  { id: "e-meeting-design", source: "project_meeting_room", target: "third_design_institute" },
  { id: "e-design-b1", source: "third_design_institute", target: "site_b1_mep_corridor" },
  { id: "e-hc-fire", source: "gov_housing_construction", target: "site_fire_pump_room" },
  { id: "e-hc-handover", source: "gov_housing_construction", target: "site_property_handover" },
  { id: "e-meeting-l1", source: "project_meeting_room", target: "site_l1_commercial_street" },
  { id: "e-meeting-fire", source: "project_meeting_room", target: "site_fire_pump_room" },
  { id: "e-meeting-atrium", source: "project_meeting_room", target: "site_atrium" },
  { id: "e-meeting-yard", source: "project_meeting_room", target: "site_material_yard" },
  { id: "e-meeting-b1", source: "project_meeting_room", target: "site_b1_mep_corridor" },
  { id: "e-meeting-handover", source: "project_meeting_room", target: "site_property_handover" },
];

export function resolveNodePosition(
  locationId: string,
  group: string,
  indexInGroup: number,
): MapNodePosition {
  const preset = LOCATION_NODE_POSITIONS[locationId];
  if (preset) return preset;

  const baseY = GROUP_ROW_BASE[group] ?? 1040;
  const col = indexInGroup % 5;
  const row = Math.floor(indexInGroup / 5);
  return { x: col * 240, y: baseY + row * 110 };
}

export function buildValidEdges(locationIds: Set<string>): ProjectMapEdgeDef[] {
  return PROJECT_MAP_EDGE_DEFS.filter(
    (edge) => locationIds.has(edge.source) && locationIds.has(edge.target),
  ).map((edge) => ({ ...edge, type: "smoothstep" as const }));
}
