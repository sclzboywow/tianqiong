import type { TaskTemplateData } from "@/game/types";
import type { ProjectStageId } from "@/game/projectStages";
import type { ArtifactEffect, ArtifactRequirement } from "@/game/types";

const MAINLINE_FAIL_EFFECTS = { latentRisk: 5, ownerTrust: -2, stageProgress: -5 };

const MAINLINE_CHOICE_EFFECTS = {
  steady_push: { dataIntegrity: 2, latentRisk: -2, ownerTrust: 1 },
  fast_push: { stageProgress: 3, progress: 1, latentRisk: 3 },
  delay_coord: { latentRisk: 4, ownerTrust: -1, stageProgress: -2 },
};

type InkKind = "document" | "meeting" | "submit" | "correction";

const INK_FILES: Record<InkKind, string> = {
  document: "project_document_task",
  meeting: "project_meeting_task",
  submit: "project_submit_review_task",
  correction: "project_correction_task",
};

function art(slug: string, status: string): ArtifactEffect {
  return { artifactSlug: slug, status };
}

function req(slug: string, minStatus: string): ArtifactRequirement {
  return { artifactSlug: slug, minStatus };
}

const MAINLINE_STAGE_PROGRESS: Record<string, number> = {
  // INITIATION（34 + 33 + 33 = 100）
  confirm_project_need: 34,
  hold_project_kickoff_meeting: 33,
  prepare_master_control_plan: 33,
  // APPROVAL（13×4 + 12×4 = 100）
  commission_project_proposal: 13,
  prepare_funding_source_statement: 13,
  prepare_feasibility_report: 13,
  prepare_approval_application_package: 12,
  submit_approval_application: 12,
  obtain_approval_reply: 13,
  consult_planning_condition: 12,
  obtain_land_pre_review_opinion: 12,
  // DESIGN（25 × 4 = 100）
  organize_scheme_design: 25,
  hold_scheme_review_meeting: 25,
  prepare_construction_drawing: 25,
  submit_drawing_review: 25,
  // PROCUREMENT（17×4 + 16×2 = 100）
  prepare_bidding_plan: 17,
  prepare_tender_document: 17,
  approve_tender_document: 17,
  issue_bid_winning_notice: 17,
  sign_construction_contract: 16,
  sign_supervision_contract: 16,
  // CONSTRUCTION 一期（34 + 33 + 33 = 100）
  prepare_quality_safety_supervision: 34,
  prepare_funding_certificate: 33,
  submit_construction_permit_application: 33,
};

function constructionMainlineTask(
  slug: string,
  title: string,
  stage: ProjectStageId,
  inkKind: InkKind,
  extra: Partial<TaskTemplateData> = {},
): TaskTemplateData {
  const { successEffects: extraSuccessEffects, ...restExtra } = extra;
  const isCorrection = restExtra.category === "correction";
  const stageProgress =
    extraSuccessEffects?.stageProgress ??
    MAINLINE_STAGE_PROGRESS[slug] ??
    (isCorrection ? 10 : 20);

  return {
    slug,
    title,
    stage,
    rarity: "R",
    sourceType: "system",
    sourceName: restExtra.sourceName,
    area: restExtra.area || "项目管理部",
    category: restExtra.category || "mainline",
    requiredJobs: ["DOCUMENT_ASSISTANT", "CONSTRUCTION_ASSISTANT"],
    resolutionMode: "SOLO",
    inkFile: INK_FILES[inkKind],
    storySlug: `story_${slug}`,
    baseSuccessRate: 65,
    choiceEffects: MAINLINE_CHOICE_EFFECTS,
    successEffects: {
      stageProgress,
      dataIntegrity: 2,
      ownerTrust: 1,
      ...extraSuccessEffects,
    },
    failEffects: MAINLINE_FAIL_EFFECTS,
    blockPolicy: "hard_block",
    ...restExtra,
  };
}

