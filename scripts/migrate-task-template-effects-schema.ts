/**
 * 为 payload.db 的 task_templates 表补齐可视化效果字段表结构
 * 运行：npx tsx --env-file=.env scripts/migrate-task-template-effects-schema.ts
 */
import { createClient, type Client } from "@libsql/client";
import { TASK_TEMPLATES } from "../src/data/taskTemplates";
import {
  choiceEffectsToRows,
  metricEffectsToRows,
  milestoneEffectsToRows,
} from "../src/game/taskTemplateEffectMapper";

const databaseUrl = process.env.DATABASE_URL || "file:./payload.db";

async function tableExists(client: Client, table: string): Promise<boolean> {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    args: [table],
  });
  return result.rows.length > 0;
}

async function queryRows(client: Client, table: string): Promise<Record<string, unknown>[]> {
  if (!(await tableExists(client, table))) return [];
  const result = await client.execute(`SELECT * FROM ${table}`);
  return result.rows as Record<string, unknown>[];
}

async function deleteChildRows(client: Client, table: string, parentId: number) {
  if (!(await tableExists(client, table))) return;
  await client.execute({
    sql: `DELETE FROM ${table} WHERE _parent_id = ?`,
    args: [parentId],
  });
}

async function insertMetricEffectRows(
  client: Client,
  table: string,
  parentId: number,
  rows: ReturnType<typeof metricEffectsToRows>,
) {
  if (!(await tableExists(client, table))) return;
  let order = 0;
  for (const row of rows) {
    await client.execute({
      sql: `INSERT INTO ${table} (id, _parent_id, _order, metric, value, note) VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM ${table}), ?, ?, ?, ?, ?)`,
      args: [parentId, order++, row.metric, row.value ?? 0, row.note || null],
    });
  }
}

async function insertMilestoneRows(
  client: Client,
  parentId: number,
  rows: ReturnType<typeof milestoneEffectsToRows>,
) {
  const table = "task_templates_milestone_effect_list";
  if (!(await tableExists(client, table))) return;
  let order = 0;
  for (const row of rows) {
    await client.execute({
      sql: `INSERT INTO ${table} (id, _parent_id, _order, milestone, value) VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM ${table}), ?, ?, ?, ?)`,
      args: [parentId, order++, row.milestone, row.value === false ? 0 : 1],
    });
  }
}

async function insertChoiceRows(
  client: Client,
  parentId: number,
  rows: ReturnType<typeof choiceEffectsToRows>,
) {
  const table = "task_templates_choice_effect_list";
  const metricTable = "task_templates_choice_effect_list_metric_effects";
  if (!(await tableExists(client, table))) return;

  let order = 0;
  for (const row of rows) {
    const insertResult = await client.execute({
      sql: `INSERT INTO ${table} (id, _parent_id, _order, choice_id, label, success_rate_delta, note) VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM ${table}), ?, ?, ?, ?, ?, ?)`,
      args: [
        parentId,
        order++,
        row.choiceId,
        row.label || null,
        row.successRateDelta ?? null,
        row.note || null,
      ],
    });
    const choiceRowId = Number(insertResult.lastInsertRowid);
    if (!(await tableExists(client, metricTable))) continue;

    let metricOrder = 0;
    for (const metricRow of row.metricEffects || []) {
      await client.execute({
        sql: `INSERT INTO ${metricTable} (id, _parent_id, _order, metric, value, note) VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM ${metricTable}), ?, ?, ?, ?, ?)`,
        args: [
          choiceRowId,
          metricOrder++,
          metricRow.metric,
          metricRow.value ?? 0,
          metricRow.note || null,
        ],
      });
    }
  }
}

async function syncVisualEffectsForTemplate(
  client: Client,
  taskRow: Record<string, unknown>,
  template: (typeof TASK_TEMPLATES)[number],
) {
  const parentId = taskRow.id as number;
  const slug = String(taskRow.slug || "");

  const tables = [
    "task_templates_success_metric_effects",
    "task_templates_fail_metric_effects",
    "task_templates_milestone_effect_list",
    "task_templates_choice_effect_list",
  ];

  for (const table of tables) {
    await deleteChildRows(client, table, parentId);
  }

  if (await tableExists(client, "task_templates_choice_effect_list")) {
    const choiceRows = await client.execute({
      sql: "SELECT id FROM task_templates_choice_effect_list WHERE _parent_id = ?",
      args: [parentId],
    });
    for (const row of choiceRows.rows) {
      await deleteChildRows(
        client,
        "task_templates_choice_effect_list_metric_effects",
        row.id as number,
      );
    }
  }

  await insertMetricEffectRows(
    client,
    "task_templates_success_metric_effects",
    parentId,
    metricEffectsToRows(template.successEffects),
  );
  await insertMetricEffectRows(
    client,
    "task_templates_fail_metric_effects",
    parentId,
    metricEffectsToRows(template.failEffects),
  );
  await insertMilestoneRows(client, parentId, milestoneEffectsToRows(template.milestoneEffects));
  await insertChoiceRows(client, parentId, choiceEffectsToRows(template.choiceEffects));

  console.log(`  synced visual effects: ${slug}`);
}

async function main() {
  const client = createClient({ url: databaseUrl });
  const taskRows = await queryRows(client, "task_templates");
  const templateBySlug = new Map(TASK_TEMPLATES.map((template) => [template.slug, template]));

  const hasVisualTable = await tableExists(client, "task_templates_success_metric_effects");
  if (!hasVisualTable) {
    console.log(
      "可视化效果表尚未创建。请先启动 dev 让 Payload 推送 schema，或运行 payload migrate。",
    );
    process.exit(1);
  }

  for (const row of taskRows) {
    const template = templateBySlug.get(String(row.slug || ""));
    if (!template) continue;
    await syncVisualEffectsForTemplate(client, row, template);
  }

  console.log("task template visual effects migration complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
