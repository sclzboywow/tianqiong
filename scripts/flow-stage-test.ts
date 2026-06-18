/**
 * 流程检测：seed → 注册 → 完成启动4任务 → 进入前期报批 → 完成4任务 → 检查阶段门和日报
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";

type Json = Record<string, unknown>;

async function request(
  path: string,
  options: RequestInit & { cookie?: string } = {},
): Promise<{ status: number; data: unknown; cookies: string }> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (options.cookie) headers["Cookie"] = options.cookie;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const setCookie = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  const legacy = res.headers.get("set-cookie");
  const cookieParts = [
    ...setCookie.map((c) => c.split(";")[0]),
    ...(legacy ? [legacy.split(";")[0]] : []),
  ];
  const cookie = cookieParts.filter(Boolean).join("; ") || options.cookie || "";

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data, cookies: cookie };
}

function log(step: string, ok: boolean, detail?: string) {
  console.log(`${ok ? "✓" : "✗"} ${step}${detail ? ` — ${detail}` : ""}`);
}

async function completeTask(taskId: string, cookie: string, label: string) {
  const { data: detail } = await request(`/api/tasks/${taskId}`);
  const d = detail as { story?: { choices: { choiceId: string }[] } };
  const choiceId = d.story?.choices?.[0]?.choiceId || "immediate_fix";

  await request(`/api/tasks/${taskId}/join`, { method: "POST", cookie });
  const { status, data } = await request(`/api/tasks/${taskId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cookie,
    body: JSON.stringify({ choiceId }),
  });
  const r = data as Json;
  const ok = status === 200 && r.finalized === true;
  log(
    label,
    ok,
    ok
      ? `choice=${choiceId}, success=${r.success}, stage=${r.stageAdvanced ?? "-"}`
      : `HTTP ${status}, ${JSON.stringify(r.error ?? r)}`,
  );
  return ok;
}

const INITIATION_SLUGS = [
  "setup_project_team",
  "prepare_master_plan",
  "create_risk_register",
  "create_document_ledger",
];

const APPROVAL_SLUGS = [
  "confirm_approval_path",
  "confirm_planning_condition",
  "prepare_approval_docs",
  "plan_construction_permit",
];

async function getMainlineTasks(slugs: string[]) {
  const { data } = await request("/api/tasks");
  const d = data as {
    tasks?: { id: string; title: string; templateId?: string; stage?: string; status: string }[];
  };
  return slugs
    .map((slug) =>
      d.tasks?.find(
        (t) =>
          t.templateId === slug && (t.status === "PENDING" || t.status === "IN_PROGRESS"),
      ),
    )
    .filter((t): t is NonNullable<typeof t> => !!t);
}

async function main() {
  console.log("\n=== 建设主线流程检测 ===\n");

  // 1. Seed
  {
    const { status, data } = await request("/api/admin/seed", { method: "POST" });
    const d = data as Json;
    log("1. Seed 初始化", status === 200 && d.ok === true, `阶段=${d.currentStage}, 任务=${d.tasks}`);
  }

  // 2. 注册用户
  const qqId = String(Date.now()).slice(-11);
  let cookie = "";
  {
    const { status, data, cookies } = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: "流程测试员",
        qqId,
        job: "DOCUMENT_ASSISTANT",
      }),
    });
    cookie = cookies;
    const d = data as Json;
    log("2. 注册用户", status === 200 && !!d.user, `qqId=${qqId}`);
  }

  // 3. 完成项目启动 4 个任务
  const initiationTasks = await getMainlineTasks(INITIATION_SLUGS);
  log("3a. 启动阶段主线任务", initiationTasks.length === 4, `共 ${initiationTasks.length} 个`);

  for (let i = 0; i < initiationTasks.length; i++) {
    const t = initiationTasks[i];
    const ok = await completeTask(t.id, cookie, `3b.${i + 1} 完成【${t.title}】`);
    if (!ok) process.exit(1);
  }

  // 4. 检查进入前期报批
  {
    const { data } = await request("/api/project/state");
    const p = (data as { project?: Json }).project || {};
    const milestones = typeof p.milestones === "string" ? JSON.parse(p.milestones) : p.milestones;
    log(
      "4. 自动进入前期报批",
      p.currentStage === "APPROVAL",
      `阶段=${p.currentStage}, 阶段进度=${p.stageProgress}, 总体=${p.overallProgress}, 阶段门=${p.stageGateStatus}`,
    );
    log(
      "4b. 启动里程碑齐全",
      ["projectOrgDone", "masterPlanDone", "riskRegisterDone", "documentLedgerDone"].every(
        (k) => (milestones as Json)?.[k],
      ),
      JSON.stringify(milestones),
    );
  }

  // 5. 完成前期报批 4 个任务
  const approvalTasks = await getMainlineTasks(APPROVAL_SLUGS);
  log("5a. 报批阶段主线任务", approvalTasks.length === 4, `共 ${approvalTasks.length} 个`);

  if (approvalTasks.length < 4) {
    console.log("\n⚠ 报批阶段任务不足，检查阶段推进后是否自动生成任务");
  }

  for (let i = 0; i < approvalTasks.length; i++) {
    const t = approvalTasks[i];
    const ok = await completeTask(t.id, cookie, `5b.${i + 1} 完成【${t.title}】`);
    if (!ok) process.exit(1);
  }

  // 6. 检查阶段门
  {
    const { data } = await request("/api/project/state");
    const p = (data as { project?: Json }).project || {};
    const milestones = typeof p.milestones === "string" ? JSON.parse(p.milestones) : p.milestones;
    log(
      "6. 阶段门状态",
      p.stageGateStatus === "PASSED" || p.currentStage === "DESIGN",
      `阶段=${p.currentStage}, 阶段进度=${p.stageProgress}, 阶段门=${p.stageGateStatus}`,
    );
    log(
      "6b. 报批里程碑",
      ["approvalPathConfirmed", "planningConditionDone", "approvalDocsReady", "permitPlanDone"].every(
        (k) => (milestones as Json)?.[k],
      ),
      JSON.stringify(milestones),
    );
  }

  // 7. 日报
  {
    const { status, data } = await request("/api/daily-report");
    const d = data as { report?: { content?: string; majorEvents?: string[] } };
    const content = d.report?.content || "";
    log(
      "7. 日报生成",
      status === 200 && content.length > 50,
      `${content.length} 字符, 重大事件 ${d.report?.majorEvents?.length ?? 0} 条`,
    );
    console.log("\n--- 日报摘要 ---");
    console.log(content.slice(0, 500) + (content.length > 500 ? "..." : ""));
  }

  console.log("\n=== 流程检测完成 ===\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
