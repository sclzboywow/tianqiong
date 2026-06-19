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

const STANDARD_STATUSES = STANDARD_ARTIFACT_STATUSES;

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
];

export function getStaticArtifactDefinitionBySlug(slug: string): ArtifactDefinitionData | undefined {
  return ARTIFACT_DEFINITIONS.find((item) => item.slug === slug);
}
