/**
 * 从 Payload 数据库删除旧 Chapter1 后台记录
 * 默认 dry-run；传入 --apply 才真正删除
 *
 * npm run cleanup:legacy-chapter1
 * npm run cleanup:legacy-chapter1:apply
 */
import { createClient } from "@libsql/client";
import {
  LEGACY_CHAPTER1_EVENT_SLUGS,
  LEGACY_CHAPTER1_INK_FILES,
  LEGACY_CHAPTER1_LOCATION_ACTION_SLUGS,
  LEGACY_CHAPTER1_STORY_ENTRY_SLUGS,
  LEGACY_CHAPTER1_TASK_SLUGS,
} from "../src/data/legacyChapter1Slugs";

const databaseUrl = process.env.DATABASE_URL || "file:./payload.db";
const apply = process.argv.includes("--apply");

type CollectionSpec = {
  label: string;
  table: string;
  slugs: readonly string[];
};

const COLLECTIONS: CollectionSpec[] = [
  { label: "task-templates", table: "task_templates", slugs: LEGACY_CHAPTER1_TASK_SLUGS },
  { label: "event-templates", table: "event_templates", slugs: LEGACY_CHAPTER1_EVENT_SLUGS },
  { label: "story-entries", table: "story_entries", slugs: LEGACY_CHAPTER1_STORY_ENTRY_SLUGS },
  {
    label: "location-actions",
    table: "location_actions",
    slugs: LEGACY_CHAPTER1_LOCATION_ACTION_SLUGS,
  },
];

async function tableExists(client: ReturnType<typeof createClient>, table: string) {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    args: [table],
  });
  return result.rows.length > 0;
}

async function findBySlugs(
  client: ReturnType<typeof createClient>,
  table: string,
  slugs: readonly string[],
) {
  const hits: { id: string | number; slug: string }[] = [];
  for (const slug of slugs) {
    const result = await client.execute({
      sql: `SELECT id, slug FROM ${table} WHERE slug = ?`,
      args: [slug],
    });
    const row = result.rows[0];
    if (row) {
      hits.push({ id: row.id as string | number, slug: String(row.slug) });
    }
  }
  return hits;
}

async function deleteById(
  client: ReturnType<typeof createClient>,
  table: string,
  id: string | number,
) {
  await client.execute({
    sql: `DELETE FROM ${table} WHERE id = ?`,
    args: [id],
  });
}

async function main() {
  const client = createClient({ url: databaseUrl });
  console.log(`\n=== 旧 Chapter1 Payload 清理 (${apply ? "APPLY" : "DRY-RUN"}) ===\n`);
  console.log(`数据库: ${databaseUrl}\n`);

  let totalHits = 0;
  let totalDeleted = 0;

  for (const spec of COLLECTIONS) {
    if (!(await tableExists(client, spec.table))) {
      console.log(`[skip] ${spec.label}: 表 ${spec.table} 不存在`);
      continue;
    }

    const hits = await findBySlugs(client, spec.table, spec.slugs);
    console.log(`${spec.label}: 命中 ${hits.length}/${spec.slugs.length}`);
    for (const hit of hits) {
      console.log(`  - ${hit.slug} (id=${hit.id})`);
    }
    totalHits += hits.length;

    if (apply && hits.length > 0) {
      for (const hit of hits) {
        await deleteById(client, spec.table, hit.id);
        totalDeleted++;
      }
    }
  }

  console.log("\n--- 旧 Ink 文件（仅提示，不在此脚本删除源码）---");
  for (const ink of LEGACY_CHAPTER1_INK_FILES) {
    console.log(`  - ${ink}.ink / ${ink}.json`);
  }

  console.log("\n=== 汇总 ===");
  console.log(`命中记录: ${totalHits}`);
  if (apply) {
    console.log(`已删除: ${totalDeleted}`);
    console.log("\n建议继续执行: npm run payload:seed:local");
  } else if (totalHits > 0) {
    console.log("\n如需删除，执行: npm run cleanup:legacy-chapter1:apply");
  } else {
    console.log("\n旧 Chapter1 Payload 记录已清理完毕。");
  }
  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
