/**
 * 将 npcProfiles.ts 角色库 upsert 到 Payload SQLite（不依赖 Payload CLI）。
 * 用法: npm run sync:npcs
 */
import { createClient } from "@libsql/client";
import { NPC_PROFILES } from "../src/data/npcProfiles";
import { buildNpcProfilePayloadData } from "../src/lib/npcProfilePayload";

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

async function ensureNpcColumns(client: ReturnType<typeof createClient>) {
  const columns: [string, string][] = [
    ["slug", "TEXT"],
    ["title", "TEXT"],
    ["level", "TEXT"],
    ["faction", "TEXT"],
    ["personality", "TEXT"],
    ["agenda", "TEXT"],
  ];
  for (const [name, type] of columns) {
    if (!(await columnExists(client, "npcs", name))) {
      await client.execute(`ALTER TABLE npcs ADD COLUMN ${name} ${type}`);
      console.log(`Added npcs.${name}`);
    }
  }
}

async function replaceNpcArrayItems(
  client: ReturnType<typeof createClient>,
  table: string,
  npcId: unknown,
  items: string[],
  valueColumn: string,
) {
  if (!(await tableExists(client, table))) return;
  await client.execute({
    sql: `DELETE FROM ${table} WHERE _parent_id = ?`,
    args: [npcId],
  });
  for (const [index, item] of items.entries()) {
    if (!item) continue;
    await client.execute({
      sql: `INSERT INTO ${table} (_order, _parent_id, id, ${valueColumn}) VALUES (?, ?, ?, ?)`,
      args: [index + 1, npcId, `${npcId}-${index}`, item],
    });
  }
}

async function upsertNpcProfile(
  client: ReturnType<typeof createClient>,
  profile: (typeof NPC_PROFILES)[number],
) {
  const data = buildNpcProfilePayloadData(profile);
  const existing = await client.execute({
    sql: "SELECT id FROM npcs WHERE slug = ? LIMIT 1",
    args: [profile.id],
  });

  const scalarValues = {
    slug: data.slug,
    name: data.name,
    title: data.title,
    level: data.level,
    faction: data.faction,
    category: data.category,
    type: data.type,
    description: data.description,
    personality: data.personality,
    agenda: data.agenda,
    default_relation: data.defaultRelation,
    unlock_stage: data.unlockStage,
    visible_when_locked: data.visibleWhenLocked ? 1 : 0,
    enabled: 1,
  };

  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    await client.execute({
      sql: `UPDATE npcs SET
        slug = ?, name = ?, title = ?, level = ?, faction = ?,
        category = ?, type = ?, description = ?, personality = ?, agenda = ?,
        default_relation = ?, unlock_stage = ?, visible_when_locked = ?, enabled = ?,
        updated_at = datetime('now')
        WHERE id = ?`,
      args: [
        scalarValues.slug,
        scalarValues.name,
        scalarValues.title,
        scalarValues.level,
        scalarValues.faction,
        scalarValues.category,
        scalarValues.type,
        scalarValues.description,
        scalarValues.personality,
        scalarValues.agenda,
        scalarValues.default_relation,
        scalarValues.unlock_stage,
        scalarValues.visible_when_locked,
        scalarValues.enabled,
        id,
      ],
    });
    await replaceNpcArrayItems(
      client,
      "npcs_helps_with",
      id,
      (data.helpsWith || []).map((row) => row.item),
      "item",
    );
    await replaceNpcArrayItems(
      client,
      "npcs_blocks_when",
      id,
      (data.blocksWhen || []).map((row) => row.item),
      "item",
    );
    await replaceNpcArrayItems(
      client,
      "npcs_risk_tags",
      id,
      (data.riskTags || []).map((row) => row.tag),
      "tag",
    );
    return "updated";
  }

  const insert = await client.execute({
    sql: `INSERT INTO npcs (
      slug, name, title, level, faction, category, type, description, personality, agenda,
      default_relation, unlock_stage, visible_when_locked, enabled, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [
      scalarValues.slug,
      scalarValues.name,
      scalarValues.title,
      scalarValues.level,
      scalarValues.faction,
      scalarValues.category,
      scalarValues.type,
      scalarValues.description,
      scalarValues.personality,
      scalarValues.agenda,
      scalarValues.default_relation,
      scalarValues.unlock_stage,
      scalarValues.visible_when_locked,
      scalarValues.enabled,
    ],
  });

  const newId = insert.lastInsertRowid;
  if (newId != null) {
    await replaceNpcArrayItems(
      client,
      "npcs_helps_with",
      newId,
      (data.helpsWith || []).map((row) => row.item),
      "item",
    );
    await replaceNpcArrayItems(
      client,
      "npcs_blocks_when",
      newId,
      (data.blocksWhen || []).map((row) => row.item),
      "item",
    );
    await replaceNpcArrayItems(
      client,
      "npcs_risk_tags",
      newId,
      (data.riskTags || []).map((row) => row.tag),
      "tag",
    );
  }

  return insert.lastInsertRowid != null ? "created" : "skipped";
}

async function main() {
  const client = createClient({ url: databaseUrl });
  if (!(await tableExists(client, "npcs"))) {
    console.error("npcs 表不存在，请先启动 dev 服务访问 /admin 完成 Payload 初始化");
    process.exit(1);
  }

  await ensureNpcColumns(client);

  let created = 0;
  let updated = 0;
  for (const profile of NPC_PROFILES) {
    const result = await upsertNpcProfile(client, profile);
    if (result === "created") created += 1;
    if (result === "updated") updated += 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        created,
        updated,
        total: NPC_PROFILES.length,
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
