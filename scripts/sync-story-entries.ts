/**
 * 将 TASK_TEMPLATES 的 inkFile 同步为 story-entries（仅 create，不覆盖 story_slug）
 */
import { createClient } from "@libsql/client";
import { TASK_TEMPLATES } from "../src/data/taskTemplates";

const databaseUrl = process.env.DATABASE_URL || "file:./payload.db";

async function tableExists(client: ReturnType<typeof createClient>, table: string) {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    args: [table],
  });
  return result.rows.length > 0;
}

async function columnExists(client: ReturnType<typeof createClient>, table: string, column: string) {
  const result = await client.execute(`PRAGMA table_info(${table})`);
  return result.rows.some((row) => row.name === column);
}

async function ensureStorySchema(client: ReturnType<typeof createClient>) {
  if (!(await tableExists(client, "story_entries"))) {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS story_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT,
        title TEXT NOT NULL,
        description TEXT,
        story_type TEXT,
        status TEXT,
        ink_file TEXT,
        compiled_file TEXT,
        start_knot TEXT,
        stage TEXT,
        preview_text TEXT,
        estimated_minutes INTEGER,
        sort_order INTEGER DEFAULT 0,
        enabled INTEGER DEFAULT 1,
        category TEXT,
        updated_at TEXT,
        created_at TEXT
      )
    `);
  }

  async function ensureChild(newTable: string, likeTable: string) {
    if (await tableExists(client, newTable)) return;
    if (!(await tableExists(client, likeTable))) return;
    const result = await client.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
      args: [likeTable],
    });
    if (result.rows.length === 0) return;
    const sqlResult = await client.execute({
      sql: "SELECT sql FROM sqlite_master WHERE type='table' AND name = ?",
      args: [likeTable],
    });
    const createSql = sqlResult.rows[0]?.sql as string | undefined;
    if (!createSql) return;
    const likeParent = likeTable.includes("event_templates")
      ? "event_templates"
      : likeTable.split("_trigger_")[0];
    await client.execute(createSql.replaceAll(likeTable, newTable).replaceAll(likeParent, "story_entries"));
  }

  await ensureChild("story_entries_related_task_slugs", "event_templates_trigger_task_slugs");
  await ensureChild("story_entries_related_event_slugs", "event_templates_trigger_task_slugs");
  await ensureChild("story_entries_related_location_slugs", "event_templates_trigger_location_slugs");
  await ensureChild("story_entries_related_npc_names", "event_templates_trigger_npc_names");

  for (const table of ["task_templates", "event_templates", "location_actions"]) {
    if (await tableExists(client, table) && !(await columnExists(client, table, "story_slug"))) {
      await client.execute(`ALTER TABLE ${table} ADD COLUMN story_slug TEXT`);
    }
  }
}

async function main() {
  const client = createClient({ url: databaseUrl });
  await ensureStorySchema(client);

  if (!(await tableExists(client, "story_entries"))) {
    console.error("story_entries 表不存在");
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;
  const seen = new Set<string>();

  for (const [index, template] of TASK_TEMPLATES.entries()) {
    await client.execute({
      sql: "UPDATE task_templates SET story_slug = ? WHERE slug = ?",
      args: [template.inkFile, template.slug],
    }).catch(() => undefined);

    await client.execute({
      sql: "UPDATE event_templates SET story_slug = ? WHERE ink_file = ?",
      args: [template.inkFile, template.inkFile],
    }).catch(() => undefined);

    if (seen.has(template.inkFile)) {
      skipped++;
      continue;
    }
    seen.add(template.inkFile);

    const existing = await client.execute({
      sql: "SELECT id FROM story_entries WHERE slug = ?",
      args: [template.inkFile],
    });

    if (existing.rows.length > 0) {
      skipped++;
      continue;
    }

    const insert = await client.execute({
      sql: `INSERT INTO story_entries (
        slug, title, description, story_type, status, ink_file, compiled_file,
        stage, enabled, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      args: [
        template.inkFile,
        template.title,
        template.description || null,
        "task_story",
        "published",
        template.inkFile,
        `${template.inkFile}.json`,
        template.stage || null,
        index,
      ],
    });

    const parentId = insert.lastInsertRowid;
    if (parentId != null && (await tableExists(client, "story_entries_related_task_slugs"))) {
      await client.execute({
        sql: "INSERT INTO story_entries_related_task_slugs (_order, _parent_id, id, slug) VALUES (0, ?, ?, ?)",
        args: [parentId, `${parentId}-task0`, template.slug],
      });
    }

    created++;
  }

  console.log(`Story entries sync: created=${created}, skipped=${skipped}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
