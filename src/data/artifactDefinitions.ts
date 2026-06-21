import type { ArtifactDefinitionData } from "@/game/types";

export const STANDARD_ARTIFACT_STATUSES = [
  { status: "draft", label: "草稿" },
  { status: "in_review", label: "审核中" },
  { status: "confirmed", label: "已确认" },
  { status: "approved", label: "已批准" },
] as const;

export type StandardArtifactStatus = (typeof STANDARD_ARTIFACT_STATUSES)[number]["status"];

/** allowedStatuses 为空时使用标准状态集 */
export function resolveAllowedStatuses(
  definition: Pick<ArtifactDefinitionData, "allowedStatuses" | "defaultStatus">,
) {
  if (definition.allowedStatuses && definition.allowedStatuses.length > 0) {
    return definition.allowedStatuses;
  }
  return STANDARD_ARTIFACT_STATUSES.map((item) => ({ ...item }));
}

export function usesStandardStatusFallback(
  definition: Pick<ArtifactDefinitionData, "allowedStatuses">,
): boolean {
  return !definition.allowedStatuses?.length;
}

export function formatAllowedStatusLabel(
  definition: Pick<ArtifactDefinitionData, "allowedStatuses" | "defaultStatus">,
  status: string,
): string {
  const allowed = resolveAllowedStatuses(definition);
  return allowed.find((item) => item.status === status)?.label || status;
}

function artifact(
  slug: string,
  name: string,
  artifactType: ArtifactDefinitionData["artifactType"],
  stage: ArtifactDefinitionData["stage"],
  extra?: Partial<ArtifactDefinitionData>,
): ArtifactDefinitionData {
  return {
    slug,
    name,
    artifactType,
    stage,
    defaultStatus: "draft",
    allowedStatuses: STANDARD_ARTIFACT_STATUSES.map((item) => ({ ...item })),
    reusable: false,
    versioned: true,
    expires: 0,
    enabled: true,
    ...extra,
  };
}

