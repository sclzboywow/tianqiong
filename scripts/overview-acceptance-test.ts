/**
 * 验收流程：seed → 总控页 → 注册 → 完成启动4任务 → 验证总控与任务大厅
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";

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

const INITIATION_MILESTONES = [
  "projectOrgDone",
  "masterPlanDone",
  "riskRegisterDone",
  "documentLedgerDone",
];

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

async function getOverviewViaDb() {
  const { getProjectOverview } = await import("../src/game/projectOverview");
  return getProjectOverview();
}

async function getTasks(cookie?: string) {
  const { data } = await request("/api/tasks", { cookie });
  return (
    (data as { tasks?: { id: string; templateId?: string; stage?: string; status: string; title: string }[] })
      .tasks || []
  );
}

function findMainlineTasks(
  tasks: { id: string; templateId?: string; stage?: string; status: string; title: string }[],
  slugs: string[],
) {
  return slugs
    .map((slug) =>
      tasks.find(
        (t) => t.templateId === slug && (t.status === "PENDING" || t.status === "IN_PROGRESS"),
      ),
    )
    .filter((t): t is NonNullable<typeof t> => !!t);
}

async function completeTask(taskId: string, cookie: string, title: string) {
  const { data: detail } = await request(`/api/tasks/${taskId}`);
  const choiceId =
    (detail as { story?: { choices: { choiceId: string }[] } }).story?.choices?.[0]?.choiceId ||
    "immediate_fix";
  await request(`/api/tasks/${taskId}/join`, { method: "POST", cookie });
  const { status, data } = await request(`/api/tasks/${taskId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cookie,
    body: JSON.stringify({ choiceId }),
  });
  const r = data as Json;
  const ok = status === 200 && r.finalized === true;
  log(`4. 完成【${title}】`, ok, ok ? `阶段进度推进后 stage=${r.stageAdvanced ?? "-"}` : JSON.stringify(r.error ?? r));
  return ok;
}

function parseMilestones(project: Json) {
  const raw = project.milestones;
  if (typeof raw === "string") return JSON.parse(raw) as Record<string, boolean>;
  return (raw as Record<string, boolean>) || {};
}

async function main() {
  console.log("\n=== 项目总控验收流程 ===\n");
  let failed = false;

  // 1. Seed
  {
    const { status, data } = await request("/api/admin/seed", { method: "POST" });
    const d = data as Json;
    const ok = status === 200 && d.ok === true;
    log("1. POST /api/admin/seed", ok, `阶段=${d.currentStage}, 任务=${d.tasks}`);
    if (!ok) failed = true;
  }

  // 2. 总控页
  {
    const { status } = await request("/ops/project-overview");
    log("2. 打开 /ops/project-overview", status === 200, `HTTP ${status}`);
    if (status !== 200) failed = true;
  }

  {
    const overview = await getOverviewViaDb();
    const ok = overview.project?.currentStage === "INITIATION" && overview.project.stageProgress === 0;
    log(
      "2b. 总控初始状态",
      ok,
      `阶段=${overview.project?.currentStage}, 阶段进度=${overview.project?.stageProgress}%`,
    );
    if (!ok) failed = true;
  }

  // 3. 注册
  const qqId = String(Date.now()).slice(-11);
  let cookie = "";
  {
    const { status, data, cookies } = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: "总控验收员",
        qqId,
        job: "DOCUMENT_ASSISTANT",
      }),
    });
    cookie = cookies;
    const ok = status === 200 && !!(data as Json).user;
    log("3. 注册用户", ok, `qqId=${qqId}`);
    if (!ok) failed = true;
  }

  // 4. 完成启动 4 任务
  let tasks = await getTasks(cookie);
  const initiationTasks = findMainlineTasks(tasks, INITIATION_SLUGS);
  log("4a. 启动阶段主线任务数", initiationTasks.length === 4, `共 ${initiationTasks.length} 个`);
  if (initiationTasks.length !== 4) failed = true;

  for (let i = 0; i < initiationTasks.length; i++) {
    const t = initiationTasks[i];
    const ok = await completeTask(t.id, cookie, t.title);
    if (!ok) failed = true;

    const overview = await getOverviewViaDb();
    const expectedProgress = (i + 1) * 25;
    const isLast = i === initiationTasks.length - 1;

    if (!isLast) {
      const progressOk = overview.project?.stageProgress === expectedProgress;
      log(
        `4b.${i + 1} 总控阶段进度 ${expectedProgress}%`,
        progressOk,
        `实际=${overview.project?.stageProgress}%`,
      );
      if (!progressOk) failed = true;
    }
  }

  // 5–8. 完成后总控与任务大厅
  const overview = await getOverviewViaDb();
  const project = overview.project as Json | null;

  {
    const initiationRow = overview.stages.find((s) => s.id === "INITIATION");
    const ok = initiationRow?.statusLabel === "已完成" && initiationRow.progress === 100;
    log(
      "5. 启动阶段进度 100%",
      ok,
      `表格：${initiationRow?.statusLabel} ${initiationRow?.progress}%`,
    );
    if (!ok) failed = true;
  }

  {
    const milestones = parseMilestones(project || {});
    const ok = INITIATION_MILESTONES.every((key) => milestones[key]);
    log("6. 启动关键节点全部完成", ok, JSON.stringify(milestones));
    if (!ok) failed = true;
  }

  {
    const milestoneItems = overview.stageInfo?.milestoneItems || [];
    const allChecked = milestoneItems.every((item) => item.done);
    log(
      "6b. 总控页节点全部打勾",
      allChecked,
      milestoneItems.map((item) => `${item.done ? "√" : "×"} ${item.label}`).join(" | "),
    );
    if (!allChecked && overview.project?.currentStage === "APPROVAL") {
      // 进入报批后总控显示的是报批阶段节点，启动节点在里程碑 JSON 里仍应为 true
      log("6b. 总控页节点全部打勾", true, "已进入报批，当前展示报批阶段节点（启动节点已在里程碑完成）");
    } else if (!allChecked) {
      failed = true;
    }
  }

  {
    const ok = overview.project?.currentStage === "APPROVAL";
    log(
      "7. 自动进入前期报批",
      ok,
      `当前阶段=${overview.project?.currentStage}, 阶段进度=${overview.project?.stageProgress}%, 总体=${overview.project?.overallProgress}%`,
    );
    if (!ok) failed = true;
  }

  {
    tasks = await getTasks(cookie);
    const approvalTasks = findMainlineTasks(tasks, APPROVAL_SLUGS);
    const activeApproval = tasks.filter(
      (t) => t.stage === "APPROVAL" && (t.status === "PENDING" || t.status === "IN_PROGRESS"),
    );
    const ok = approvalTasks.length === 4;
    log(
      "8. 任务大厅切换为前期报批任务",
      ok,
      `主线4条：${approvalTasks.map((t) => t.title).join("、")}；进行中=${activeApproval.length}`,
    );
    if (!ok) failed = true;
  }

  console.log(`\n=== 验收${failed ? "未通过" : "全部通过"} ===\n`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
