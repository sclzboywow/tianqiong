/**
 * 从 Payload 删除旧 Chapter1 与旧阶段主线后台记录
 * 默认 dry-run；传入 --apply 才真正删除
 * 优先 Payload API；不可用时回退 SQL 并清理 array 子表
 */
import { createClient } from "@libsql/client";
import {
  LEGACY_CHAPTER1_EVENT_SLUGS,
  LEGACY_CHAPTER1_INK_FILES,
  LEGACY_CHAPTER1_LOCATION_ACTION_SLUGS,
  LEGACY_CHAPTER1_STORY_ENTRY_SLUGS,
  LEGACY_CHAPTER1_TASK_SLUGS,
} from "../src/data/legacyChapter1Slugs";
import {
  LEGACY_STAGE_MAINLINE_TASK_SLUGS,
  LEGACY_STAGE_STORY_ENTRY_SLUGS,
} from "../src/data/legacyStageTaskSlugs";

const databaseUrl = process.env.DATABASE_URL || "file:./payload.db";
const apply = process.argv.includes("--apply");

type CollectionSpec = {
  label: string;
  collection: "task-templates" | "event-templates" | "story-entries" | "location-actions";
  table: string;
  childTables: string[];
  slugs: readonly string[];
};

const COLLECTIONS: CollectionSpec[] = [
  {
    label: "task-templates.chapter1",
    collection: "task-templates",
    table: "task_templates",
    childTables: [
      "task_templates_success_metric_effects",
      "task_templates_fail_metric_effects",
      "task_templates_milestone_effect_list",
      "task_templates_choice_effect_list",
      "task_templates_choice_effect_list_metric_effects",
      "task_templates_input_artifacts",
      "task_templates_output_artifacts",
      "task_templates_prerequisite_task_slugs",
      "task_templates_required_milestones",
    ],
    slugs: LEGACY_CHAPTER1_TASK_SLUGS,
  },
  {
    label: "task-templates.legacy-stage",
    collection: "task-templates",
    table: "task_templates",
    childTables: [
      "task_templates_success_metric_effects",
      "task_templates_fail_metric_effects",
      "task_templates_milestone_effect_list",
      "task_templates_choice_effect_list",
      "task_templates_choice_effect_list_metric_effects",
      "task_templates_input_artifacts",
      "task_templates_output_artifacts",
      "task_templates_prerequisite_task_slugs",
      "task_templates_required_milestones",
    ],
    slugs: LEGACY_STAGE_MAINLINE_TASK_SLUGS,
  },
  {
    label: "event-templates.chapter1",
    collection: "event-templates",
    table: "event_templates",
    childTables: [
      "event_templates_trigger_location_slugs",
      "event_templates_trigger_task_slugs",
      "event_templates_trigger_npc_names",
      "event_templates_trigger_area_names",
      "event_templates_artifact_effects",
      "event_templates_task_effects",
      "event_templates_metric_effects",
    ],
    slugs: LEGACY_CHAPTER1_EVENT_SLUGS,
  },
  {
    label: "story-entries.chapter1",
    collection: "story-entries",
    table: "story_entries",
    childTables: [
      "story_entries_related_task_slugs",
      "story_entries_related_event_slugs",
      "story_entries_related_location_slugs",
      "story_entries_related_npc_names",
    ],
    slugs: LEGACY_CHAPTER1_STORY_ENTRY_SLUGS,
  },
  {
    label: "story-entries.legacy-stage",
    collection: "story-entries",
    table: "story_entries",
    childTables: [
      "story_entries_related_task_slugs",
      "story_entries_related_event_slugs",
      "story_entries_related_location_slugs",
      "story_entries_related_npc_names",
    ],
    slugs: [
      ...LEGACY_STAGE_STORY_ENTRY_SLUGS,
      ...LEGACY_STAGE_MAINLINE_TASK_SLUGS,
    ],
  },
  {
    label: "location-actions.chapter1",
    collection: "location-actions",
    table: "location_actions",
    childTables: [
      "location_actions_unlock_milestones",
      "location_actions_trigger_task_slugs",
      "location_actions_related_npc_names",
      "location_actions_risk_tags",
    ],
    slugs: LEGACY_CHAPTER1_LOCATION_ACTION_SLUGS,
  },
];

type PayloadClient = {
  find: (args: {
    collection: CollectionSpec["collection"];
    where: { slug: { equals: string } };
    limit: number;
  }) => Promise<{ docs: Array<{ id: string | number; slug?: string }> }>;
  delete: (args: { collection: CollectionSpec["collection"]; id: string | number }) => Promise<unknown>;
};

async function loadPayloadClient(): Promise<PayloadClient | null> {
  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    return (await getPayload({ config })) as PayloadClient;
  } catch (error) {
    console.warn("Payload API 不可用，将使用 SQL 回退清理（含子表）。");
    console.warn(String(error));
    return null;
  }
}

async function tableExists(client: ReturnType<typeof createClient>, table: string) {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    args: [table],
  });
  return result.rows.length > 0;
}

async function findBySlugSql(
  client: ReturnType<typeof createClient>,
  table: string,
  slug: string,
) {
  const result = await client.execute({
    sql: `SELECT id, slug FROM ${table} WHERE slug = ?`,
    args: [slug],
  });
  const row = result.rows[0];
  if (!row) return null;
  return { id: row.id as string | number, slug: String(row.slug) };
}

async function deleteViaSql(
  client: ReturnType<typeof createClient>,
  spec: CollectionSpec,
  id: string | number,
) {
  for (const child of spec.childTables) {
    if (await tableExists(client, child)) {
      await client.execute({
        sql: `DELETE FROM ${child} WHERE _parent_id = ?`,
        args: [id],
      });
    }
  }
  await client.execute({
    sql: `DELETE FROM ${spec.table} WHERE id = ?`,
    args: [id],
  });
}

async function main() {
  const payload = await loadPayloadClient();
  const client = payload ? null : createClient({ url: databaseUrl });
  console.log(`\n=== 旧主线 Payload 清理 (${apply ? "APPLY" : "DRY-RUN"}) ===\n`);
  console.log(`模式: ${payload ? "Payload API" : "SQL 回退"}\n`);

  let totalHits = 0;
  let totalDeleted = 0;

  for (const spec of COLLECTIONS) {
    const hits: { id: string | number; slug: string }[] = [];

    for (const slug of spec.slugs) {
      if (payload) {
        const doc = (
          await payload.find({
            collection: spec.collection,
            where: { slug: { equals: slug } },
            limit: 1,
          })
        ).docs[0];
        if (doc?.slug) hits.push({ id: doc.id, slug: String(doc.slug) });
      } else if (client) {
        if (!(await tableExists(client, spec.table))) continue;
        const doc = await findBySlugSql(client, spec.table, slug);
        if (doc) hits.push(doc);
      }
    }

    console.log(`${spec.label}: 命中 ${hits.length}/${spec.slugs.length}`);
    for (const hit of hits) {
      console.log(`  - ${hit.slug} (id=${hit.id})`);
    }
    totalHits += hits.length;

    if (apply) {
      for (const hit of hits) {
        if (payload) {
          await payload.delete({ collection: spec.collection, id: hit.id });
        } else if (client) {
          await deleteViaSql(client, spec, hit.id);
        }
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
    console.log("\n旧主线 Payload 记录已清理完毕。");
  }
  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
