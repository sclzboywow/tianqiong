/**
 * 为 payload.db 的 event_templates 表补齐新字段并回填 slug / 触发配置
 */
import { createClient, type Client } from "@libsql/client";
import { pathToFileURL } from "url";
import { TASK_TEMPLATES } from "../src/data/taskTemplates";
import { LOCATION_ACTIONS } from "../src/data/locationActions";
import { AREAS } from "../src/data/content";
import { MAP_LOCATIONS } from "../src/data/locations";

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
  }
}

async function tableExists(client: Client, table: string): Promise<boolean> {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    args: [table],
  });
  return result.rows.length > 0;
}

async function dropColumnIfExists(client: Client, table: string, column: string) {
  if (await columnExists(client, table, column)) {
    await client.execute(`ALTER TABLE ${table} DROP COLUMN ${column}`);
  }
}

async function cleanupLegacyEventColumns(client: Client) {
  for (const column of [
    "triggerStage",
    "minDay",
    "maxDay",
    "onceOnly",
    "cooldownDays",
    "resultText",
    "noTaskText",
  ]) {
    await dropColumnIfExists(client, "event_templates", column);
  }
}

function inferEventTriggerLocationSlugs(taskSlug: string): string[] {
  const slugs = new Set<string>();
  for (const action of LOCATION_ACTIONS) {
    if ((action.triggerTaskSlugs || []).includes(taskSlug)) {
      slugs.add(action.locationId);
    }
  }
  return [...slugs];
}

const areaNames = new Set(AREAS.map((area) => area.name));

function inferEventTriggerAreaNames(task: { area?: string; slug: string }): string[] {
  if (task.area && areaNames.has(task.area)) return [task.area];

  const names = new Set<string>();
  for (const location of MAP_LOCATIONS) {
    if ((location.relatedTaskSlugs || []).includes(task.slug)) {
      for (const name of location.relatedAreaNames || []) {
        if (areaNames.has(name)) names.add(name);
      }
    }
  }

  return [...names];
}

function parentFromChildTable(table: string): string {
  for (const marker of ["_trigger_", "_related_", "_unlock_"]) {
    const index = table.indexOf(marker);
    if (index > 0) return table.slice(0, index);
  }
  return table;
}

async function ensureChildTableLike(client: Client, newTable: string, likeTable: string) {
  if (await tableExists(client, newTable)) return;
  if (!(await tableExists(client, likeTable))) return;

  const result = await client.execute({
    sql: "SELECT sql FROM sqlite_master WHERE type='table' AND name = ?",
    args: [likeTable],
  });
  const createSql = result.rows[0]?.sql as string | undefined;
  if (!createSql) return;

  const likeParent = parentFromChildTable(likeTable);
  const newParent = parentFromChildTable(newTable);
  const sql = createSql.replaceAll(likeTable, newTable).replaceAll(likeParent, newParent);
  await client.execute(sql);
}

async function recreateEventChildTables(client: Client) {
  for (const table of [
    "event_templates_trigger_location_slugs",
    "event_templates_trigger_task_slugs",
    "event_templates_trigger_area_names",
    "event_templates_trigger_npc_names",
    "event_templates_risk_tags",
    "event_templates_unlock_milestones",
  ]) {
    if (await tableExists(client, table)) {
      await client.execute(`DROP TABLE ${table}`);
    }
  }

  await ensureChildTableLike(
    client,
    "event_templates_trigger_location_slugs",
    "location_actions_trigger_task_slugs",
  );
  await ensureChildTableLike(
    client,
    "event_templates_trigger_task_slugs",
    "location_actions_trigger_task_slugs",
  );
  await ensureChildTableLike(
    client,
    "event_templates_trigger_area_names",
    "map_locations_related_area_names",
  );
  await ensureChildTableLike(
    client,
    "event_templates_trigger_npc_names",
    "map_locations_related_npc_names",
  );
  await ensureChildTableLike(client, "event_templates_risk_tags", "map_locations_risk_tags");
  await ensureChildTableLike(
    client,
    "event_templates_unlock_milestones",
    "location_actions_unlock_milestones",
  );
}

