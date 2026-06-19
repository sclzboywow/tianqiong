/**
 * 将前端沙盘配置同步到 Payload SQLite（upsert，不依赖 Payload CLI）。
 * 用法: npx tsx --env-file=.env scripts/sync-sandtable-payload.ts
 */
import { createClient } from "@libsql/client";
import { AREAS } from "../src/data/content";
import { MAP_LOCATIONS } from "../src/data/locations";
import {
  inferAreaCategory,
  inferAreaUnlockStage,
  inferMapLocationCategory,
} from "../src/payload/contentCategories";

const databaseUrl = process.env.DATABASE_URL || "file:./payload.db";

async function tableExists(client: ReturnType<typeof createClient>, table: string) {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    args: [table],
  });
  return result.rows.length > 0;
}

async function columnExists(
  client: ReturnType<typeof createClient>,
  table: string,
  column: string,
) {
  const result = await client.execute(`PRAGMA table_info(${table})`);
  return result.rows.some((row) => row.name === column);
}

async function ensureAreaColumns(client: ReturnType<typeof createClient>) {
  const columns: [string, string][] = [
    ["slug", "TEXT"],
    ["short_name", "TEXT"],
    ["sandtable_region_id", "TEXT"],
    ["sandtable_zone_id", "TEXT"],
    ["sort_order", "INTEGER DEFAULT 0"],
  ];
  for (const [name, type] of columns) {
    if (!(await columnExists(client, "areas", name))) {
      await client.execute(`ALTER TABLE areas ADD COLUMN ${name} ${type}`);
      console.log(`Added areas.${name}`);
    }
  }
}

async function ensureMapLocationColumns(client: ReturnType<typeof createClient>) {
  const columns: [string, string][] = [
    ["sandtable_region_id", "TEXT"],
    ["sandtable_zone_id", "TEXT"],
  ];
  for (const [name, type] of columns) {
    if (!(await columnExists(client, "map_locations", name))) {
      await client.execute(`ALTER TABLE map_locations ADD COLUMN ${name} ${type}`);
      console.log(`Added map_locations.${name}`);
    }
  }
}

async function upsertArea(client: ReturnType<typeof createClient>, area: (typeof AREAS)[number]) {
  const category = inferAreaCategory(area.name, area.stage, area.category);
  const unlockStage = area.unlockStage || inferAreaUnlockStage(area.name, area.stage);
  const existing = await client.execute({
    sql: "SELECT id FROM areas WHERE slug = ? OR name = ? LIMIT 1",
    args: [area.slug, area.name],
  });
  const values = {
    slug: area.slug,
    name: area.name,
    short_name: area.shortName,
    sandtable_region_id: area.sandtableRegionId,
    sandtable_zone_id: area.sandtableZoneId,
    category,
    description: area.description,
    stage: area.stage,
    unlock_stage: unlockStage,
    visible_when_locked: area.visibleWhenLocked ? 1 : 0,
    sort_order: area.sortOrder,
    enabled: 1,
  };

  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    await client.execute({
      sql: `UPDATE areas SET
        slug = ?, name = ?, short_name = ?, sandtable_region_id = ?, sandtable_zone_id = ?,
        category = ?, description = ?, stage = ?, unlock_stage = ?,
        visible_when_locked = ?, sort_order = ?, enabled = ?, updated_at = datetime('now')
        WHERE id = ?`,
      args: [
        values.slug,
        values.name,
        values.short_name,
        values.sandtable_region_id,
        values.sandtable_zone_id,
        values.category,
        values.description,
        values.stage,
        values.unlock_stage,
        values.visible_when_locked,
        values.sort_order,
        values.enabled,
        id,
      ],
    });
    return "updated";
  }

  const insert = await client.execute({
    sql: `INSERT INTO areas (
      slug, name, short_name, sandtable_region_id, sandtable_zone_id,
      category, description, stage, unlock_stage, visible_when_locked, sort_order, enabled,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [
      values.slug,
      values.name,
      values.short_name,
      values.sandtable_region_id,
      values.sandtable_zone_id,
      values.category,
      values.description,
      values.stage,
      values.unlock_stage,
      values.visible_when_locked,
      values.sort_order,
      values.enabled,
    ],
  });
  return insert.lastInsertRowid != null ? "created" : "skipped";
}

async function upsertMapLocation(
  client: ReturnType<typeof createClient>,
  location: (typeof MAP_LOCATIONS)[number],
  sortOrder: number,
) {
  const category = inferMapLocationCategory(location.group);
  const existing = await client.execute({
    sql: "SELECT id FROM map_locations WHERE slug = ? LIMIT 1",
    args: [location.id],
  });
  const values = {
    slug: location.id,
    name: location.name,
    sandtable_region_id: location.sandtableRegionId,
    sandtable_zone_id: location.sandtableZoneId,
    type: location.type,
    group: location.group,
    category,
    description: location.description,
    unlock_stage: location.unlockStage,
    sort_order: sortOrder,
    enabled: 1,
  };

  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    await client.execute({
      sql: `UPDATE map_locations SET
        name = ?, sandtable_region_id = ?, sandtable_zone_id = ?,
        type = ?, "group" = ?, category = ?, description = ?, unlock_stage = ?,
        sort_order = ?, enabled = ?, updated_at = datetime('now')
        WHERE id = ?`,
      args: [
        values.name,
        values.sandtable_region_id,
        values.sandtable_zone_id,
        values.type,
        values.group,
        values.category,
        values.description,
        values.unlock_stage,
        values.sort_order,
        values.enabled,
        id,
      ],
    });
    return "updated";
  }

  const insert = await client.execute({
    sql: `INSERT INTO map_locations (
      slug, name, sandtable_region_id, sandtable_zone_id, type, "group", category,
      description, unlock_stage, sort_order, enabled, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [
      values.slug,
      values.name,
      values.sandtable_region_id,
      values.sandtable_zone_id,
      values.type,
      values.group,
      values.category,
      values.description,
      values.unlock_stage,
      values.sort_order,
      values.enabled,
    ],
  });
  return insert.lastInsertRowid != null ? "created" : "skipped";
}

async function main() {
  const client = createClient({ url: databaseUrl });
  if (!(await tableExists(client, "areas"))) {
    console.error("areas 表不存在，请先启动 dev 服务访问 /admin 完成 Payload 初始化");
    process.exit(1);
  }

  await ensureAreaColumns(client);
  if (await tableExists(client, "map_locations")) {
    await ensureMapLocationColumns(client);
  }

  let areaCreated = 0;
  let areaUpdated = 0;
  for (const area of AREAS) {
    const result = await upsertArea(client, area);
    if (result === "created") areaCreated++;
    if (result === "updated") areaUpdated++;
  }

  let mapCreated = 0;
  let mapUpdated = 0;
  if (await tableExists(client, "map_locations")) {
    for (const [index, location] of MAP_LOCATIONS.entries()) {
      const result = await upsertMapLocation(client, location, index);
      if (result === "created") mapCreated++;
      if (result === "updated") mapUpdated++;
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        areas: { created: areaCreated, updated: areaUpdated, total: AREAS.length },
        mapLocations: {
          created: mapCreated,
          updated: mapUpdated,
          total: MAP_LOCATIONS.length,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
