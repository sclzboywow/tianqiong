/**
 * 补齐 payload_locked_documents_rels 缺失的 story_entries_id 列
 * StoryEntries 加入后若未 push schema，admin 编辑页会因 SQL 报错显示空白
 * 运行：npx tsx --env-file=.env scripts/fix-payload-locked-documents-schema.ts
 */
import { createClient, type Client } from "@libsql/client";

const databaseUrl = process.env.DATABASE_URL || "file:./payload.db";

async function columnExists(client: Client, table: string, column: string): Promise<boolean> {
  const result = await client.execute(`PRAGMA table_info(${table})`);
  return result.rows.some((row) => row.name === column);
}

async function ensureColumn(
  client: Client,
  table: string,
  column: string,
  definition: string,
) {
  if (!(await columnExists(client, table, column))) {
    await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`added column ${table}.${column}`);
  } else {
    console.log(`column exists ${table}.${column}`);
  }
}

async function main() {
  const client = createClient({ url: databaseUrl });
  await ensureColumn(client, "payload_locked_documents_rels", "story_entries_id", "INTEGER");
  await ensureColumn(client, "payload_locked_documents_rels", "artifact_definitions_id", "INTEGER");
  console.log("payload locked documents schema fix complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