/** 24 主线 + 6 补正任务 */
export const CONSTRUCTION_PROJECT_MAINLINE_TASKS: TaskTemplateData[] = [
  // —— INITIATION ——
  constructionMainlineTask(
    "confirm_project_need",
    "明确项目建设需求",
    "INITIATION",
    "document",
    {
      area: "项目管理部",
      sourceName: "林知远",
      description: "梳理建设规模、功能定位与建设必要性，形成需求说明。",
      milestoneEffects: { projectOrgDone: true },
      outputArtifacts: [art("project_need_statement", "confirmed")],
    },
  ),
  constructionMainlineTask(
    "hold_project_kickoff_meeting",
    "召开项目启动会",
    "INITIATION",
    "meeting",
    {
      area: "综合会议室",
      sourceName: "甲方代表",
      description: "组织参建各方启动会，明确责任分工与协作机制。",
      inputArtifacts: [req("project_need_statement", "confirmed")],
      outputArtifacts: [
        art("kickoff_meeting_minutes", "confirmed"),
        art("responsibility_matrix", "confirmed"),
      ],
    },
  ),
  constructionMainlineTask(
    "prepare_master_control_plan",
    "编制项目总控计划",
    "INITIATION",
    "document",
    {
      area: "项目管理部",
      sourceName: "林知远",
      description: "编制总控计划、资料台账与风险台账。",
      inputArtifacts: [
        req("kickoff_meeting_minutes", "confirmed"),
        req("responsibility_matrix", "confirmed"),
      ],
      milestoneEffects: {
        masterPlanDone: true,
        riskRegisterDone: true,
        documentLedgerDone: true,
      },
      outputArtifacts: [
        art("master_control_plan", "confirmed"),
        art("document_ledger", "confirmed"),
        art("risk_register", "confirmed"),
      ],
    },
  ),

  // —— APPROVAL ——
  constructionMainlineTask(
    "commission_project_proposal",
    "委托咨询单位编制项目建议书",
    "APPROVAL",
    "document",
    {
      area: "造价咨询公司",
      sourceName: "甲方代表",
      inputArtifacts: [
        req("project_need_statement", "confirmed"),
        req("master_control_plan", "confirmed"),
      ],
      milestoneEffects: { approvalPathConfirmed: true },
      outputArtifacts: [art("project_proposal", "confirmed")],
    },
  ),
  constructionMainlineTask(
    "prepare_funding_source_statement",
    "准备资金来源说明",
    "APPROVAL",
    "document",
    {
      area: "财务资金部",
      sourceName: "甲方代表",
      inputArtifacts: [req("project_need_statement", "confirmed")],
      outputArtifacts: [art("funding_source_statement", "confirmed")],
    },
  ),
  constructionMainlineTask(
    "prepare_feasibility_report",
    "编制可行性研究报告",
    "APPROVAL",
    "document",
    {
      area: "造价咨询公司",
      sourceName: "甲方代表",
      inputArtifacts: [
        req("project_proposal", "confirmed"),
        req("funding_source_statement", "confirmed"),
      ],
      outputArtifacts: [art("feasibility_report", "confirmed")],
    },
  ),
  constructionMainlineTask(
    "prepare_approval_application_package",
    "组卷立项报批资料",
    "APPROVAL",
    "document",
    {
      area: "前期手续办公室",
      sourceName: "甲方代表",
      inputArtifacts: [
        req("feasibility_report", "confirmed"),
        req("funding_source_statement", "confirmed"),
        req("document_ledger", "confirmed"),
      ],
      outputArtifacts: [art("approval_application_package", "in_review")],
    },
  ),
  constructionMainlineTask(
    "submit_approval_application",
    "提交发改部门立项审批",
    "APPROVAL",
    "submit",
    {
      area: "发改窗口",
      sourceName: "甲方代表",
      inputArtifacts: [req("approval_application_package", "in_review")],
      outputArtifacts: [art("approval_application_package", "confirmed")],
    },
  ),
  constructionMainlineTask(
    "obtain_approval_reply",
    "取得立项批复",
    "APPROVAL",
    "submit",
    {
      area: "政务服务中心",
      sourceName: "甲方代表",
      inputArtifacts: [req("approval_application_package", "confirmed")],
      milestoneEffects: { approvalDocsReady: true },
      outputArtifacts: [art("approval_reply", "approved")],
    },
  ),
  constructionMainlineTask(
    "consult_planning_condition",
    "咨询规划条件",
    "APPROVAL",
    "submit",
    {
      area: "自然资源和规划局",
      sourceName: "甲方代表",
      inputArtifacts: [req("approval_reply", "approved")],
      milestoneEffects: { planningConditionDone: true },
      outputArtifacts: [art("planning_condition", "confirmed")],
    },
  ),
  constructionMainlineTask(
    "obtain_land_pre_review_opinion",
    "办理用地预审意见",
    "APPROVAL",
    "submit",
    {
      area: "自然资源和规划局",
      sourceName: "甲方代表",
      inputArtifacts: [
        req("approval_reply", "approved"),
        req("planning_condition", "confirmed"),
      ],
      outputArtifacts: [art("land_pre_review_opinion", "confirmed")],
    },
  ),

  // —— DESIGN ——
  constructionMainlineTask(
    "organize_scheme_design",
    "组织方案设计",
    "DESIGN",
    "document",
    {
      area: "设计院",
      sourceName: "设计院",
      inputArtifacts: [
        req("approval_reply", "approved"),
        req("planning_condition", "confirmed"),
      ],
      outputArtifacts: [art("scheme_design_text", "in_review")],
    },
  ),
  constructionMainlineTask(
    "hold_scheme_review_meeting",
    "召开方案审查会",
    "DESIGN",
    "meeting",
    {
      area: "综合会议室",
      sourceName: "甲方代表",
      inputArtifacts: [req("scheme_design_text", "in_review")],
      milestoneEffects: { schemeDesignDone: true },
      outputArtifacts: [
        art("scheme_review_minutes", "confirmed"),
        art("scheme_design_text", "confirmed"),
      ],
    },
  ),
  constructionMainlineTask(
    "prepare_construction_drawing",
    "组织施工图设计",
    "DESIGN",
    "document",
    {
      area: "设计院",
      sourceName: "设计院",
      inputArtifacts: [
        req("scheme_design_text", "confirmed"),
        req("scheme_review_minutes", "confirmed"),
      ],
      milestoneEffects: { constructionDrawingDone: true },
      outputArtifacts: [art("construction_drawing", "in_review")],
    },
  ),
  constructionMainlineTask(
    "submit_drawing_review",
    "提交施工图审查",
    "DESIGN",
    "submit",
    {
      area: "施工图审查机构",
      sourceName: "甲方代表",
      inputArtifacts: [req("construction_drawing", "in_review")],
      milestoneEffects: { drawingReviewDone: true, designIssuesClosed: true },
      outputArtifacts: [art("drawing_review_certificate", "approved")],
    },
  ),

  // —— PROCUREMENT ——
  constructionMainlineTask(
    "prepare_bidding_plan",
    "编制招标采购计划",
    "PROCUREMENT",
    "document",
    {
      area: "招采办公室",
      sourceName: "甲方代表",
      inputArtifacts: [
        req("approval_reply", "approved"),
        req("master_control_plan", "confirmed"),
      ],
      milestoneEffects: { costEstimateDone: true },
      outputArtifacts: [art("bidding_plan", "confirmed")],
    },
  ),
  constructionMainlineTask(
    "prepare_tender_document",
    "编制招标文件",
    "PROCUREMENT",
    "document",
    {
      area: "招标代理公司",
      sourceName: "甲方代表",
      inputArtifacts: [
        req("bidding_plan", "confirmed"),
        req("construction_drawing", "in_review"),
      ],
      outputArtifacts: [art("tender_document", "in_review")],
    },
  ),
  constructionMainlineTask(
    "approve_tender_document",
    "完成招标文件审定",
    "PROCUREMENT",
    "document",
    {
      area: "招标代理公司",
      sourceName: "甲方代表",
      inputArtifacts: [req("tender_document", "in_review")],
      milestoneEffects: { tenderDocsDone: true },
      outputArtifacts: [art("tender_document", "approved")],
    },
  ),
  constructionMainlineTask(
    "issue_bid_winning_notice",
    "发出中标通知书",
    "PROCUREMENT",
    "submit",
    {
      area: "招标代理公司",
      sourceName: "甲方代表",
      inputArtifacts: [req("tender_document", "approved")],
      milestoneEffects: { mainContractorSelected: true },
      outputArtifacts: [art("bid_winning_notice", "approved")],
    },
  ),
  constructionMainlineTask(
    "sign_construction_contract",
    "签订施工合同",
    "PROCUREMENT",
    "document",
    {
      area: "招采办公室",
      sourceName: "甲方代表",
      inputArtifacts: [req("bid_winning_notice", "approved")],
      milestoneEffects: { contractBoundaryClear: true },
      outputArtifacts: [art("construction_contract", "confirmed")],
    },
  ),
  constructionMainlineTask(
    "sign_supervision_contract",
    "签订监理合同",
    "PROCUREMENT",
    "document",
    {
      area: "招采办公室",
      sourceName: "甲方代表",
      inputArtifacts: [req("bidding_plan", "confirmed")],
      outputArtifacts: [art("supervision_contract", "confirmed")],
    },
  ),

  // —— CONSTRUCTION ——
  constructionMainlineTask(
    "prepare_quality_safety_supervision",
    "办理质量安全监督手续",
    "CONSTRUCTION",
    "submit",
    {
      area: "住房城乡建设局",
      sourceName: "甲方代表",
      inputArtifacts: [
        req("construction_contract", "confirmed"),
        req("supervision_contract", "confirmed"),
        req("drawing_review_certificate", "approved"),
      ],
      outputArtifacts: [art("quality_safety_supervision", "approved")],
    },
  ),
  constructionMainlineTask(
    "prepare_funding_certificate",
    "出具建设资金落实证明",
    "CONSTRUCTION",
    "document",
    {
      area: "财务资金部",
      sourceName: "甲方代表",
      inputArtifacts: [
        req("funding_source_statement", "confirmed"),
        req("construction_contract", "confirmed"),
      ],
      outputArtifacts: [art("funding_certificate", "confirmed")],
    },
  ),
  constructionMainlineTask(
    "submit_construction_permit_application",
    "提交施工许可申请",
    "CONSTRUCTION",
    "submit",
    {
      area: "住房城乡建设局",
      sourceName: "甲方代表",
      description: "向住建部门提交施工许可申请，取得施工许可证。",
      inputArtifacts: [
        req("approval_reply", "approved"),
        req("planning_condition", "confirmed"),
        req("drawing_review_certificate", "approved"),
        req("construction_contract", "confirmed"),
        req("supervision_contract", "confirmed"),
        req("quality_safety_supervision", "approved"),
        req("funding_certificate", "confirmed"),
      ],
      milestoneEffects: { permitPlanDone: true },
      outputArtifacts: [art("construction_permit", "approved")],
      triggerBroadcast: true,
    },
  ),

  // —— 补正任务（事件触发） ——
  constructionMainlineTask(
    "supplement_approval_application_package",
    "补充立项报批资料",
    "APPROVAL",
    "correction",
    {
      area: "前期手续办公室",
      category: "correction",
      inputArtifacts: [req("approval_application_package", "draft")],
      outputArtifacts: [art("approval_application_package", "in_review")],
    },
  ),
  constructionMainlineTask(
    "revise_funding_source_statement",
    "修订资金来源说明",
    "APPROVAL",
    "correction",
    {
      area: "财务资金部",
      category: "correction",
      inputArtifacts: [req("funding_source_statement", "draft")],
      outputArtifacts: [art("funding_source_statement", "confirmed")],
    },
  ),
  constructionMainlineTask(
    "coordinate_planning_condition_issue",
    "协调规划条件问题",
    "APPROVAL",
    "correction",
    {
      area: "自然资源和规划局",
      category: "correction",
      inputArtifacts: [req("planning_condition", "in_review")],
      outputArtifacts: [art("planning_condition", "confirmed")],
    },
  ),
  constructionMainlineTask(
    "revise_scheme_design_text",
    "修改方案设计文本",
    "DESIGN",
    "correction",
    {
      area: "设计院",
      category: "correction",
      inputArtifacts: [req("scheme_design_text", "draft")],
      milestoneEffects: { designIssuesClosed: true },
      outputArtifacts: [art("scheme_design_text", "in_review")],
    },
  ),
  constructionMainlineTask(
    "revise_construction_drawing",
    "修改施工图",
    "DESIGN",
    "correction",
    {
      area: "设计院",
      category: "correction",
      inputArtifacts: [req("construction_drawing", "draft")],
      outputArtifacts: [art("construction_drawing", "in_review")],
    },
  ),
  constructionMainlineTask(
    "supplement_construction_permit_materials",
    "补充施工许可材料",
    "CONSTRUCTION",
    "correction",
    {
      area: "住房城乡建设局",
      category: "correction",
      inputArtifacts: [req("construction_permit", "draft")],
      outputArtifacts: [art("construction_permit", "in_review")],
    },
  ),
];

export const CONSTRUCTION_MAINLINE_TASK_SLUGS = CONSTRUCTION_PROJECT_MAINLINE_TASKS.filter(
  (task) => task.category === "mainline",
).map((task) => task.slug);

export const CONSTRUCTION_PROJECT_MAINLINE_TASK_SLUGS = CONSTRUCTION_PROJECT_MAINLINE_TASKS.map(
  (task) => task.slug,
);
