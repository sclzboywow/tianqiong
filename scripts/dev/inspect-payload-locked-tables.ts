/**
 * 本地开发：列出 Payload 锁定文档相关 SQLite 表及列信息。
 *
 * 用法：npx tsx scripts/dev/inspect-payload-locked-tables.ts
 * 环境：DATABASE_URL（默认 file:./payload.db，仅本地相对路径）
 */
import { createClient } from "@libsql/client";

async function main() {
  const c = createClient({ url: process.env.DATABASE_URL || "file:./payload.db" });

  const tables = await c.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'payload_locked%' ORDER BY name",
    args: [],
  });
  console.log("locked tables:", tables.rows.map((r) => r.name).join(", "));

  for (const table of tables.rows.map((r) => String(r.name))) {
    const cols = await c.execute(`PRAGMA table_info(${table})`);
    console.log(`\n${table} columns:`, cols.rows.map((r) => r.name).join(", "));
  }
}

main().catch(console.error);
