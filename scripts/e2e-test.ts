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

  // 5. 项目状态
  let projectBefore: Record<string, number> = {};
  {
    const { status, data } = await request("/api/project/state");
    const d = data as { project?: Record<string, number> };
    projectBefore = d.project || {};
    log(
      "5. 项目状态可读",
      status === 200 && projectBefore.progress !== undefined,
      `进度 ${projectBefore.progress}, 安全 ${projectBefore.safety}, 消防风险 ${projectBefore.fireRisk}`,
    );
  }

  // 6. 任务大厅
  let taskId = "";
  let taskTitle = "";
  {
    const { status, data } = await request("/api/tasks");
    const d = data as { tasks?: { id: string; title: string; inkFile: string; status: string }[] };
    const fireTask = d.tasks?.find((t) => t.inkFile === "fire_corridor_blocked" && t.status === "PENDING");
    const task = fireTask || d.tasks?.find((t) => t.status === "PENDING" || t.status === "IN_PROGRESS");
    taskId = task?.id || "";
    taskTitle = task?.title || "";
    log("6. 任务大厅有可用任务", status === 200 && !!taskId, taskTitle || "无任务");
  }

  if (!taskId) {
    console.log("\n⚠ 无可用任务，尝试 seed...");
    await request("/api/admin/seed", { method: "POST" });
    const { data } = await request("/api/tasks");
    const d = data as { tasks?: { id: string; title: string }[] };
    taskId = d.tasks?.[0]?.id || "";
    taskTitle = d.tasks?.[0]?.title || "";
    log("6b. Seed 后获取任务", !!taskId, taskTitle);
  }

  if (!taskId) {
    console.log("\n=== 检测中止：无任务可测 ===\n");
    process.exit(1);
  }

  // 7. 任务详情 + Ink 剧情
  let choiceId = "strict_clear";
  {
    const { status, data } = await request(`/api/tasks/${taskId}`);
    const d = data as {
      task?: { title: string };
      story?: { lines: string[]; choices: { choiceId: string; text: string }[] };
    };
    const choices = d.story?.choices || [];
    choiceId = choices.find((c) => c.choiceId === "strict_clear")?.choiceId || choices[0]?.choiceId || "strict_clear";
    log(
      "7. Ink 剧情加载",
      status === 200 && (d.story?.lines?.length || 0) > 0 && choices.length > 0,
      `${d.story?.lines?.length} 行文本, ${choices.length} 个选项`,
    );
  }

  // 8. 加入任务
  {
    const { status, data } = await request(`/api/tasks/${taskId}/join`, {
      method: "POST",
      cookie,
    });
    const d = data as { error?: string };
    log("8. 加入任务", status === 200, d.error);
  }

  // 9. 提交选择并结算
  let resolveResult: { success?: boolean; effects?: Record<string, number> } = {};
  {
    const { status, data } = await request(`/api/tasks/${taskId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cookie,
      body: JSON.stringify({ choiceId }),
    });
    const d = data as { result?: typeof resolveResult; error?: string };
    resolveResult = d.result || {};
    log(
      "9. 任务结算",
      status === 200 && resolveResult.effects !== undefined,
      `选择=${choiceId}, 成功=${resolveResult.success}, 效果=${JSON.stringify(resolveResult.effects)}`,
    );
  }

  // 10. 项目指标变化
  {
    const { status, data } = await request("/api/project/state");
    const d = data as { project?: Record<string, number> };
    const after = d.project || {};
    const safetyChanged = after.safety !== projectBefore.safety;
    const fireChanged = after.fireRisk !== projectBefore.fireRisk;
    log(
      "10. 项目指标已更新",
      status === 200 && (safetyChanged || fireChanged),
      `安全 ${projectBefore.safety}→${after.safety}, 消防风险 ${projectBefore.fireRisk}→${after.fireRisk}`,
    );
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