export async function migrateEventTemplatesSchema() {
  const client = createClient({ url: databaseUrl });

  if (!(await tableExists(client, "event_templates"))) {
    console.error("event_templates 表不存在");
    throw new Error("event_templates table does not exist");
  }

  await recreateEventChildTables(client);
  await cleanupLegacyEventColumns(client);

  await ensureColumn(client, "event_templates", "slug", "TEXT");
  await ensureColumn(client, "event_templates", "description", "TEXT");
  await ensureColumn(client, "event_templates", "trigger_stage", "TEXT");
  await ensureColumn(client, "event_templates", "min_day", "INTEGER");
  await ensureColumn(client, "event_templates", "max_day", "INTEGER");
  await ensureColumn(client, "event_templates", "weight", "INTEGER DEFAULT 10");
  await ensureColumn(client, "event_templates", "once_only", "INTEGER DEFAULT 0");
  await ensureColumn(client, "event_templates", "cooldown_days", "INTEGER DEFAULT 0");
  await ensureColumn(client, "event_templates", "result_text", "TEXT");
  await ensureColumn(client, "event_templates", "no_task_text", "TEXT");

  const inkToTask = new Map(TASK_TEMPLATES.map((t) => [t.inkFile, t]));
  const rows = await client.execute("SELECT id, ink_file, slug FROM event_templates");
  let updated = 0;

  for (const row of rows.rows) {
    const id = row.id as number;
    const inkFile = String(row.ink_file || "");
    const existingSlug = String(row.slug || "").trim();
    const task = inkToTask.get(inkFile);
    if (!task) continue;

    const slug = existingSlug || `evt_${task.slug}`;
    const locationSlugs = inferEventTriggerLocationSlugs(task.slug);

    await client.execute({
      sql: `UPDATE event_templates SET
        slug = ?,
        description = COALESCE(description, ?),
        trigger_stage = COALESCE(trigger_stage, ?),
        weight = COALESCE(weight, 10),
        once_only = COALESCE(once_only, 0),
        cooldown_days = COALESCE(cooldown_days, 0)
      WHERE id = ?`,
      args: [slug, task.description || null, task.stage || null, id],
    });

    if (!existingSlug) updated++;

    for (const table of [
      "event_templates_trigger_location_slugs",
      "event_templates_trigger_task_slugs",
      "event_templates_trigger_area_names",
      "event_templates_trigger_npc_names",
      "event_templates_risk_tags",
      "event_templates_unlock_milestones",
    ]) {
      if (!(await tableExists(client, table))) continue;
      await client.execute({
        sql: `DELETE FROM ${table} WHERE _parent_id = ?`,
        args: [id],
      });
    }

    if (await tableExists(client, "event_templates_trigger_location_slugs")) {
      for (const [order, locSlug] of locationSlugs.entries()) {
        await client.execute({
          sql: "INSERT INTO event_templates_trigger_location_slugs (_order, _parent_id, id, slug) VALUES (?, ?, ?, ?)",
          args: [order, id, `${id}-loc${order}`, locSlug],
        });
      }
    }

    if (await tableExists(client, "event_templates_trigger_task_slugs")) {
      await client.execute({
        sql: "INSERT INTO event_templates_trigger_task_slugs (_order, _parent_id, id, slug) VALUES (0, ?, ?, ?)",
        args: [id, `${id}-task0`, task.slug],
      });
    }

    if (await tableExists(client, "event_templates_trigger_area_names")) {
      const triggerAreaNames = inferEventTriggerAreaNames(task);
      for (const [order, areaName] of triggerAreaNames.entries()) {
        await client.execute({
          sql: "INSERT INTO event_templates_trigger_area_names (_order, _parent_id, id, name) VALUES (?, ?, ?, ?)",
          args: [order, id, `${id}-area${order}`, areaName],
        });
      }
    }

    if (await tableExists(client, "event_templates_trigger_npc_names") && task.sourceName) {
      await client.execute({
        sql: "INSERT INTO event_templates_trigger_npc_names (_order, _parent_id, id, name) VALUES (0, ?, ?, ?)",
        args: [id, `${id}-npc0`, task.sourceName],
      });
    }
  }

  console.log(`Migrated event_templates; backfilled ${updated} slugs`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  migrateEventTemplatesSchema().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
