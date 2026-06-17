/**
 * 本地开发：直接查询 SQLite 中 location_actions 及其子表结构/数据。
 *
 * 用法：npx tsx scripts/dev/inspect-location-action-sqlite.ts [id]
 * 环境：DATABASE_URL（默认 file:./payload.db，仅本地相对路径）
 */
import { createClient } from "@libsql/client";

async function main() {
  const c = createClient({ url: process.env.DATABASE_URL || "file:./payload.db" });
  const id = Number(process.argv[2] || 11);

  const row = await c.execute({
    sql: "SELECT * FROM location_actions WHERE id = ?",
    args: [id],
  });
  console.log("row:", JSON.stringify(row.rows[0], null, 2));

  const childTables = await c.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'location_actions%' ORDER BY name",
    args: [],
  });
  console.log("tables:", childTables.rows.map((r) => r.name).join(", "));

  for (const table of [
    "location_actions_trigger_task_slugs",
    "location_actions_unlock_milestones",
    "location_actions_related_npc_names",
    "location_actions_risk_tags",
  ]) {
    const exists = childTables.rows.some((r) => r.name === table);
    if (!exists) {
      console.log(`MISSING TABLE: ${table}`);
      continue;
    }
    const child = await c.execute({
      sql: `SELECT * FROM ${table} WHERE _parent_id = ?`,
      args: [id],
    });
    console.log(`${table}:`, JSON.stringify(child.rows));
  }

  const cols = await c.execute("PRAGMA table_info(location_actions)");
  console.log(
    "columns:",
    cols.rows.map((r) => r.name).join(", "),
  );
}

main().catch(console.error);
