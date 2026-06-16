import { createClient, type Client } from "@libsql/client";
import { MILESTONE_LABELS } from "./projectStages";

const CORE_TABLES = [
  { label: "map-locations", table: "map_locations" },
  { label: "task-templates", table: "task_templates" },
  { label: "npcs", table: "npcs" },
  { label: "areas", table: "areas" },
] as const;

export type ContentHealthCheckItem = {
  name: string;
  pass: boolean;
  total: number;
  failures: string[];
};

export type ContentHealthCheckReport = {
  databaseUrl?: string;
  missingCoreTables: string[];
  results: ContentHealthCheckItem[];
  passCount: number;
  failCount: number;
};

export type ContentHealthCheckData = {
  hasLocationActionsTable: boolean;
  locationActions: { slug: string; locationSlug: string; triggerTaskSlugs: string[] }[];
  mapLocations: {
    slug: string;
    relatedTaskSlugs: string[];
    relatedNpcNames: string[];
    relatedAreaNames: string[];
  }[];
  taskTemplates: {
    slug: string;
    area: string;
    inkFile: string;
    milestoneEffects: Record<string, unknown>;
  }[];
  npcNames: string[];
  areaNames: string[];
};

function checkMembership(
  name: string,
  items: { label: string; value: string }[],
  validSet: Set<string>,
): ContentHealthCheckItem {
  const failures: string[] = [];
  for (const item of items) {
    if (!validSet.has(item.value)) {
      failures.push(`${item.label}: ${item.value} 不存在`);
    }
  }
  return {
    name,
    pass: failures.length === 0,
    total: items.length,
    failures,
  };
}

function summarizeReport(
  results: ContentHealthCheckItem[],
  options: { databaseUrl?: string; missingCoreTables?: string[] } = {},
): ContentHealthCheckReport {
  const passCount = results.filter((item) => item.pass).length;
  const failCount = results.length - passCount;
  return {
    databaseUrl: options.databaseUrl,
    missingCoreTables: options.missingCoreTables || [],
    results,
    passCount,
    failCount,
  };
}

export function buildContentHealthCheckReport(data: ContentHealthCheckData): ContentHealthCheckReport {
  const mapLocationSlugs = new Set(data.mapLocations.map((row) => row.slug).filter(Boolean));
  const taskTemplateSlugs = new Set(data.taskTemplates.map((row) => row.slug).filter(Boolean));
  const npcNames = new Set(data.npcNames.filter(Boolean));
  const areaNames = new Set(data.areaNames.filter(Boolean));
  const milestoneKeys = new Set(Object.keys(MILESTONE_LABELS));

  const results: ContentHealthCheckItem[] = [];

  if (!data.hasLocationActionsTable) {
    results.push({
      name: "location-actions (表)",
      pass: false,
      total: 1,
      failures: ["location_actions 表不存在，请先运行 seed 或 POST /api/admin/seed"],
    });
  }

  if (data.hasLocationActionsTable) {
    results.push(
      checkMembership(
        "location-actions.locationSlug",
        data.locationActions.map((row) => ({
          label: row.slug || "(unknown)",
          value: row.locationSlug,
        })),
        mapLocationSlugs,
      ),
    );

    const triggerItems: { label: string; value: string }[] = [];
    for (const row of data.locationActions) {
      for (const slug of row.triggerTaskSlugs) {
        triggerItems.push({ label: row.slug, value: slug });
      }
    }
    results.push(checkMembership("location-actions.triggerTaskSlugs", triggerItems, taskTemplateSlugs));
  }

  {
    const items: { label: string; value: string }[] = [];
    for (const row of data.mapLocations) {
      for (const slug of row.relatedTaskSlugs) {
        items.push({ label: row.slug, value: slug });
      }
    }
    results.push(checkMembership("map-locations.relatedTaskSlugs", items, taskTemplateSlugs));
  }

  {
    const items: { label: string; value: string }[] = [];
    for (const row of data.mapLocations) {
      for (const name of row.relatedNpcNames) {
        items.push({ label: row.slug, value: name });
      }
    }
    results.push(checkMembership("map-locations.relatedNpcNames", items, npcNames));
  }

  {
    const items: { label: string; value: string }[] = [];
    for (const row of data.mapLocations) {
      for (const name of row.relatedAreaNames) {
        items.push({ label: row.slug, value: name });
      }
    }
    results.push(checkMembership("map-locations.relatedAreaNames", items, areaNames));
  }

  {
    const items: { label: string; value: string }[] = [];
    const failures: string[] = [];
    for (const row of data.taskTemplates) {
      if (!row.area.trim()) {
        failures.push(`${row.slug}: area 为空`);
        continue;
      }
      items.push({ label: row.slug, value: row.area });
    }
    const membership = checkMembership("task-templates.area", items, areaNames);
    results.push({
      ...membership,
      failures: [...failures, ...membership.failures],
      pass: failures.length === 0 && membership.pass,
      total: data.taskTemplates.length,
    });
  }

  {
    const failures: string[] = [];
    for (const row of data.taskTemplates) {
      if (!row.inkFile.trim()) {
        failures.push(`${row.slug}: inkFile 为空`);
      }
    }
    results.push({
      name: "task-templates.inkFile",
      pass: failures.length === 0,
      total: data.taskTemplates.length,
      failures,
    });
  }

  {
    const failures: string[] = [];
    let keyCount = 0;
    for (const row of data.taskTemplates) {
      for (const key of Object.keys(row.milestoneEffects || {})) {
        keyCount++;
        if (!milestoneKeys.has(key)) {
          failures.push(`${row.slug}: milestoneEffects.${key} 不在 MILESTONE_LABELS 中`);
        }
      }
    }
    results.push({
      name: "task-templates.milestoneEffects",
      pass: failures.length === 0,
      total: keyCount,
      failures,
    });
  }

  return summarizeReport(results);
}

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

