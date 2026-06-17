/**
 * 职业阶位与专业方向 smoke test
 * 运行：npm run test:career
 */
import {
  buildCareerRankView,
  getCareerProgressContext,
  getCareerPromotionRequirements,
  getCurrentCareerRank,
  getNextCareerRank,
  type CareerProjectInput,
  type CareerTaskInput,
  type CareerUserInput,
} from "../src/game/careerRankEngine";
import { inferCareerTrackFromJob } from "../src/game/careerTrackConfig";

function log(step: string, ok: boolean, detail?: string) {
  console.log(`${ok ? "✓" : "✗"} ${step}${detail ? ` — ${detail}` : ""}`);
}

function baseProject(overrides: Partial<CareerProjectInput> = {}): CareerProjectInput {
  return {
    milestones: "{}",
    dataIntegrity: 35,
    latentRisk: 20,
    currentStage: "INITIATION",
    ...overrides,
  };
}

function mainlineTasks(
  userId: string,
  slugs: string[],
  status: "COMPLETED" | "FAILED" = "COMPLETED",
): CareerTaskInput[] {
  return slugs.map((templateId) => ({
    templateId,
    status,
    participants: [{ userId, choiceId: "steady_push" }],
  }));
}

function user(overrides: Partial<CareerUserInput> = {}): CareerUserInput {
  return {
    id: "user-1",
    level: 1,
    reputation: 0,
    job: "DOCUMENT_ASSISTANT",
    ...overrides,
  };
}

function main() {
  console.log("\n=== 职业阶位 smoke test ===\n");
  let failed = 0;

  // 1. Lv1 → 项目新人
  {
    const u = user({ level: 1, reputation: 0 });
    const rank = getCurrentCareerRank(u, baseProject(), []);
    const ok = rank.id === "project_rookie";
    log("1. Lv1 用户为项目新人", ok, rank.title);
    if (!ok) failed += 1;
  }

  // 2. Lv2 + 1 主线 → 项目助理
  {
    const u = user({ level: 2, reputation: 5 });
    const tasks = mainlineTasks(u.id, ["setup_project_team"]);
    const rank = getCurrentCareerRank(u, baseProject(), tasks);
    const ok = rank.id === "project_assistant";
    log("2. Lv2 + 完成 1 个主线 → 项目助理", ok, rank.title);
    if (!ok) failed += 1;
  }

  // 3. Lv3 + 声望 15 + projectOrgDone + 2 主线 → 现场协调员
  {
    const u = user({ level: 3, reputation: 15 });
    const project = baseProject({
      milestones: JSON.stringify({ projectOrgDone: true }),
    });
    const tasks = mainlineTasks(u.id, ["setup_project_team", "prepare_master_plan"]);
    const rank = getCurrentCareerRank(u, project, tasks);
    const ok = rank.id === "site_coordinator";
    log("3. Lv3 + 声望 15 + projectOrgDone + 2 主线 → 现场协调员", ok, rank.title);
    if (!ok) failed += 1;
  }

  // 4. Lv4 + 声望 25 + 3 主线 + riskRegisterDone → 专项负责人
  {
    const u = user({ level: 4, reputation: 25 });
    const project = baseProject({
      milestones: JSON.stringify({
        projectOrgDone: true,
        riskRegisterDone: true,
      }),
    });
    const tasks = mainlineTasks(u.id, [
      "setup_project_team",
      "prepare_master_plan",
      "create_risk_register",
    ]);
    const rank = getCurrentCareerRank(u, project, tasks);
    const ok = rank.id === "specialist_lead";
    log("4. Lv4 + 声望 25 + 3 主线 + riskRegisterDone → 专项负责人", ok, rank.title);
    if (!ok) failed += 1;
  }

  // 5. 不满足条件时返回下一阶位及未完成条件
  {
    const u = user({ level: 2, reputation: 3 });
    const tasks = mainlineTasks(u.id, ["setup_project_team"]);
    const current = getCurrentCareerRank(u, baseProject(), tasks);
    const next = getNextCareerRank(u, baseProject(), tasks);
    const context = getCareerProgressContext(u, baseProject(), tasks);
    const reqs = next ? getCareerPromotionRequirements(next, context) : [];
    const unmet = reqs.filter((r) => !r.passed);

    const ok =
      current.id === "project_rookie" &&
      next?.id === "project_assistant" &&
      unmet.some((r) => r.type === "reputation");

    log(
      "5. 未满足条件时返回下一阶位及未完成条件",
      ok,
      next ? `当前 ${current.shortTitle} → 下一 ${next.shortTitle}，未满足 ${unmet.length} 项` : "无下一阶",
    );
    if (!ok) failed += 1;
  }

  // 6. 专业方向可根据 job 推断
  {
    const cases: Array<[string, string]> = [
      ["DOCUMENT_ASSISTANT", "document_track"],
      ["CONSTRUCTION_ASSISTANT", "site_track"],
      ["SAFETY_ASSISTANT", "risk_safety_track"],
      ["COST_ASSISTANT", "cost_contract_track"],
      ["MECHANICAL_ASSISTANT", "site_track"],
      ["MATERIAL_ASSISTANT", "cost_contract_track"],
      ["QUALITY_ASSISTANT", "risk_safety_track"],
    ];
    let allOk = true;
    for (const [job, expectedTrack] of cases) {
      const track = inferCareerTrackFromJob(job);
      if (track.id !== expectedTrack) allOk = false;
    }
    log("6. 专业方向可根据 job 推断", allOk, `${cases.length} 种岗位映射`);
    if (!allOk) failed += 1;
  }

  // buildCareerRankView 结构完整性
  {
    const u = user({ level: 3, reputation: 15, job: "CONSTRUCTION_ASSISTANT" });
    const project = baseProject({
      milestones: JSON.stringify({ projectOrgDone: true }),
    });
    const tasks = mainlineTasks(u.id, ["setup_project_team", "prepare_master_plan"]);
    const view = buildCareerRankView(u, project, tasks);

    const ok =
      view.currentRank.id === "site_coordinator" &&
      view.trackSuggestion.id === "site_track" &&
      view.unlocks.length > 0 &&
      typeof view.progressPercent === "number";

    log("7. buildCareerRankView 返回完整视图", ok, view.currentRank.title);
    if (!ok) failed += 1;
  }

  console.log(`\n${failed === 0 ? "全部通过" : `${failed} 项失败`}\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
