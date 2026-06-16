/**
 * 协同地图 smoke 测试
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

function log(step: string, ok: boolean, detail?: string) {
  console.log(`${ok ? "✓" : "✗"} ${step}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  console.log("\n=== 协同地图 Smoke 测试 ===\n");
  let failed = false;

  await request("/api/admin/seed", { method: "POST" });

  {
    const { status } = await request("/locations");
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
    const { status } = await request("/locations/owner_project_management_dept");
    log("6. 地点详情页可访问", status === 200, `HTTP ${status}`);
    if (status !== 200) failed = true;
  }

  {
    const { status } = await request("/locations/nonexistent");
    log("7. 未知地点 404", status === 404, `HTTP ${status}`);
    if (status !== 404) failed = true;
  }

  console.log(`\n=== Smoke ${failed ? "未通过" : "通过"} ===\n`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