async function queryArrayByParent(
  client: Client,
  table: string,
  valueColumn: string,
): Promise<Map<number, string[]>> {
  const grouped = new Map<number, string[]>();
  if (!(await tableExists(client, table))) return grouped;

  const result = await client.execute(`SELECT _parent_id, ${valueColumn} FROM ${table} ORDER BY _order`);
  for (const row of result.rows) {
    const parentId = row._parent_id as number;
    const value = row[valueColumn] as string;
    if (!value) continue;
    const list = grouped.get(parentId) || [];
    list.push(value);
    grouped.set(parentId, list);
  }
  return grouped;
}

function parseMilestoneEffects(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string" && raw.trim()) {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (raw && typeof raw === "object") {
    return raw as Record<string, unknown>;
  }
  return {};
}

export async function loadContentHealthCheckDataFromSqlite(
  databaseUrl = process.env.DATABASE_URL || "file:./payload.db",
): Promise<{ data: ContentHealthCheckData | null; missingCoreTables: string[]; databaseUrl: string }> {
  const client = createClient({ url: databaseUrl });
  const missingCoreTables: string[] = [];

  for (const entry of CORE_TABLES) {
    if (!(await tableExists(client, entry.table))) {
      missingCoreTables.push(entry.label);
    }
  }

  if (missingCoreTables.length > 0) {
    return { data: null, missingCoreTables, databaseUrl };
  }

  const hasLocationActionsTable = await tableExists(client, "location_actions");
  const [
    locationActionRows,
    mapLocationRows,
    taskTemplateRows,
    npcRows,
    areaRows,
    locationActionTaskSlugs,
    mapLocationTaskSlugs,
    mapLocationNpcNames,
    mapLocationAreaNames,
  ] = await Promise.all([
    hasLocationActionsTable ? queryRows(client, "location_actions") : Promise.resolve([]),
    queryRows(client, "map_locations"),
    queryRows(client, "task_templates"),
    queryRows(client, "npcs"),
    queryRows(client, "areas"),
    queryArrayByParent(client, "location_actions_trigger_task_slugs", "slug"),
    queryArrayByParent(client, "map_locations_related_task_slugs", "slug"),
    queryArrayByParent(client, "map_locations_related_npc_names", "name"),
    queryArrayByParent(client, "map_locations_related_area_names", "name"),
  ]);

  const data: ContentHealthCheckData = {
    hasLocationActionsTable,
    locationActions: locationActionRows.map((row) => ({
      slug: String(row.slug || ""),
      locationSlug: String(row.location_slug || ""),
      triggerTaskSlugs: locationActionTaskSlugs.get(row.id as number) || [],
    })),
    mapLocations: mapLocationRows.map((row) => ({
      slug: String(row.slug || ""),
      relatedTaskSlugs: mapLocationTaskSlugs.get(row.id as number) || [],
      relatedNpcNames: mapLocationNpcNames.get(row.id as number) || [],
      relatedAreaNames: mapLocationAreaNames.get(row.id as number) || [],
    })),
    taskTemplates: taskTemplateRows.map((row) => ({
      slug: String(row.slug || "(unknown)"),
      area: String(row.area || ""),
      inkFile: String(row.ink_file || row.inkFile || ""),
      milestoneEffects: parseMilestoneEffects(row.milestone_effects ?? row.milestoneEffects),
    })),
    npcNames: npcRows.map((row) => String(row.name || "")).filter(Boolean),
    areaNames: areaRows.map((row) => String(row.name || "")).filter(Boolean),
  };

  return { data, missingCoreTables, databaseUrl };
}

