/**
 * 协同地图 smoke 测试
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

async function main() {
  console.log("\n=== 协同地图 Smoke 测试 ===\n");
  let failed = false;

  await request("/api/admin/seed", { method: "POST" });

  const qqId = String(Date.now()).slice(-11);
  const { status: registerStatus, cookies } = await request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nickname: "地图验收员",
      qqId,
      job: "DOCUMENT_ASSISTANT",
    }),
  });
  log("0. 注册用户", registerStatus === 200, `qqId=${qqId}`);
  if (registerStatus !== 200) failed = true;

  {
    const { status } = await request("/locations", { cookie: cookies });
    log("1. /locations 可访问", status === 200, `HTTP ${status}`);
    if (status !== 200) failed = true;
  }

  {
    const { getMapPageData, getAllLocations } = await import("../src/game/locationEngine");
    const data = await getMapPageData();
    const locations = await getAllLocations();

    const ownerCount = locations.filter((l) => l.group === "建设主体").length;
    log("2. 建设主体地点数", ownerCount >= 10, `共 ${ownerCount} 个`);
    if (ownerCount < 10) failed = true;

    const unlockedOwner = (data.unlockedByGroup["建设主体"] || []).length;
    log("3. INITIATION 默认解锁建设主体", unlockedOwner >= 3, `已解锁 ${unlockedOwner} 个`);
    if (unlockedOwner < 3) failed = true;

    const costDeptLocked = data.locked.some((l) => l.location.id === "owner_cost_contract_dept");
    log("4. 成本合约部未解锁", costDeptLocked, costDeptLocked ? "符合预期" : "不应已解锁");
    if (!costDeptLocked) failed = true;
  }

  {
    const { getLocationOverview } = await import("../src/game/locationEngine");
    const overview = await getLocationOverview("owner_project_management_dept");
    log("5. 项目管理部详情", !!overview?.location, overview?.location.name);
    if (!overview) failed = true;
  }

  {
    const { status } = await request("/locations/owner_project_management_dept", { cookie: cookies });
    log("6. 地点详情页可访问", status === 200, `HTTP ${status}`);
    if (status !== 200) failed = true;
  }

  {
    const { status } = await request("/locations/nonexistent", { cookie: cookies });
    log("7. 未知地点 404", status === 404, `HTTP ${status}`);
    if (status !== 404) failed = true;
  }

  {
    const actionPath = "/api/locations/owner_project_management_dept/actions/action_risk_register";
    const first = await request(actionPath, { method: "POST", cookie: cookies });
    const firstData = first.data as { ok?: boolean; createdTasks?: unknown[]; message?: string };
    const firstOk = first.status === 200 && firstData.ok === true;
    const firstMsg = firstData.message || "";
    const msgOk =
      firstMsg.includes("已生成") ||
      firstMsg.includes("未重复生成") ||
      firstMsg.includes("跳过") ||
      firstMsg.includes("进行中");
    log("8. 执行地点行动", firstOk && msgOk, `HTTP ${first.status} · ${firstMsg || "无 message"}`);
    if (!firstOk || !msgOk) failed = true;

    const second = await request(actionPath, { method: "POST", cookie: cookies });
    const secondData = second.data as { ok?: boolean; createdTasks?: unknown[] };
    const secondOk = second.status === 200 && secondData.ok === true;
    const noDuplicate = (secondData.createdTasks?.length ?? 0) === 0;
    log("9. 重复执行不生成新任务", secondOk && noDuplicate, noDuplicate ? "未重复生成" : "不应再次生成");
    if (!secondOk || !noDuplicate) failed = true;
  }

  console.log(`\n=== Smoke ${failed ? "未通过" : "通过"} ===\n`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
