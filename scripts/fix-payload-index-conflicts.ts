/**
 * 修复 Payload schema push 时「index already exists」导致的 admin 500
 * 运行：npx tsx --env-file=.env scripts/fix-payload-index-conflicts.ts
 */
import { createClient } from "@libsql/client";

const databaseUrl = process.env.DATABASE_URL || "file:./payload.db";

async function main() {
  const client = createClient({ url: databaseUrl });

  const result = await client.execute(`
    SELECT name, tbl_name
    FROM sqlite_master
    WHERE type = 'index'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `);

  let dropped = 0;
  for (const row of result.rows) {
    const indexName = String(row.name);
    await client.execute(`DROP INDEX IF EXISTS "${indexName}"`);
    console.log(`dropped index: ${indexName} (${row.tbl_name})`);
    dropped++;
  }

  console.log(`done, dropped ${dropped} indexes`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
