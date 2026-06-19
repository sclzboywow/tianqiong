import type { EventTemplateData, EventTaskEffect } from "./types";
import type { ProjectStageId } from "./projectStages";
import { metricEffectsToRows, type MetricEffectRow } from "./taskTemplateEffectMapper";
import type { MetricEffects } from "./types";

function metricEffectsFromRows(rows: MetricEffectRow[]): MetricEffects {
  const effects: MetricEffects = {};
  for (const row of rows) {
    if (row.metric?.trim() && row.value !== undefined && row.value !== null) {
      effects[row.metric as keyof MetricEffects] = row.value;
    }
  }
  return effects;
}

function mapArtifactEffects(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { artifactSlug?: string; status?: string; versionBump?: boolean };
      if (!row.artifactSlug?.trim() || !row.status?.trim()) return null;
      return {
        artifactSlug: row.artifactSlug.trim(),
        status: row.status.trim(),
        versionBump: row.versionBump ?? undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => !!item);
}

function mapTaskEffects(raw: unknown): EventTaskEffect[] {
  if (!Array.isArray(raw)) return [];
  const results: EventTaskEffect[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { action?: string; taskSlug?: string };
    if (!row.action || !row.taskSlug?.trim()) continue;
    if (row.action !== "spawn" && row.action !== "complete" && row.action !== "fail") continue;
    results.push({ action: row.action, taskSlug: row.taskSlug.trim() });
  }
  return results;
}

function mapPayloadDoc(doc: Record<string, unknown>): EventTemplateData {
  return {
    slug: String(doc.slug || ""),
    title: String(doc.title || ""),
    description: doc.description ? String(doc.description) : undefined,
    rarity: String(doc.rarity || ""),
    area: doc.area ? String(doc.area) : undefined,
    eventType: doc.eventType ? String(doc.eventType) : undefined,
    inkFile: String(doc.inkFile || ""),
    storySlug: doc.storySlug ? String(doc.storySlug) : undefined,
    npcList:
      (doc.npcList as { npc: string }[] | null)?.map((item) => item.npc).filter(Boolean) || [],
    recommendedJobs:
      (doc.recommendedJobs as { job: string }[] | null)?.map((item) => item.job).filter(Boolean) ||
      [],
    baseSuccessRate: doc.baseSuccessRate as number | undefined,
    triggerBroadcast: doc.triggerBroadcast as boolean | undefined,
    triggerStage: doc.triggerStage ? (doc.triggerStage as ProjectStageId) : undefined,
    triggerLocationSlugs:
      (doc.triggerLocationSlugs as { slug: string }[] | null)
        ?.map((item) => item.slug)
        .filter(Boolean) || [],
    triggerAreaNames:
      (doc.triggerAreaNames as { name: string }[] | null)
        ?.map((item) => item.name)
        .filter(Boolean) || [],
    triggerNpcNames:
      (doc.triggerNpcNames as { name: string }[] | null)
        ?.map((item) => item.name)
        .filter(Boolean) || [],
    riskTags:
      (doc.riskTags as { tag: string }[] | null)?.map((item) => item.tag).filter(Boolean) || [],
    unlockMilestones:
      (doc.unlockMilestones as { milestone: string }[] | null)
        ?.map((item) => item.milestone)
        .filter(Boolean) || [],
    minDay: doc.minDay as number | undefined,
    maxDay: doc.maxDay as number | undefined,
    weight: doc.weight as number | undefined,
    onceOnly: doc.onceOnly as boolean | undefined,
    cooldownDays: doc.cooldownDays as number | undefined,
    triggerTaskSlugs:
      (doc.triggerTaskSlugs as { slug: string }[] | null)
        ?.map((item) => item.slug)
        .filter(Boolean) || [],
    resultText: doc.resultText ? String(doc.resultText) : undefined,
    noTaskText: doc.noTaskText ? String(doc.noTaskText) : undefined,
    artifactEffects: mapArtifactEffects(doc.artifactEffects),
    taskEffects: mapTaskEffects(doc.taskEffects),
    metricEffects: metricEffectsFromRows((doc.metricEffectsList as MetricEffectRow[] | null) || []),
    enabled: doc.enabled !== false,
    payloadDocId: doc.id as string | number,
  };
}

async function tableExists(
  client: Awaited<ReturnType<typeof import("@libsql/client").createClient>>,
  table: string,
) {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    args: [table],
  });
  return result.rows.length > 0;
}

