import { createClient, type Client } from "@libsql/client";
import { MILESTONE_LABELS } from "../src/game/projectStages";

type CheckResult = {
  name: string;
  pass: boolean;
  total: number;
  failures: string[];
};

function checkMembership(
  name: string,
  items: { label: string; value: string }[],
  validSet: Set<string>,
): CheckResult {
  const failures: string[] = [];
  for (const item of items) {
    if (!validSet.has(item.value)) {
      failures.push(`${item.label}: ${item.value} 不存在`);
    }
  }
  return {
    name,
    pass: failures.length === 0,
    total: items.length,
    failures,
  };
}

async function tableExists(client: Client, table: string): Promise<boolean> {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    args: [table],
  });
  return result.rows.length > 0;
}

async function queryRows(client: Client, table: string): Promise<Record<string, unknown>[]> {
  const result = await client.execute(`SELECT * FROM ${table}`);
  return result.rows as Record<string, unknown>[];
}

async function queryArrayByParent(
  client: Client,
  table: string,
  valueColumn: string,
): Promise<Map<number, string[]>> {
  const grouped = new Map<number, string[]>();
  if (!(await tableExists(client, table))) return grouped;

  const result = await client.execute(`SELECT _parent_id, ${valueColumn} FROM ${table} ORDER BY _order`);
  for (const row of result.rows) {
    const parentId = row._parent_id as number;
    const value = row[valueColumn] as string;
    if (!value) continue;
    const list = grouped.get(parentId) || [];
    list.push(value);
    grouped.set(parentId, list);
  }
  return grouped;
}