export async function runContentHealthCheckFromSqlite(
  databaseUrl = process.env.DATABASE_URL || "file:./payload.db",
): Promise<ContentHealthCheckReport> {
  const loaded = await loadContentHealthCheckDataFromSqlite(databaseUrl);
  if (!loaded.data) {
    return summarizeReport([], {
      databaseUrl: loaded.databaseUrl,
      missingCoreTables: loaded.missingCoreTables,
    });
  }
  return {
    ...buildContentHealthCheckReport(loaded.data),
    databaseUrl: loaded.databaseUrl,
  };
}

export async function runContentHealthCheckFromPayload(): Promise<ContentHealthCheckReport> {
  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });

    const [
      locationActionsResult,
      mapLocationsResult,
      taskTemplatesResult,
      npcsResult,
      areasResult,
    ] = await Promise.all([
      payload.find({ collection: "location-actions", limit: 500 }),
      payload.find({ collection: "map-locations", limit: 500 }),
      payload.find({ collection: "task-templates", limit: 500 }),
      payload.find({ collection: "npcs", limit: 500 }),
      payload.find({ collection: "areas", limit: 500 }),
    ]);

    const data: ContentHealthCheckData = {
      hasLocationActionsTable: true,
      locationActions: locationActionsResult.docs.map((doc) => ({
        slug: String(doc.slug || ""),
        locationSlug: String(doc.locationSlug || ""),
        triggerTaskSlugs:
          (doc.triggerTaskSlugs as { slug: string }[] | null)?.map((item) => item.slug).filter(Boolean) ||
          [],
      })),
      mapLocations: mapLocationsResult.docs.map((doc) => ({
        slug: String(doc.slug || ""),
        relatedTaskSlugs:
          (doc.relatedTaskSlugs as { slug: string }[] | null)?.map((item) => item.slug).filter(Boolean) ||
          [],
        relatedNpcNames:
          (doc.relatedNpcNames as { name: string }[] | null)?.map((item) => item.name).filter(Boolean) ||
          [],
        relatedAreaNames:
          (doc.relatedAreaNames as { name: string }[] | null)?.map((item) => item.name).filter(Boolean) ||
          [],
      })),
      taskTemplates: taskTemplatesResult.docs.map((doc) => ({
        slug: String(doc.slug || "(unknown)"),
        area: String(doc.area || ""),
        inkFile: String(doc.inkFile || ""),
        milestoneEffects: (doc.milestoneEffects as Record<string, unknown> | null) || {},
      })),
      npcNames: npcsResult.docs.map((doc) => String(doc.name || "")).filter(Boolean),
      areaNames: areasResult.docs.map((doc) => String(doc.name || "")).filter(Boolean),
    };

    return buildContentHealthCheckReport(data);
  } catch (error) {
    return summarizeReport([
      {
        name: "content-health-check",
        pass: false,
        total: 1,
        failures: [error instanceof Error ? error.message : "内容健康检查加载失败"],
      },
    ]);
  }
}

export async function runContentHealthCheck(): Promise<ContentHealthCheckReport> {
  return runContentHealthCheckFromPayload();
}

export function buildContentHealthCheckFromStudioData(
  studio: ContentStudioData,
): ContentHealthCheckReport {
  return buildContentHealthCheckReport({
    hasLocationActionsTable: studio.overview.locationActions > 0,
    locationActions: studio.locationActions.map((action) => ({
      slug: action.id,
      locationSlug: action.locationId,
      triggerTaskSlugs: action.triggerTaskSlugs || [],
    })),
    mapLocations: studio.mapLocations.map((location) => ({
      slug: location.id,
      relatedTaskSlugs: location.relatedTaskSlugs || [],
      relatedNpcNames: location.relatedNpcNames || [],
      relatedAreaNames: location.relatedAreaNames || [],
    })),
    taskTemplates: studio.taskTemplates.map((template) => ({
      slug: template.slug,
      area: template.area || "",
      inkFile: template.inkFile || "",
      milestoneEffects: (template.milestoneEffects as Record<string, unknown> | null) || {},
    })),
    npcNames: studio.npcs.map((npc) => npc.name),
    areaNames: studio.areas.map((area) => area.name),
  });
}