/** INITIATION / APPROVAL 主线成果物，与 milestone 双轨对应 */
export const ARTIFACT_DEFINITIONS: ArtifactDefinitionData[] = [
  artifact("project_org_chart", "项目组织架构图", "document", "INITIATION", {
    description: "明确参建各方职责界面与汇报关系。",
    sourceLocationSlugs: ["owner_project_management_dept"],
    sourceNpcNames: ["甲方代表"],
    tags: ["组织", "启动"],
  }),
  artifact("master_plan_doc", "总控计划", "deliverable", "INITIATION", {
    description: "项目总控计划定稿，含关键节点与责任分工。",
    sourceLocationSlugs: ["owner_project_management_dept"],
    tags: ["计划", "进度"],
  }),
  artifact("risk_register", "风险台账", "report", "INITIATION", {
    description: "分级风险清单与应对责任人。",
    sourceLocationSlugs: ["owner_project_management_dept"],
    tags: ["风险"],
  }),
  artifact("document_ledger", "资料台账", "document", "INITIATION", {
    description: "竣工资料目录与归档追踪台账。",
    sourceLocationSlugs: ["owner_archive_room"],
    sourceNpcNames: ["监理单位"],
    tags: ["资料"],
  }),
  artifact("first_meeting_minutes", "首次协调会纪要", "report", "INITIATION", {
    description: "首次协调会结论与待办事项。",
    sourceLocationSlugs: ["owner_project_management_dept"],
    tags: ["协调"],
  }),
  artifact("approval_path_doc", "报批路径确认书", "decision", "APPROVAL", {
    description: "立项与报批路径书面确认。",
    sourceLocationSlugs: ["owner_project_management_dept"],
    tags: ["报批"],
  }),
  artifact("planning_condition_doc", "规划条件确认函", "permit", "APPROVAL", {
    description: "规划条件核实与书面确认。",
    tags: ["规划"],
  }),
  artifact("approval_docs_bundle", "报批资料包", "document", "APPROVAL", {
    description: "前期报批所需资料汇编。",
    tags: ["资料", "报批"],
  }),
  artifact("permit_plan_doc", "施工许可计划", "deliverable", "APPROVAL", {
    description: "施工许可办理路径与时间节点计划。",
    tags: ["许可"],
  }),

  // —— 建设项目主线一期（INITIATION） ——
  artifact("project_need_statement", "项目建设需求说明", "document", "INITIATION", {
    description: "明确建设规模、功能定位与建设必要性。",
    sourceLocationSlugs: ["owner_project_management_dept"],
    sourceNpcNames: ["甲方代表"],
    tags: ["启动", "需求"],
  }),
  artifact("kickoff_meeting_minutes", "项目启动会议纪要", "report", "INITIATION", {
    description: "项目启动会结论、待办与责任分工。",
    sourceLocationSlugs: ["project_meeting_room"],
    tags: ["启动", "会议"],
  }),
  artifact("project_scope_statement", "项目建设范围说明", "document", "INITIATION", {
    description: "建设范围、界面划分与交付边界。",
    sourceLocationSlugs: ["owner_project_management_dept"],
    tags: ["启动", "范围"],
  }),
  artifact("responsibility_matrix", "项目责任分工表", "document", "INITIATION", {
    description: "参建各方职责矩阵与联络机制。",
    sourceLocationSlugs: ["owner_project_management_dept"],
    tags: ["组织", "启动"],
  }),
  artifact("master_control_plan", "项目总控计划", "deliverable", "INITIATION", {
    description: "关键节点、里程碑与总控计划定稿。",
    sourceLocationSlugs: ["owner_project_management_dept"],
    tags: ["计划", "进度"],
  }),

  // —— 建设项目主线一期（APPROVAL） ——
  artifact("project_proposal", "项目建议书", "document", "APPROVAL", {
    description: "咨询单位编制的项目建议书。",
    sourceLocationSlugs: ["third_cost_consultant"],
    tags: ["报批", "立项"],
  }),
  artifact("feasibility_report", "可行性研究报告", "report", "APPROVAL", {
    description: "项目可行性研究与投资估算报告。",
    sourceLocationSlugs: ["third_cost_consultant"],
    tags: ["报批", "立项"],
  }),
  artifact("funding_source_statement", "资金来源说明", "document", "APPROVAL", {
    description: "建设资金来源与落实路径说明。",
    sourceLocationSlugs: ["owner_finance_dept"],
    tags: ["资金", "报批"],
  }),
  artifact("approval_application_package", "立项报批资料包", "document", "APPROVAL", {
    description: "立项审批所需资料汇编。",
    sourceLocationSlugs: ["owner_pre_approval_office", "gov_service_center"],
    tags: ["资料", "报批"],
  }),
  artifact("approval_reply", "立项批复", "permit", "APPROVAL", {
    description: "发改部门出具的立项批复文件。",
    sourceLocationSlugs: ["gov_service_center"],
    tags: ["批复", "立项"],
  }),
  artifact("planning_condition", "规划条件", "permit", "APPROVAL", {
    description: "自然资源部门核实的规划条件。",
    sourceLocationSlugs: ["gov_natural_resources"],
    tags: ["规划"],
  }),
  artifact("land_pre_review_opinion", "用地预审意见", "permit", "APPROVAL", {
    description: "用地预审与选址意见。",
    sourceLocationSlugs: ["gov_natural_resources"],
    tags: ["用地", "规划"],
  }),

  // —— 建设项目主线一期（DESIGN） ——
  artifact("scheme_design_text", "方案设计文本", "deliverable", "DESIGN", {
    description: "方案设计成果文本。",
    sourceLocationSlugs: ["third_design_institute"],
    tags: ["设计", "方案"],
  }),
  artifact("scheme_review_minutes", "方案审查会议纪要", "report", "DESIGN", {
    description: "方案审查会结论与修改意见。",
    sourceLocationSlugs: ["project_meeting_room"],
    tags: ["设计", "会议"],
  }),
  artifact("construction_drawing", "施工图", "deliverable", "DESIGN", {
    description: "施工图设计成果。",
    sourceLocationSlugs: ["third_design_institute"],
    tags: ["设计", "施工图"],
  }),
  artifact("drawing_review_certificate", "施工图审查合格书", "permit", "DESIGN", {
    description: "施工图审查机构出具的合格书。",
    sourceLocationSlugs: ["third_drawing_review_agency"],
    tags: ["审图", "设计"],
  }),

  // —— 建设项目主线一期（PROCUREMENT） ——
  artifact("bidding_plan", "招标采购计划", "document", "PROCUREMENT", {
    description: "招标采购总体计划与标段划分。",
    sourceLocationSlugs: ["owner_procurement_office"],
    tags: ["招采"],
  }),
  artifact("tender_document", "招标文件", "document", "PROCUREMENT", {
    description: "施工招标招标文件定稿。",
    sourceLocationSlugs: ["third_tendering_agency"],
    tags: ["招采", "招标"],
  }),
  artifact("bid_winning_notice", "中标通知书", "decision", "PROCUREMENT", {
    description: "招标人发出的中标通知书。",
    sourceLocationSlugs: ["third_tendering_agency"],
    tags: ["招采", "中标"],
  }),
  artifact("construction_contract", "施工合同", "document", "PROCUREMENT", {
    description: "施工总承包合同。",
    sourceLocationSlugs: ["owner_procurement_office"],
    tags: ["合同", "施工"],
  }),
  artifact("supervision_contract", "监理合同", "document", "PROCUREMENT", {
    description: "工程监理服务合同。",
    sourceLocationSlugs: ["owner_procurement_office"],
    tags: ["合同", "监理"],
  }),

  // —— 建设项目主线一期（CONSTRUCTION） ——
  artifact("quality_safety_supervision", "质量安全监督手续", "permit", "CONSTRUCTION", {
    description: "住建部门办理的质量安全监督手续。",
    sourceLocationSlugs: ["gov_housing_construction"],
    tags: ["许可", "质安"],
  }),
  artifact("funding_certificate", "建设资金落实证明", "document", "CONSTRUCTION", {
    description: "建设资金已落实的证明文件。",
    sourceLocationSlugs: ["owner_finance_dept"],
    tags: ["资金", "许可"],
  }),
  artifact("construction_permit", "施工许可证", "permit", "CONSTRUCTION", {
    description: "住房城乡建设主管部门核发的施工许可证。",
    sourceLocationSlugs: ["gov_housing_construction"],
    tags: ["许可", "施工"],
  }),
];

export function getStaticArtifactDefinitionBySlug(slug: string): ArtifactDefinitionData | undefined {
  return ARTIFACT_DEFINITIONS.find((item) => item.slug === slug);
}
