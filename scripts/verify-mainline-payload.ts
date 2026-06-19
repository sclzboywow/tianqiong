/**
 * 核对 payload.db 中建设项目主线配置是否与静态数据一致
 * 运行：npx tsx --env-file=.env scripts/verify-mainline-payload.ts
 */
import { createClient } from "@libsql/client";
import { CONSTRUCTION_PROJECT_MAINLINE_TASKS } from "../src/data/constructionProjectMainlineTasks";
import { CONSTRUCTION_PROJECT_EVENTS } from "../src/data/constructionProjectEvents";
import { CONSTRUCTION_PROJECT_LOCATION_ACTIONS } from "../src/data/constructionProjectLocationActions";
import { CHAPTER1_EVENTS } from "../src/data/chapter1Content";
import { ARTIFACT_DEFINITIONS } from "../src/data/artifactDefinitions";

const INK_FILES = [
  "project_document_task",
  "project_meeting_task",
  "project_submit_review_task",
  "project_correction_task",
];

const databaseUrl = process.env.DATABASE_URL || "file:./payload.db";

type Check = { name: string; ok: boolean; detail: string };

async function countTable(client: ReturnType<typeof createClient>, table: string): Promise<number> {
  try {
    const r = await client.execute(`SELECT COUNT(*) as c FROM ${table}`);
    return Number(r.rows[0]?.c ?? 0);
  } catch {
    return -1;
  }
}

async function slugsWhere(
  client: ReturnType<typeof createClient>,
  table: string,
  where?: string,
): Promise<Set<string>> {
  const sql = where
    ? `SELECT slug FROM ${table} WHERE ${where}`
    : `SELECT slug FROM ${table}`;
  const r = await client.execute(sql);
  return new Set(r.rows.map((row) => String(row.slug)));
}

function missingSlugs(expected: string[], actual: Set<string>): string[] {
  return expected.filter((slug) => !actual.has(slug));
}

async function main() {
  const client = createClient({ url: databaseUrl });
  const checks: Check[] = [];

  const mainlineSlugs = CONSTRUCTION_PROJECT_MAINLINE_TASKS.filter(
    (t) => t.category === "mainline",
  ).map((t) => t.slug);
  const correctionSlugs = CONSTRUCTION_PROJECT_MAINLINE_TASKS.filter(
    (t) => t.category === "correction",
  ).map((t) => t.slug);
  const eventSlugs = CONSTRUCTION_PROJECT_EVENTS.map((e) => String(e.slug)).filter(Boolean);
  const chapter1Slugs = CHAPTER1_EVENTS.map((e) => String(e.slug)).filter(Boolean);
  const actionIds = CONSTRUCTION_PROJECT_LOCATION_ACTIONS.map((a) => a.id);

  const artifactCount = await countTable(client, "artifact_definitions");
  checks.push({
    name: "artifact-definitions",
    ok: artifactCount >= ARTIFACT_DEFINITIONS.length,
    detail: `${artifactCount} (期望 ≥ ${ARTIFACT_DEFINITIONS.length})`,
  });

  const taskSlugs = await slugsWhere(client, "task_templates");
  const taskCount = taskSlugs.size;
  checks.push({
    name: "task-templates.total",
    ok: taskCount >= 75,
    detail: `${taskCount} (期望 ≥ 75)`,
  });
  checks.push({
    name: "task-templates.mainline",
    ok: missingSlugs(mainlineSlugs, taskSlugs).length === 0,
    detail: `24 主线，缺失: ${missingSlugs(mainlineSlugs, taskSlugs).join(", ") || "无"}`,
  });
  checks.push({
    name: "task-templates.correction",
    ok: missingSlugs(correctionSlugs, taskSlugs).length === 0,
    detail: `6 补正，缺失: ${missingSlugs(correctionSlugs, taskSlugs).join(", ") || "无"}`,
  });

  const eventSlugsDb = await slugsWhere(client, "event_templates");
  checks.push({
    name: "event-templates.construction",
    ok: missingSlugs(eventSlugs, eventSlugsDb).length === 0,
    detail: `6 建设事件，缺失: ${missingSlugs(eventSlugs, eventSlugsDb).join(", ") || "无"}`,
  });

  for (const slug of chapter1Slugs) {
    const r = await client.execute({
      sql: "SELECT enabled, category FROM event_templates WHERE slug = ?",
      args: [slug],
    });
    const row = r.rows[0];
    checks.push({
      name: `chapter1.${slug}`,
      ok: row != null && Number(row.enabled) === 0 && row.category === "legacy",
      detail: row
        ? `enabled=${row.enabled}, category=${row.category}`
        : "未找到",
    });
  }

  for (const slug of eventSlugs) {
    const r = await client.execute({
      sql: "SELECT enabled FROM event_templates WHERE slug = ?",
      args: [slug],
    });
    const row = r.rows[0];
    checks.push({
      name: `construction-event.${slug}`,
      ok: row != null && Number(row.enabled) === 1,
      detail: row ? `enabled=${row.enabled}` : "未找到",
    });
  }

  const actionSlugs = await slugsWhere(client, "location_actions");
  checks.push({
    name: "location-actions.construction",
    ok: missingSlugs(actionIds, actionSlugs).length === 0,
    detail: `${actionIds.length} 建设行动，缺失: ${missingSlugs(actionIds, actionSlugs).join(", ") || "无"}`,
  });

  const mapCount = await countTable(client, "map_locations");
  checks.push({
    name: "map-locations",
    ok: mapCount >= 26,
    detail: `${mapCount} (期望 ≥ 26)`,
  });

  const inkFiles = INK_FILES;
  const inkPlaceholders = inkFiles.map(() => "?").join(", ");
  const inkResult = await client.execute({
    sql: `SELECT COUNT(DISTINCT ink_file) as c FROM story_entries WHERE ink_file IN (${inkPlaceholders})`,
    args: inkFiles,
  });
  const inkCount = Number(inkResult.rows[0]?.c ?? 0);
  checks.push({
    name: "story-entries.ink",
    ok: inkCount >= INK_FILES.length,
    detail:
      inkCount >= INK_FILES.length
        ? "4 套通用 Ink 齐全"
        : `仅 ${inkCount}/${INK_FILES.length} 套 Ink 已注册`,
  });

  console.log("\n=== 建设项目主线 Payload 核对 ===\n");
  let failed = 0;
  for (const check of checks) {
    const icon = check.ok ? "✓" : "✗";
    console.log(`${icon} ${check.name} — ${check.detail}`);
    if (!check.ok) failed++;
  }
  console.log(`\n合计: ${checks.length - failed}/${checks.length} 通过\n`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