async function queryArrayByParent(
  client: Awaited<ReturnType<typeof import("@libsql/client").createClient>>,
  table: string,
  valueColumn: string,
): Promise<Map<number, string[]>> {
  const grouped = new Map<number, string[]>();
  if (!(await tableExists(client, table))) return grouped;

  const result = await client.execute(`SELECT _parent_id, ${valueColumn} FROM ${table} ORDER BY _order`);
  for (const row of result.rows) {
    const parentId = Number(row._parent_id);
    const value = String(row[valueColumn] || "");
    if (!value) continue;
    const list = grouped.get(parentId) || [];
    list.push(value);
    grouped.set(parentId, list);
  }
  return grouped;
}

async function getEventTemplatesFromSqlite(): Promise<EventTemplateData[]> {
  const { createClient } = await import("@libsql/client");
  const client = createClient({ url: process.env.DATABASE_URL || "file:./payload.db" });
  if (!(await tableExists(client, "event_templates"))) return [];

  const [
    rows,
    triggerLocationSlugs,
    triggerAreaNames,
    triggerNpcNames,
    riskTags,
    unlockMilestones,
    triggerTaskSlugs,
    npcList,
    recommendedJobs,
  ] = await Promise.all([
    client.execute("SELECT * FROM event_templates WHERE enabled IS NOT 0"),
    queryArrayByParent(client, "event_templates_trigger_location_slugs", "slug"),
    queryArrayByParent(client, "event_templates_trigger_area_names", "name"),
    queryArrayByParent(client, "event_templates_trigger_npc_names", "name"),
    queryArrayByParent(client, "event_templates_risk_tags", "tag"),
    queryArrayByParent(client, "event_templates_unlock_milestones", "milestone"),
    queryArrayByParent(client, "event_templates_trigger_task_slugs", "slug"),
    queryArrayByParent(client, "event_templates_npc_list", "npc"),
    queryArrayByParent(client, "event_templates_recommended_jobs", "job"),
  ]);

  return rows.rows
    .map((row) => {
      const id = Number(row.id);
      return {
        slug: String(row.slug || ""),
        title: String(row.title || ""),
        description: row.description ? String(row.description) : undefined,
        rarity: String(row.rarity || ""),
        area: row.area ? String(row.area) : undefined,
        eventType: row.event_type ? String(row.event_type) : undefined,
        inkFile: String(row.ink_file || ""),
        storySlug: row.story_slug ? String(row.story_slug) : undefined,
        npcList: npcList.get(id) || [],
        recommendedJobs: recommendedJobs.get(id) || [],
        baseSuccessRate:
          row.base_success_rate === null || row.base_success_rate === undefined
            ? undefined
            : Number(row.base_success_rate),
        triggerBroadcast: Boolean(row.trigger_broadcast),
        triggerStage: row.trigger_stage ? (String(row.trigger_stage) as ProjectStageId) : undefined,
        triggerLocationSlugs: triggerLocationSlugs.get(id) || [],
        triggerAreaNames: triggerAreaNames.get(id) || [],
        triggerNpcNames: triggerNpcNames.get(id) || [],
        riskTags: riskTags.get(id) || [],
        unlockMilestones: unlockMilestones.get(id) || [],
        minDay: row.min_day === null || row.min_day === undefined ? undefined : Number(row.min_day),
        maxDay: row.max_day === null || row.max_day === undefined ? undefined : Number(row.max_day),
        weight: row.weight === null || row.weight === undefined ? undefined : Number(row.weight),
        onceOnly: Boolean(row.once_only),
        cooldownDays:
          row.cooldown_days === null || row.cooldown_days === undefined
            ? undefined
            : Number(row.cooldown_days),
        triggerTaskSlugs: triggerTaskSlugs.get(id) || [],
        resultText: row.result_text ? String(row.result_text) : undefined,
        noTaskText: row.no_task_text ? String(row.no_task_text) : undefined,
        enabled: row.enabled !== 0,
        payloadDocId: row.id as string | number,
      };
    })
    .filter((event) => event.slug.trim().length > 0);
}

export async function getEventTemplates(): Promise<EventTemplateData[]> {
  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "event-templates",
      where: { enabled: { equals: true } },
      limit: 500,
    });

    return result.docs
      .map((doc) => mapPayloadDoc(doc as Record<string, unknown>))
      .filter((event) => event.slug.trim().length > 0);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[eventTemplateLoader] fallback to sqlite:", error);
    }
    return getEventTemplatesFromSqlite();
  }
}
