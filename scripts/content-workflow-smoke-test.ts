/**
 * 后台内容配置 → 前台生效 闭环 smoke 测试
 * 运行：npm run test:content-workflow
 * 或：npx tsx --env-file=.env scripts/content-workflow-smoke-test.ts
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";

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

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

async function main() {
  console.log("\n=== 后台内容闭环 Smoke 测试 ===\n");
  let failed = false;

  const { initializeProjectForSeed } = await import("../src/game/projectEngine");
  await initializeProjectForSeed();

  const qqId = String(Date.now()).slice(-11);
  const { status: registerStatus, cookies } = await request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nickname: "闭环验收员",
      qqId,
      job: "DOCUMENT_ASSISTANT",
    }),
  });
  log("0. 注册用户", registerStatus === 200, `qqId=${qqId}`);
  if (registerStatus !== 200) failed = true;

  const { loadContentHealthCheckDataFromSqlite } = await import("../src/game/contentHealthCheck");
  const healthLoaded = await loadContentHealthCheckDataFromSqlite();
  const healthData = healthLoaded.data;

  const { getStoryEntries } = await import("../src/game/storyEntryLoader");
  const storyEntries = await getStoryEntries();
  const storyCount = Math.max(storyEntries.length, healthData?.storyEntries.length ?? 0);
  log(
    "1. 读取 StoryEntries",
    storyCount > 0,
    `loader ${storyEntries.length} 条，db ${healthData?.storyEntries.length ?? 0} 条`,
  );
  if (storyCount === 0) failed = true;

  const { getTaskTemplates } = await import("../src/game/contentLoader");
  const taskTemplates = await getTaskTemplates();
  const taskCount = Math.max(taskTemplates.length, healthData?.taskTemplates.length ?? 0);
  log(
    "2. 读取 TaskTemplates",
    taskCount > 0,
    `loader ${taskTemplates.length} 条，db ${healthData?.taskTemplates.length ?? 0} 条`,
  );
  if (taskCount === 0) failed = true;

  const { getEventTemplates } = await import("../src/game/eventTemplateLoader");
  const eventTemplates = await getEventTemplates();
  const eventCount = Math.max(eventTemplates.length, healthData?.eventTemplates.length ?? 0);
  log(
    "3. 读取 EventTemplates",
    eventCount > 0,
    `loader ${eventTemplates.length} 条，db ${healthData?.eventTemplates.length ?? 0} 条`,
  );
  if (eventCount === 0) failed = true;

  const { getLocationActions } = await import("../src/game/locationActionLoader");
  const locationActions = await getLocationActions();
  const actionCount = Math.max(
    locationActions.length,
    healthData?.locationActions.length ?? 0,
  );
  log(
    "4. 读取 LocationActions",
    actionCount > 0,
    `loader ${locationActions.length} 条，db ${healthData?.locationActions.length ?? 0} 条`,
  );
  if (actionCount === 0) failed = true;

  const storySlugs = new Set([
    ...storyEntries.map((entry) => entry.slug),
    ...(healthData?.storyEntries.map((row) => row.slug) ?? []),
  ]);
  const taskSlugs = new Set([
    ...taskTemplates.map((task) => task.slug),
    ...(healthData?.taskTemplates.map((row) => row.slug) ?? []),
  ]);
  const missingStoryRefs: string[] = [];
  const missingTaskRefs: string[] = [];

  for (const task of taskTemplates) {
    if (task.storySlug?.trim() && !storySlugs.has(task.storySlug.trim())) {
      missingStoryRefs.push(`task ${task.slug} → ${task.storySlug}`);
    }
  }
  for (const event of eventTemplates) {
    if (event.storySlug?.trim() && !storySlugs.has(event.storySlug.trim())) {
      missingStoryRefs.push(`event ${event.slug} → ${event.storySlug}`);
    }
  }
  for (const action of locationActions) {
    if (action.storySlug?.trim() && !storySlugs.has(action.storySlug.trim())) {
      missingStoryRefs.push(`action ${action.id} → ${action.storySlug}`);
    }
    for (const slug of action.triggerTaskSlugs || []) {
      if (!taskSlugs.has(slug)) {
        missingTaskRefs.push(`action ${action.id} → ${slug}`);
      }
    }
  }
  for (const event of eventTemplates) {
    for (const slug of event.triggerTaskSlugs || []) {
      if (!taskSlugs.has(slug)) {
        missingTaskRefs.push(`event ${event.slug} → ${slug}`);
      }
    }
  }

  log(
    "5. storySlug 引用有效",
    missingStoryRefs.length === 0,
    missingStoryRefs.length === 0 ? "全部命中 StoryEntry" : missingStoryRefs[0],
  );
  if (missingStoryRefs.length > 0) failed = true;

  log(
    "6. triggerTaskSlugs 引用有效",
    missingTaskRefs.length === 0,
    missingTaskRefs.length === 0 ? "全部命中 TaskTemplate" : missingTaskRefs[0],
  );
  if (missingTaskRefs.length > 0) failed = true;

  {
    const { getProjectState } = await import("../src/game/projectEngine");
    const { getAllLocations, isLocationUnlocked } = await import("../src/game/locationEngine");
    const { isLocationActionUnlocked, executeLocationAction } = await import(
      "../src/game/locationActionEngine"
    );
    const { prisma } = await import("../src/prisma/client");

    const project = await getProjectState();
    const user = await prisma.user.findFirst({ orderBy: { createdAt: "desc" } });
    const locations = await getAllLocations();

    const candidates = locationActions.filter((action) => {
      const location = locations.find((item) => item.id === action.locationId);
      if (!location || !project) return false;
      return isLocationUnlocked(location, project) && isLocationActionUnlocked(action, project);
    });

    const picked = pickRandom(candidates);
    if (!project || !user || !picked) {
      log("7. 随机地点行动执行", false, "无可用行动或用户/项目未就绪");
      failed = true;
    } else {
      try {
        const result = await executeLocationAction(picked.locationId, picked.id, user.id);
        const ok = Boolean(result.message);
        log(
          "7. 随机地点行动执行",
          ok,
          `${picked.locationId}/${picked.id} · ${result.message.slice(0, 60)}`,
        );
        if (!ok) failed = true;
      } catch (error) {
        log(
          "7. 随机地点行动执行",
          false,
          error instanceof Error ? error.message : String(error),
        );
        failed = true;
      }
    }
  }

  {
    const previewSlug =
      storyEntries[0]?.slug ||
      healthData?.storyEntries[0]?.slug ||
      taskTemplates.find((t) => t.storySlug)?.storySlug;
    if (previewSlug) {
      try {
        const unauth = await request(`/api/ops/story-preview/${previewSlug}`);
        const auth = await request(`/api/ops/story-preview/${previewSlug}`, {
          cookie: cookies,
        });
        const unauthBlocked = unauth.status === 401;
        log("7b. 剧情预览未登录拒绝", unauthBlocked, `HTTP ${unauth.status}`);
        if (!unauthBlocked) failed = true;

        const authOk = auth.status === 200 || auth.status === 400;
        log("7c. 剧情预览登录可访问", authOk, `HTTP ${auth.status}`);
        if (!authOk) failed = true;
      } catch {
        log("7b. 剧情预览 API", false, "需先启动 npm run dev（http://localhost:3000）");
        failed = true;
      }
    } else {
      log("7b. 剧情预览 API", false, "无可用 storySlug");
      failed = true;
    }
  }

  {
    const { runContentHealthCheckFromSqlite } = await import("../src/game/contentHealthCheck");
    const report = await runContentHealthCheckFromSqlite();
    const pass = report.failCount === 0 && report.missingCoreTables.length === 0;
    log(
      "8. content:check 通过",
      pass,
      `${report.passCount} 通过, ${report.failCount} 失败, ${report.warnCount} 警告`,
    );
    if (!pass) failed = true;
  }

  console.log(`\n=== 闭环 Smoke ${failed ? "未通过" : "通过"} ===\n`);
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
