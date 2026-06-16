export type ProjectStageId =
  | "INITIATION"
  | "APPROVAL"
  | "DESIGN"
  | "PROCUREMENT"
  | "CONSTRUCTION"
  | "ACCEPTANCE"
  | "OPENING";

export type StageGateMetricRules = {
  latentRiskMax?: number;
  costPressureMax?: number;
  fireRiskMax?: number;
  safetyMin?: number;
  qualityMin?: number;
  dataIntegrityMin?: number;
  ownerTrustMin?: number;
  propertyHandoverMin?: number;
};

export type ProjectStageConfig = {
  id: ProjectStageId;
  name: string;
  description: string;
  weight: number;
  requiredMilestones: string[];
  requiredMetrics?: StageGateMetricRules;
  nextStage?: ProjectStageId;
};

export const PROJECT_STAGES: ProjectStageConfig[] = [
  {
    id: "INITIATION",
    name: "项目启动",
    description: "建立项目组织、明确建设目标、形成总控计划、建立资料台账。",
    weight: 5,
    requiredMilestones: [
      "projectOrgDone",
      "masterPlanDone",
      "riskRegisterDone",
      "documentLedgerDone",
    ],
    requiredMetrics: { latentRiskMax: 80, ownerTrustMin: 30 },
    nextStage: "APPROVAL",
  },
  {
    id: "APPROVAL",
    name: "前期报批",
    description: "推动立项、规划、审批、施工许可路径等前期手续。",
    weight: 10,
    requiredMilestones: [
      "approvalPathConfirmed",
      "planningConditionDone",
      "approvalDocsReady",
      "permitPlanDone",
    ],
    requiredMetrics: { latentRiskMax: 75, dataIntegrityMin: 35 },
    nextStage: "DESIGN",
  },
  {
    id: "DESIGN",
    name: "设计管理",
    description: "完成方案设计、施工图、图纸会审和主要设计问题闭合。",
    weight: 15,
    requiredMilestones: [
      "schemeDesignDone",
      "constructionDrawingDone",
      "drawingReviewDone",
      "designIssuesClosed",
    ],
    requiredMetrics: { latentRiskMax: 70, qualityMin: 40, dataIntegrityMin: 45 },
    nextStage: "PROCUREMENT",
  },
  {
    id: "PROCUREMENT",
    name: "招采合同",
    description: "完成控制价、招标文件、主要单位确定和合同边界梳理。",
    weight: 10,
    requiredMilestones: [
      "costEstimateDone",
      "tenderDocsDone",
      "mainContractorSelected",
      "contractBoundaryClear",
    ],
    requiredMetrics: { latentRiskMax: 75, ownerTrustMin: 40 },
    nextStage: "CONSTRUCTION",
  },
  {
    id: "CONSTRUCTION",
    name: "施工建设",
    description: "完成开工准备、主体施工、机电安装、装饰装修等施工推进。",
    weight: 40,
    requiredMilestones: [
      "startConditionReady",
      "mainStructureDone",
      "mepSystemDone",
      "decorationDone",
    ],
    requiredMetrics: {
      safetyMin: 45,
      qualityMin: 50,
      fireRiskMax: 75,
      latentRiskMax: 80,
    },
    nextStage: "ACCEPTANCE",
  },
  {
    id: "ACCEPTANCE",
    name: "验收移交",
    description: "完成消防验收、竣工验收、资料归档、物业移交和问题整改。",
    weight: 20,
    requiredMilestones: [
      "fireAcceptancePassed",
      "completionAccepted",
      "archiveCompleted",
      "propertyHandoverDone",
    ],
    requiredMetrics: {
      fireRiskMax: 40,
      dataIntegrityMin: 75,
      propertyHandoverMin: 60,
      qualityMin: 65,
      safetyMin: 60,
      latentRiskMax: 70,
    },
    nextStage: "OPENING",
  },
  {
    id: "OPENING",
    name: "开业结算",
    description: "根据最终项目指标生成结局评价。",
    weight: 0,
    requiredMilestones: [],
  },
];

export const MILESTONE_LABELS: Record<string, string> = {
  projectOrgDone: "项目组织架构完成",
  masterPlanDone: "总控计划完成",
  riskRegisterDone: "风险清单完成",
  documentLedgerDone: "资料台账建立",
  approvalPathConfirmed: "报批路径明确",
  planningConditionDone: "规划条件明确",
  approvalDocsReady: "报批资料齐备",
  permitPlanDone: "施工许可计划完成",
  schemeDesignDone: "方案设计完成",
  constructionDrawingDone: "施工图完成",
  drawingReviewDone: "图纸会审完成",
  designIssuesClosed: "设计问题闭合",
  costEstimateDone: "控制价完成",
  tenderDocsDone: "招标文件完成",
  mainContractorSelected: "主要单位确定",
  contractBoundaryClear: "合同边界明确",
  startConditionReady: "开工条件具备",
  mainStructureDone: "主体结构完成",
  mepSystemDone: "机电系统完成",
  decorationDone: "装饰装修完成",
  fireAcceptancePassed: "消防验收通过",
  completionAccepted: "竣工验收通过",
  archiveCompleted: "资料归档完成",
  propertyHandoverDone: "物业移交完成",
};

export const STAGE_GATE_STATUS_LABELS: Record<string, string> = {
  OPEN: "正常推进",
  BLOCKED: "被卡住",
  PASSED: "已通过",
};

const LEGACY_STAGE_MAP: Record<string, ProjectStageId> = {
  开业倒计时: "INITIATION",
  前期报批: "APPROVAL",
  设计管理: "DESIGN",
  招采合同: "PROCUREMENT",
  施工建设: "CONSTRUCTION",
  验收移交: "ACCEPTANCE",
  开业结算: "OPENING",
};

export function normalizeStageId(stageId?: string | null): ProjectStageId {
  if (!stageId) return "INITIATION";
  if (PROJECT_STAGES.some((stage) => stage.id === stageId)) {
    return stageId as ProjectStageId;
  }
  return LEGACY_STAGE_MAP[stageId] || "INITIATION";
}

export function getStageConfig(stageId?: string | null) {
  return PROJECT_STAGES.find((stage) => stage.id === normalizeStageId(stageId));
}

export const BUILD_STAGE_OPTIONS = PROJECT_STAGES.filter((stage) => stage.id !== "OPENING").map(
  (stage) => ({
    label: stage.name,
    value: stage.id,
  }),
);

export const RESOLUTION_MODE_OPTIONS = [
  { label: "单人任务 (SOLO)", value: "SOLO" },
  { label: "多人投票 (VOTE)", value: "VOTE" },
  { label: "岗位协作 (ROLE_CHECKLIST)", value: "ROLE_CHECKLIST" },
];
