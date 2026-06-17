export type MapNodePosition = { x: number; y: number };

/** 一核四区固定坐标；未配置的地点按 group 自动追加排列 */
export const LOCATION_NODE_POSITIONS: Record<string, MapNodePosition> = {
  // 建设主体 / 内部管理区
  owner_gm_office: { x: 260, y: 0 },
  owner_leader_office: { x: 500, y: 0 },
  owner_project_management_dept: { x: 740, y: 0 },
  owner_pre_approval_office: { x: 980, y: 0 },

  owner_cost_contract_dept: { x: 260, y: 130 },
  owner_procurement_office: { x: 500, y: 130 },
  owner_finance_dept: { x: 740, y: 130 },
  owner_legal_audit_dept: { x: 980, y: 130 },
  owner_archive_room: { x: 1220, y: 130 },
  owner_operation_prep_office: { x: 1460, y: 130 },

  // 项目部 / 协调中枢
  project_meeting_room: { x: 740, y: 320 },
  project_document_room: { x: 980, y: 320 },

  // 政府审批线
  gov_service_center: { x: 1280, y: 320 },
  gov_natural_resources: { x: 1280, y: 450 },
  gov_housing_construction: { x: 1280, y: 580 },

  // 第三方服务线
  third_design_institute: { x: 260, y: 500 },
  third_cost_consultant: { x: 500, y: 500 },
  third_testing_center: { x: 740, y: 500 },

  // 施工现场区（2 行 3 列）
  site_l1_commercial_street: { x: 860, y: 720 },
  site_atrium: { x: 1100, y: 720 },
  site_fire_pump_room: { x: 1340, y: 720 },

  site_material_yard: { x: 860, y: 850 },
  site_b1_mep_corridor: { x: 1100, y: 850 },
  site_property_handover: { x: 1340, y: 850 },
};

const GROUP_ROW_BASE: Record<string, number> = {
  建设主体: 0,
  项目部: 320,
  政府单位: 320,
  第三方机构: 500,
  施工现场: 720,
};

export type MapGroupHeaderDef = {
  id: string;
  label: string;
  position: MapNodePosition;
};

/** 地图分区标题节点（不可点击、不参与连线） */
export const MAP_GROUP_HEADER_DEFS: MapGroupHeaderDef[] = [
  { id: "map-group-owner", label: "建设主体 / 内部管理区", position: { x: 260, y: -55 } },
  { id: "map-group-project", label: "项目部 / 协调中枢", position: { x: 740, y: 265 } },
  { id: "map-group-gov", label: "政府审批线", position: { x: 1280, y: 265 } },
  { id: "map-group-third", label: "第三方服务线", position: { x: 260, y: 445 } },
  { id: "map-group-site", label: "施工现场区", position: { x: 860, y: 665 } },
];

export type ProjectMapEdgeDef = {
  id: string;
  source: string;
  target: string;
  type?: "smoothstep";
};

/** 主干关系连线（缺失 locationId 时构建阶段会跳过） */
export const PROJECT_MAP_EDGE_DEFS: ProjectMapEdgeDef[] = [
  { id: "e-pm-meeting", source: "owner_project_management_dept", target: "project_meeting_room" },
  { id: "e-pm-preapproval", source: "owner_project_management_dept", target: "owner_pre_approval_office" },
  { id: "e-preapproval-gov", source: "owner_pre_approval_office", target: "gov_service_center" },
  { id: "e-gov-nr", source: "gov_service_center", target: "gov_natural_resources" },
  { id: "e-gov-hc", source: "gov_service_center", target: "gov_housing_construction" },
  { id: "e-meeting-doc", source: "project_meeting_room", target: "project_document_room" },
  { id: "e-meeting-design", source: "project_meeting_room", target: "third_design_institute" },
  { id: "e-meeting-l1", source: "project_meeting_room", target: "site_l1_commercial_street" },
  { id: "e-design-b1", source: "third_design_institute", target: "site_b1_mep_corridor" },
  { id: "e-hc-fire", source: "gov_housing_construction", target: "site_fire_pump_room" },
  { id: "e-hc-handover", source: "gov_housing_construction", target: "site_property_handover" },
];

export function resolveNodePosition(
  locationId: string,
  group: string,
  indexInGroup: number,
): MapNodePosition {
  const preset = LOCATION_NODE_POSITIONS[locationId];
  if (preset) return preset;

  const baseY = GROUP_ROW_BASE[group] ?? 980;
  const col = indexInGroup % 3;
  const row = Math.floor(indexInGroup / 3);
  return { x: 260 + col * 240, y: baseY + row * 130 };
}

export function buildValidEdges(locationIds: Set<string>): ProjectMapEdgeDef[] {
  return PROJECT_MAP_EDGE_DEFS.filter(
    (edge) => locationIds.has(edge.source) && locationIds.has(edge.target),
  ).map((edge) => ({ ...edge, type: "smoothstep" as const }));
}