async function main() {
  const client = createClient({ url: "file:payload.db" });

  const hasLocationActions = await tableExists(client, "location_actions");
  if (!hasLocationActions) {
    console.warn("警告: location_actions 表不存在，请先运行 seed 或启动 dev 后 POST /api/admin/seed");
  }

  const [
    locationActionRows,
    mapLocationRows,
    taskTemplateRows,
    npcRows,
    areaRows,
    locationActionTaskSlugs,
    mapLocationTaskSlugs,
    mapLocationNpcNames,
    mapLocationAreaNames,
  ] = await Promise.all([
    hasLocationActions ? queryRows(client, "location_actions") : Promise.resolve([]),
    queryRows(client, "map_locations"),
    queryRows(client, "task_templates"),
    queryRows(client, "npcs"),
    queryRows(client, "areas"),
    queryArrayByParent(client, "location_actions_trigger_task_slugs", "slug"),
    queryArrayByParent(client, "map_locations_related_task_slugs", "slug"),
    queryArrayByParent(client, "map_locations_related_npc_names", "name"),
    queryArrayByParent(client, "map_locations_related_area_names", "name"),
  ]);

  const mapLocationSlugs = new Set(
    mapLocationRows.map((row) => String(row.slug || "")).filter(Boolean),
  );
  const taskTemplateSlugs = new Set(
    taskTemplateRows.map((row) => String(row.slug || "")).filter(Boolean),
  );
  const npcNames = new Set(npcRows.map((row) => String(row.name || "")).filter(Boolean));
  const areaNames = new Set(areaRows.map((row) => String(row.name || "")).filter(Boolean));
  const milestoneKeys = new Set(Object.keys(MILESTONE_LABELS));

  const results: CheckResult[] = [];

  // 1. location-actions.locationSlug ∈ map-locations.slug
  {
    const items = locationActionRows.map((row) => ({
      label: String(row.slug || "(unknown)"),
      value: String(row.location_slug || ""),
    }));
    results.push(checkMembership("location-actions.locationSlug", items, mapLocationSlugs));
  }

  // 2. location-actions.triggerTaskSlugs ∈ task-templates.slug
  {
    const items: { label: string; value: string }[] = [];
    for (const row of locationActionRows) {
      const actionSlug = String(row.slug || "(unknown)");
      const parentId = row.id as number;
      for (const slug of locationActionTaskSlugs.get(parentId) || []) {
        items.push({ label: actionSlug, value: slug });
      }
    }
    results.push(checkMembership("location-actions.triggerTaskSlugs", items, taskTemplateSlugs));
  }

  // 3. map-locations.relatedTaskSlugs ∈ task-templates.slug
  {
    const items: { label: string; value: string }[] = [];
    for (const row of mapLocationRows) {
      const locSlug = String(row.slug || "(unknown)");
      const parentId = row.id as number;
      for (const slug of mapLocationTaskSlugs.get(parentId) || []) {
        items.push({ label: locSlug, value: slug });
      }
    }
    results.push(checkMembership("map-locations.relatedTaskSlugs", items, taskTemplateSlugs));
  }

  // 4. map-locations.relatedNpcNames ∈ npcs.name
  {
    const items: { label: string; value: string }[] = [];
    for (const row of mapLocationRows) {
      const locSlug = String(row.slug || "(unknown)");
      const parentId = row.id as number;
      for (const name of mapLocationNpcNames.get(parentId) || []) {
        items.push({ label: locSlug, value: name });
      }
    }
    results.push(checkMembership("map-locations.relatedNpcNames", items, npcNames));
  }

  // 5. map-locations.relatedAreaNames ∈ areas.name
  {
    const items: { label: string; value: string }[] = [];
    for (const row of mapLocationRows) {
      const locSlug = String(row.slug || "(unknown)");
      const parentId = row.id as number;
      for (const name of mapLocationAreaNames.get(parentId) || []) {
        items.push({ label: locSlug, value: name });
      }
    }
    results.push(checkMembership("map-locations.relatedAreaNames", items, areaNames));
  }

  // 6. task-templates.area ∈ areas.name (non-empty)
  {
    const items: { label: string; value: string }[] = [];
    const failures: string[] = [];
    for (const row of taskTemplateRows) {
      const slug = String(row.slug || "(unknown)");
      const area = String(row.area || "");
      if (!area.trim()) {
        failures.push(`${slug}: area 为空`);
        continue;
      }
      items.push({ label: slug, value: area });
    }
    const membership = checkMembership("task-templates.area", items, areaNames);
    results.push({
      ...membership,
      failures: [...failures, ...membership.failures],
      pass: failures.length === 0 && membership.pass,
      total: taskTemplateRows.length,
    });
  }

  // 7. task-templates.inkFile non-empty
  {
    const failures: string[] = [];
    for (const row of taskTemplateRows) {
      const slug = String(row.slug || "(unknown)");
      const inkFile = String(row.ink_file || row.inkFile || "");
      if (!inkFile.trim()) {
        failures.push(`${slug}: inkFile 为空`);
      }
    }
    results.push({
      name: "task-templates.inkFile",
      pass: failures.length === 0,
      total: taskTemplateRows.length,
      failures,
    });
  }

  // 8. task-templates.milestoneEffects keys ∈ MILESTONE_LABELS
  {
    const failures: string[] = [];
    let keyCount = 0;
    for (const row of taskTemplateRows) {
      const slug = String(row.slug || "(unknown)");
      const raw = row.milestone_effects ?? row.milestoneEffects;
      let effects: Record<string, unknown> = {};
      if (typeof raw === "string" && raw.trim()) {
        try {
          effects = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          failures.push(`${slug}: milestoneEffects JSON 解析失败`);
          continue;
        }
      } else if (raw && typeof raw === "object") {
        effects = raw as Record<string, unknown>;
      }
      for (const key of Object.keys(effects)) {
        keyCount++;
        if (!milestoneKeys.has(key)) {
          failures.push(`${slug}: milestoneEffects.${key} 不在 MILESTONE_LABELS 中`);
        }
      }
    }
    results.push({
      name: "task-templates.milestoneEffects",
      pass: failures.length === 0,
      total: keyCount,
      failures,
    });
  }

  console.log("\n=== 内容健康检查 ===\n");
  let passCount = 0;
  let failCount = 0;

  for (const result of results) {
    if (result.pass) {
      passCount++;
      console.log(`[PASS] ${result.name} (${result.total}/${result.total})`);
    } else {
      failCount++;
      const passed = result.total - result.failures.length;
      console.log(`[FAIL] ${result.name} (${passed}/${result.total})`);
      for (const failure of result.failures) {
        console.log(`       — ${failure}`);
      }
    }
  }

  console.log(`\n合计: ${passCount} 通过, ${failCount} 失败\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
