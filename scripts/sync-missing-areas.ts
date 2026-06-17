/**
 * 将 src/data/content.ts 中缺失的 Area 写入 payload.db（仅 create，不覆盖）
 */
import { createClient } from "@libsql/client";
import { AREAS } from "../src/data/content";
import {
  inferAreaCategory,
  inferAreaUnlockStage,
} from "../src/payload/contentCategories";

const databaseUrl = process.env.DATABASE_URL || "file:./payload.db";

async function tableExists(client: ReturnType<typeof createClient>, table: string) {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    args: [table],
  });
  return result.rows.length > 0;
}

async function main() {
  const client = createClient({ url: databaseUrl });
  if (!(await tableExists(client, "areas"))) {
    console.error("areas 表不存在，请先运行 seed");
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const area of AREAS) {
    const existing = await client.execute({
      sql: "SELECT id FROM areas WHERE name = ?",
      args: [area.name],
    });
    if (existing.rows.length > 0) {
      skipped++;
      continue;
    }

    const category = inferAreaCategory(
      area.name,
      area.stage,
      (area as { category?: string }).category,
    );
    const unlockStage =
      area.unlockStage || inferAreaUnlockStage(area.name, area.stage);

    const insert = await client.execute({
      sql: `INSERT INTO areas (
        name, category, description, stage, unlock_stage, visible_when_locked, enabled
      ) VALUES (?, ?, ?, ?, ?, ?, 1)`,
      args: [
        area.name,
        category,
        area.description,
        area.stage,
        unlockStage,
        area.visibleWhenLocked ?? false ? 1 : 0,
      ],
    });

    const areaId = insert.lastInsertRowid;
    if (areaId == null) continue;

    for (const [order, tag] of (area.riskTags || []).entries()) {
      if (!(await tableExists(client, "areas_risk_tags"))) break;
      await client.execute({
        sql: "INSERT INTO areas_risk_tags (_order, _parent_id, id, tag) VALUES (?, ?, ?, ?)",
        args: [order, areaId, `${areaId}-tag${order}`, tag],
      });
    }

    for (const [order, slug] of (area.relatedLocationSlugs || []).entries()) {
      if (!(await tableExists(client, "areas_related_location_slugs"))) break;
      await client.execute({
        sql: "INSERT INTO areas_related_location_slugs (_order, _parent_id, id, slug) VALUES (?, ?, ?, ?)",
        args: [order, areaId, `${areaId}-loc${order}`, slug],
      });
    }

    created++;
    console.log(`Created area: ${area.name} (${category})`);
  }

  console.log(`Done: created=${created}, skipped=${skipped}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
