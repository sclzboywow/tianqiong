/**
 * 端到端检测脚本 - 验证完整游戏链路
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";

type StepResult = { step: string; ok: boolean; detail?: string };

const results: StepResult[] = [];

function log(step: string, ok: boolean, detail?: string) {
  results.push({ step, ok, detail });
  const icon = ok ? "✓" : "✗";
  console.log(`${icon} ${step}${detail ? ` — ${detail}` : ""}`);
}

async function request(
  path: string,
  options: RequestInit & { cookie?: string } = {},
): Promise<{ status: number; data: unknown; cookies: string }> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (options.cookie) headers["Cookie"] = options.cookie;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  const setCookie = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  const legacy = res.headers.get("set-cookie");
  const cookieParts = [
    ...setCookie.map((c) => c.split(";")[0]),
    ...(legacy ? [legacy.split(";")[0]] : []),
  ];
  const cookie = cookieParts.filter(Boolean).join("; ") || options.cookie || "";

  let data: unknown;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, data, cookies: cookie };
}

async function main() {
  console.log("\n=== 天穹综合体 端到端检测 ===\n");
  console.log(`Base URL: ${BASE}\n`);

  let cookie = "";

  // 1. 首页
  {
    const res = await fetch(`${BASE}/`);
    log("1. 首页可访问", res.status === 200, `HTTP ${res.status}`);
  }

  // 2. 管理后台状态
  {
    const { status, data } = await request("/api/admin/status");
    const d = data as { initialized?: boolean; stats?: Record<string, number> };
    log(
      "2. Payload 内容已初始化",
      status === 200 && d.initialized === true,
      d.stats ? `NPC ${d.stats.npcs}, 任务模板 ${d.stats.taskTemplates}` : undefined,
    );
  }

  // 3. 注册玩家
  const qqId = String(Date.now()).slice(-11);
  {
    const { status, data, cookies } = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: "E2E测试员",
        qqId,
        job: "SAFETY_ASSISTANT",
      }),
    });
    cookie = cookies;
    const d = data as { user?: { id: string }; error?: string };
    log("3. 玩家注册", status === 200 && !!d.user?.id, d.user?.id ? `userId=${d.user.id.slice(0, 8)}...` : JSON.stringify(d.error ?? data));
  }

  // 4. 会话验证
  {
    const { status, data } = await request("/api/auth/me", { cookie });
    const d = data as { user?: { nickname: string } };
    log("4. Cookie 会话有效", status === 200 && d.user?.nickname === "E2E测试员", d.user?.nickname);
  }

  // 4.5 重置项目到启动阶段
  {
    const { status, data } = await request("/api/admin/seed", { method: "POST" });
    const d = data as { ok?: boolean; currentStage?: string };
    log("4.5 项目初始化 seed", status === 200 && d.ok === true, `阶段=${d.currentStage || "?"}`);
  }

  // 5. 项目状态
  let projectBefore: Record<string, string | number> = {};
  {
    const { status, data } = await request("/api/project/state");
    const d = data as { project?: Record<string, string | number> };
    projectBefore = d.project || {};
    log(
      "5. 项目状态可读",
      status === 200 &&
        projectBefore.currentStage === "INITIATION" &&
        projectBefore.overallProgress === 0,
      `阶段=${projectBefore.currentStage}, 总体进度=${projectBefore.overallProgress}`,
    );
  }

  // 6. 任务大厅 - 优先找启动阶段单人任务
  let taskId = "";
  let taskTitle = "";
  let soloTaskId = "";
  {
    const { status, data } = await request("/api/tasks");
    const d = data as {
      tasks?: {
        id: string;
        title: string;
        inkFile: string;
        status: string;
        rarity: string;
        stage?: string;
        templateId?: string;
      }[];
    };
    const soloTask = d.tasks?.find(
      (t) =>
        t.templateId === "setup_project_team" &&
        (t.status === "PENDING" || t.status === "IN_PROGRESS"),
    ) || d.tasks?.find(
      (t) =>
        t.stage === "INITIATION" &&
        t.rarity === "R" &&
        (t.status === "PENDING" || t.status === "IN_PROGRESS"),
    );
    soloTaskId = soloTask?.id || "";
    const task = soloTask || d.tasks?.find((t) => t.status === "PENDING" || t.status === "IN_PROGRESS");
    taskId = task?.id || "";
    taskTitle = task?.title || "";
    log("6. 任务大厅有可用任务", status === 200 && !!taskId, `${taskTitle} (${task?.stage || "?"})`);
  }

  if (!taskId) {
    console.log("\n⚠ 无可用任务，再次 seed...");
    await request("/api/admin/seed", { method: "POST" });
    const { data } = await request("/api/tasks");
    const d = data as { tasks?: { id: string; title: string; rarity: string; stage?: string }[] };
    const soloTask = d.tasks?.find((t) => t.templateId === "setup_project_team" || t.stage === "INITIATION");
    soloTaskId = soloTask?.id || "";
    taskId = soloTask?.id || d.tasks?.[0]?.id || "";
    taskTitle = soloTask?.title || d.tasks?.[0]?.title || "";
    log("6b. Seed 后获取任务", !!taskId, taskTitle);
  }

  const soloResolveId = soloTaskId || taskId;

  if (!taskId) {
    console.log("\n=== 检测中止：无任务可测 ===\n");
    process.exit(1);
  }

  // 7. 任务详情 + Ink 剧情
  let choiceId = "immediate_fix";
  {
    const { status, data } = await request(`/api/tasks/${soloResolveId}`);
    const d = data as {
      task?: { title: string };
      story?: { lines: string[]; choices: { choiceId: string; text: string }[] };
    };
    const choices = d.story?.choices || [];
    choiceId = choices.find((c) => c.choiceId)?.choiceId || choices[0]?.choiceId || "immediate_fix";
    log(
      "7. Ink 剧情加载",
      status === 200 && (d.story?.lines?.length || 0) > 0 && choices.length > 0,
      `${d.story?.lines?.length} 行文本, ${choices.length} 个选项`,
    );
  }

  // 8. 加入任务
  {
    const { status, data } = await request(`/api/tasks/${soloResolveId}/join`, {
      method: "POST",
      cookie,
    });
    const d = data as { error?: string };
    log("8. 加入任务", status === 200, d.error);
  }

  // 9. 提交选择并结算（单人任务）
  let resolveResult: {
    finalized?: boolean;
    success?: boolean;
    effects?: Record<string, number>;
  } = {};
  {
    const { status, data } = await request(`/api/tasks/${soloResolveId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cookie,
      body: JSON.stringify({ choiceId }),
    });
    resolveResult = (data as typeof resolveResult) || {};
    log(
      "9. 单人任务结算",
      status === 200 && resolveResult.finalized === true && resolveResult.effects !== undefined,
      `选择=${choiceId}, 成功=${resolveResult.success}, 效果=${JSON.stringify(resolveResult.effects)}`,
    );
  }

  // 10. 项目指标已更新（含 latentRisk）
  {
    const { status, data } = await request("/api/project/state");
    const d = data as { project?: Record<string, number> };
    const after = d.project || {};
    const metricKeys = [
      "progress",
      "overallProgress",
      "stageProgress",
      "quality",
      "safety",
      "cost",
      "dataIntegrity",
      "fireRisk",
      "ownerTrust",
      "propertyHandover",
      "latentRisk",
    ];
    const anyChanged = metricKeys.some((key) => after[key] !== projectBefore[key]);
    log(
      "10. 项目指标已更新",
      status === 200 && anyChanged && after.latentRisk !== undefined,
      `潜在风险 ${projectBefore.latentRisk ?? 20}→${after.latentRisk}, 阶段进度 ${projectBefore.stageProgress}→${after.stageProgress}`,
    );
  }

  // 15. 多人协作任务（验收阶段 UR，仅当前阶段为 ACCEPTANCE 时测试）
  let multiTaskId = "";
  {
    const { data: stateData } = await request("/api/project/state");
    const currentStage = (stateData as { project?: { currentStage?: string } }).project?.currentStage;
    if (currentStage === "ACCEPTANCE") {
      const { data } = await request("/api/tasks");
    const d = data as {
      tasks?: { id: string; inkFile: string; status: string; resolutionMode?: string; requiredCount?: number }[];
    };
    const multiTask = d.tasks?.find(
      (t) =>
        t.inkFile === "opening_joint_inspection" &&
        (t.status === "PENDING" || t.status === "IN_PROGRESS") &&
        t.resolutionMode !== "SOLO",
    );
    multiTaskId = multiTask?.id || "";
    log("15. 找到多人协作任务", !!multiTaskId, multiTaskId ? "开业前联合检查预警" : "未找到");
    } else {
      log("15. 找到多人协作任务", true, `跳过（当前阶段 ${currentStage}）`);
    }
  }

  if (multiTaskId) {
    const qqB = String(Date.now() + 1).slice(-11);
    let cookieB = "";
    {
      const { status, cookies } = await request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: "E2E协作者",
          qqId: qqB,
          job: "DOCUMENT_ASSISTANT",
        }),
      });
      cookieB = cookies;
      log("16. 第二玩家注册", status === 200, qqB);
    }

    let multiChoice = "full_prepare";
    {
      const { data } = await request(`/api/tasks/${multiTaskId}`);
      const d = data as { story?: { choices: { choiceId: string }[] } };
      multiChoice = d.story?.choices[0]?.choiceId || "full_prepare";
    }

    await request(`/api/tasks/${multiTaskId}/join`, { method: "POST", cookie });
    await request(`/api/tasks/${multiTaskId}/join`, { method: "POST", cookie: cookieB });

    {
      const { status, data } = await request(`/api/tasks/${multiTaskId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cookie,
        body: JSON.stringify({ choiceId: multiChoice }),
      });
      const d = data as { finalized?: boolean; submittedCount?: number; requiredCount?: number };
      log(
        "17. 第一人提交后等待结算",
        status === 200 && d.finalized === false,
        `提交 ${d.submittedCount}/${d.requiredCount}`,
      );
    }

    {
      const { status, data } = await request(`/api/tasks/${multiTaskId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cookie: cookieB,
        body: JSON.stringify({ choiceId: multiChoice }),
      });
      const d = data as { finalized?: boolean; success?: boolean; finalChoiceId?: string };
      log(
        "18. 第二人提交后统一结算",
        status === 200 && d.finalized === true && !!d.finalChoiceId,
        `成功=${d.success}, 最终方案=${d.finalChoiceId}`,
      );
    }
  }

  // 11. 排行榜
  {
    const { status, data } = await request("/api/ranking");
    const d = data as { ranking?: { user?: { nickname: string }; contribution: number }[] };
    const hasEntry = d.ranking?.some((r) => r.contribution > 0);
    log("11. 排行榜有贡献记录", status === 200 && !!hasEntry, `Top1 贡献 ${d.ranking?.[0]?.contribution ?? 0}`);
  }

  // 12. 日报
  {
    const { status, data } = await request("/api/daily-report");
    const d = data as { report?: { content: string } };
    log("12. 日报生成", status === 200 && (d.report?.content?.length || 0) > 50, `${d.report?.content?.length ?? 0} 字符`);
  }

  // 13. NapCat 命令
  {
    const { status, data } = await request("/api/napcat/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "项目入口" }),
    });
    const d = data as { reply?: string };
    log("13. NapCat 项目入口命令", status === 200 && !!d.reply?.includes("天穹"), d.reply?.split("\n")[0]);
  }

  // 14. 关键页面
  for (const [name, path] of [
    ["注册页", "/register"],
    ["项目页", "/project"],
    ["任务大厅", "/tasks"],
    ["任务详情", `/tasks/${taskId}`],
    ["角色页", "/profile"],
    ["排行榜", "/ranking"],
    ["日报页", "/daily-report"],
    ["管理后台", "/admin"],
  ] as const) {
    const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
    const ok = res.status === 200 || res.status === 307;
    log(`14. 页面 ${name}`, ok, `HTTP ${res.status}`);
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  console.log(`\n=== 结果: ${passed}/${results.length} 通过 ===`);
  if (failed.length) {
    console.log("\n失败项:");
    failed.forEach((f) => console.log(`  - ${f.step}${f.detail ? `: ${f.detail}` : ""}`));
    process.exit(1);
  }
  console.log("\n端到端链路全部通过。\n");
}

main().catch((err) => {
  console.error("检测异常:", err);
  process.exit(1);
});
