import fs from "fs";
import path from "path";
import { createClient, type Client } from "@libsql/client";
import { VALID_PROJECT_METRIC_KEYS } from "./metricConfig";
import { MILESTONE_LABELS } from "./projectStages";
import type { ContentStudioData } from "./contentStudioLoader";
import {
  detectEffectFieldMismatches,
  type ChoiceEffectRow,
  type MetricEffectRow,
  type MilestoneEffectRow,
  type TaskTemplateEffectDoc,
} from "./taskTemplateEffectMapper";
import { inkSourceUsesLegacyDialogueWithoutSpeakerTags } from "./storySegmentParser";
import { LEGACY_NPC_NAME_ALIASES } from "@/data/npcProfiles";
import {
  resolveAllowedStatuses,
  STANDARD_ARTIFACT_STATUSES,
} from "@/data/artifactDefinitions";

const STORIES_DIR = path.join(process.cwd(), "src/ink/stories");

function inkSourceExists(inkFile: string): boolean {
  if (!inkFile.trim()) return false;
  return fs.existsSync(path.join(STORIES_DIR, `${inkFile}.ink`));
}

function inkCompiledExists(inkFile: string): boolean {
  if (!inkFile.trim()) return false;
  return fs.existsSync(path.join(STORIES_DIR, `${inkFile}.json`));
}

function collectInkFilesForFormatCheck(data: ContentHealthCheckData): string[] {
  const inkFiles = new Set<string>();
  for (const row of data.taskTemplates) {
    if (row.inkFile.trim()) inkFiles.add(row.inkFile.trim());
  }
  for (const row of data.eventTemplates) {
    if (row.inkFile.trim()) inkFiles.add(row.inkFile.trim());
  }
  for (const row of data.storyEntries) {
    if (row.inkFile.trim()) inkFiles.add(row.inkFile.trim());
  }
  return [...inkFiles];
}

function checkInkLegacyDialogueFormat(inkFiles: string[]): ContentHealthCheckItem {
  const failures: string[] = [];
  for (const inkFile of inkFiles) {
    const filePath = path.join(STORIES_DIR, `${inkFile}.ink`);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf-8");
    if (inkSourceUsesLegacyDialogueWithoutSpeakerTags(content)) {
      failures.push(
        `${inkFile}: 仍含「…」对话但未使用 [说话人] 格式，请参考 docs/story-format.md`,
      );
    }
  }
  return {
    name: "ink-stories.legacyDialogueFormat (warning)",
    pass: failures.length === 0,
    total: inkFiles.length,
    failures,
  };
}

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
  warnings: ContentHealthCheckItem[];
  passCount: number;
  failCount: number;
  warnCount: number;
};

export type ContentHealthCheckData = {
  hasLocationActionsTable: boolean;
  hasEventTemplatesTable: boolean;
  hasStoryEntriesTable: boolean;
  locationActions: {
    slug: string;
    locationSlug: string;
    triggerTaskSlugs: string[];
    storySlug?: string;
  }[];
  mapLocations: {
    slug: string;
    relatedTaskSlugs: string[];
    relatedNpcNames: string[];
    relatedAreaNames: string[];
  }[];
  taskTemplates: {
    slug: string;
    category?: string;
    area: string;
    inkFile: string;
    storySlug?: string;
    milestoneEffects: Record<string, unknown>;
    successEffects: Record<string, unknown>;
    failEffects: Record<string, unknown>;
    choiceEffects: Record<string, unknown>;
    successMetricEffects: MetricEffectRow[];
    failMetricEffects: MetricEffectRow[];
    milestoneEffectList: MilestoneEffectRow[];
    choiceEffectList: ChoiceEffectRow[];
    inputArtifacts?: { artifactSlug: string; minStatus?: string }[];
    outputArtifacts?: { artifactSlug: string; status?: string }[];
    prerequisiteTaskSlugs?: string[];
    requiredMilestones?: string[];
  }[];
  eventTemplates: {
    slug: string;
    inkFile: string;
    storySlug?: string;
    triggerLocationSlugs: string[];
    triggerTaskSlugs: string[];
    triggerNpcNames: string[];
    triggerAreaNames: string[];
    unlockMilestones: string[];
    artifactEffects?: { artifactSlug: string; status?: string }[];
    taskEffects?: { action: string; taskSlug: string }[];
  }[];
  storyEntries: {
    slug: string;
    inkFile: string;
    relatedTaskSlugs: string[];
    relatedEventSlugs: string[];
    relatedLocationSlugs: string[];
    relatedNpcNames: string[];
  }[];
  npcNames: string[];
  areaNames: string[];
  artifactDefinitions?: {
    slug: string;
    defaultStatus: string;
    allowedStatuses: string[];
    sourceLocationSlugs: string[];
    sourceNpcNames: string[];
  }[];
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
  options: {
    databaseUrl?: string;
    missingCoreTables?: string[];
    warnings?: ContentHealthCheckItem[];
  } = {},
): ContentHealthCheckReport {
  const warnings = options.warnings || [];
  const passCount = results.filter((item) => item.pass).length;
  const failCount = results.length - passCount;
  const warnCount = warnings.reduce((sum, item) => sum + item.failures.length, 0);
  return {
    databaseUrl: options.databaseUrl,
    missingCoreTables: options.missingCoreTables || [],
    results,
    warnings,
    passCount,
    failCount,
    warnCount,
  };
}

function parseJsonRecord(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string" && raw.trim()) {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function mapInputArtifactsFromDoc(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  const results: { artifactSlug: string; minStatus?: string }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { artifactSlug?: string; minStatus?: string };
    if (!row.artifactSlug?.trim()) continue;
    results.push({
      artifactSlug: row.artifactSlug.trim(),
      minStatus: row.minStatus?.trim() || undefined,
    });
  }
  return results;
}

function mapOutputArtifactsFromDoc(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  const results: { artifactSlug: string; status?: string }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { artifactSlug?: string; status?: string };
    if (!row.artifactSlug?.trim()) continue;
    results.push({
      artifactSlug: row.artifactSlug.trim(),
      status: row.status?.trim() || undefined,
    });
  }
  return results;
}

function mapArtifactEffectsFromDoc(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  const results: { artifactSlug: string; status?: string }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { artifactSlug?: string; status?: string };
    if (!row.artifactSlug?.trim()) continue;
    results.push({
      artifactSlug: row.artifactSlug.trim(),
      status: row.status?.trim() || undefined,
    });
  }
  return results;
}

function mapInputArtifactsFromGrouped(rows: Record<string, unknown>[] | undefined) {
  if (!rows?.length) return [];
  return rows
    .map((row) => ({
      artifactSlug: String(row.artifact_slug || row.artifactSlug || "").trim(),
      minStatus: String(row.min_status || row.minStatus || "").trim() || undefined,
    }))
    .filter((item) => item.artifactSlug);
}

function mapOutputArtifactsFromGrouped(rows: Record<string, unknown>[] | undefined) {
  if (!rows?.length) return [];
  return rows
    .map((row) => ({
      artifactSlug: String(row.artifact_slug || row.artifactSlug || "").trim(),
      status: String(row.status || "").trim() || undefined,
    }))
    .filter((item) => item.artifactSlug);
}

function mapArtifactEffectsFromGrouped(rows: Record<string, unknown>[] | undefined) {
  return mapOutputArtifactsFromGrouped(rows);
}

function mapPrerequisiteTaskSlugsFromDoc(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        return String((item as { slug?: string }).slug || "").trim();
      }
      return "";
    })
    .filter(Boolean);
}

function buildArtifactAllowedStatusMap(
  definitions: NonNullable<ContentHealthCheckData["artifactDefinitions"]>,
): Map<string, { defaultStatus: string; allowed: Set<string>; usesFallback: boolean }> {
  const map = new Map<string, { defaultStatus: string; allowed: Set<string>; usesFallback: boolean }>();
  for (const def of definitions) {
    const usesFallback = def.allowedStatuses.length === 0;
    const effective = resolveAllowedStatuses({
      allowedStatuses: def.allowedStatuses.map((status) => ({ status })),
      defaultStatus: def.defaultStatus,
    });
    map.set(def.slug, {
      defaultStatus: def.defaultStatus || "draft",
      allowed: new Set(effective.map((item) => item.status)),
      usesFallback,
    });
  }
  return map;
}

function mapRequiredMilestonesFromDoc(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        return String((item as { milestone?: string }).milestone || "").trim();
      }
      return "";
    })
    .filter(Boolean);
}

function mapTaskEffectsFromDoc(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  const results: { action: string; taskSlug: string }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { action?: string; taskSlug?: string; task_slug?: string };
    const action = row.action?.trim();
    const taskSlug = (row.taskSlug || row.task_slug)?.trim();
    if (!action || !taskSlug) continue;
    results.push({ action, taskSlug });
  }
  return results;
}

function hasMetricEffectContent(rows: MetricEffectRow[]): boolean {
  return rows.some((row) => row.metric?.trim() && row.value !== undefined && row.value !== null);
}

function hasMilestoneEffectContent(
  rows: MilestoneEffectRow[],
  json: Record<string, unknown>,
): boolean {
  if (rows.some((row) => row.milestone?.trim())) return true;
  return Object.values(json).some(Boolean);
}

function hasSuccessEffectContent(
  successRows: MetricEffectRow[],
  successJson: Record<string, unknown>,
): boolean {
  if (hasMetricEffectContent(successRows)) return true;
  return Object.keys(successJson).length > 0;
}

function buildTaskTemplateHealthChecks(
  data: ContentHealthCheckData,
  milestoneKeys: Set<string>,
): { results: ContentHealthCheckItem[]; warnings: ContentHealthCheckItem[] } {
  const extraResults: ContentHealthCheckItem[] = [];
  const extraWarnings: ContentHealthCheckItem[] = [];

  {
    const failures: string[] = [];
    let total = 0;
    for (const row of data.taskTemplates) {
      for (const effect of row.successMetricEffects) {
        total++;
        const metric = effect.metric?.trim() || "";
        if (!metric || !VALID_PROJECT_METRIC_KEYS.has(metric)) {
          failures.push(`${row.slug}: successMetricEffects.metric "${metric || "(empty)"}" 不合法`);
        }
      }
    }
    extraResults.push({
      name: "task-templates.successMetricEffects.metric",
      pass: failures.length === 0,
      total,
      failures,
    });
  }

  {
    const failures: string[] = [];
    let total = 0;
    for (const row of data.taskTemplates) {
      for (const effect of row.failMetricEffects) {
        total++;
        const metric = effect.metric?.trim() || "";
        if (!metric || !VALID_PROJECT_METRIC_KEYS.has(metric)) {
          failures.push(`${row.slug}: failMetricEffects.metric "${metric || "(empty)"}" 不合法`);
        }
      }
    }
    extraResults.push({
      name: "task-templates.failMetricEffects.metric",
      pass: failures.length === 0,
      total,
      failures,
    });
  }

  {
    const failures: string[] = [];
    let total = 0;
    for (const row of data.taskTemplates) {
      for (const choice of row.choiceEffectList) {
        for (const effect of choice.metricEffects || []) {
          total++;
          const metric = effect.metric?.trim() || "";
          if (!metric || !VALID_PROJECT_METRIC_KEYS.has(metric)) {
            failures.push(
              `${row.slug}: choiceEffectList[${choice.choiceId || "?"}].metric "${metric || "(empty)"}" 不合法`,
            );
          }
        }
      }
    }
    extraResults.push({
      name: "task-templates.choiceEffectList.metric",
      pass: failures.length === 0,
      total,
      failures,
    });
  }

  {
    const failures: string[] = [];
    let total = 0;
    for (const row of data.taskTemplates) {
      for (const item of row.milestoneEffectList) {
        total++;
        const milestone = item.milestone?.trim() || "";
        if (!milestone || !milestoneKeys.has(milestone)) {
          failures.push(
            `${row.slug}: milestoneEffectList.milestone "${milestone || "(empty)"}" 不在 MILESTONE_LABELS 中`,
          );
        }
      }
    }
    extraResults.push({
      name: "task-templates.milestoneEffectList.milestone",
      pass: failures.length === 0,
      total,
      failures,
    });
  }

  {
    const failures: string[] = [];
    let total = 0;
    for (const row of data.taskTemplates) {
      const seen = new Set<string>();
      for (const effect of row.successMetricEffects) {
        const metric = effect.metric?.trim();
        if (!metric) continue;
        total++;
        if (seen.has(metric)) {
          failures.push(`${row.slug}: successMetricEffects 重复配置 metric "${metric}"`);
        }
        seen.add(metric);
      }
    }
    extraResults.push({
      name: "task-templates.successMetricEffects.duplicate",
      pass: failures.length === 0,
      total,
      failures,
    });
  }

  {
    const failures: string[] = [];
    let total = 0;
    for (const row of data.taskTemplates) {
      const seen = new Set<string>();
      for (const effect of row.failMetricEffects) {
        const metric = effect.metric?.trim();
        if (!metric) continue;
        total++;
        if (seen.has(metric)) {
          failures.push(`${row.slug}: failMetricEffects 重复配置 metric "${metric}"`);
        }
        seen.add(metric);
      }
    }
    extraResults.push({
      name: "task-templates.failMetricEffects.duplicate",
      pass: failures.length === 0,
      total,
      failures,
    });
  }

  {
    const orphanFailures: string[] = [];
    for (const row of data.taskTemplates) {
      if (row.category !== "mainline") continue;
      if (!hasMilestoneEffectContent(row.milestoneEffectList, row.milestoneEffects)) {
        orphanFailures.push(`${row.slug}: 主线任务未配置关键节点效果`);
      }
    }
    extraWarnings.push({
      name: "task-templates.mainline.milestone (warning)",
      pass: orphanFailures.length === 0,
      total: data.taskTemplates.filter((row) => row.category === "mainline").length,
      failures: orphanFailures,
    });
  }

  {
    const orphanFailures: string[] = [];
    for (const row of data.taskTemplates) {
      if (!hasSuccessEffectContent(row.successMetricEffects, row.successEffects)) {
        orphanFailures.push(`${row.slug}: 未配置成功效果`);
      }
    }
    extraWarnings.push({
      name: "task-templates.successEffects.missing (warning)",
      pass: orphanFailures.length === 0,
      total: data.taskTemplates.length,
      failures: orphanFailures,
    });
  }

  {
    const orphanFailures: string[] = [];
    for (const row of data.taskTemplates) {
      const doc: TaskTemplateEffectDoc = {
        successEffects: row.successEffects as TaskTemplateEffectDoc["successEffects"],
        failEffects: row.failEffects as TaskTemplateEffectDoc["failEffects"],
        choiceEffects: row.choiceEffects as TaskTemplateEffectDoc["choiceEffects"],
        milestoneEffects: row.milestoneEffects as TaskTemplateEffectDoc["milestoneEffects"],
        successMetricEffects: row.successMetricEffects,
        failMetricEffects: row.failMetricEffects,
        milestoneEffectList: row.milestoneEffectList,
        choiceEffectList: row.choiceEffectList,
      };
      const mismatches = detectEffectFieldMismatches(doc);
      for (const message of mismatches) {
        orphanFailures.push(`${row.slug}: ${message}`);
      }
    }
    extraWarnings.push({
      name: "task-templates.effects.mismatch (warning)",
      pass: orphanFailures.length === 0,
      total: data.taskTemplates.length,
      failures: orphanFailures,
    });
  }

  return { results: extraResults, warnings: extraWarnings };
}

export function buildContentHealthCheckReport(data: ContentHealthCheckData): ContentHealthCheckReport {
  const mapLocationSlugs = new Set(data.mapLocations.map((row) => row.slug).filter(Boolean));
  const taskTemplateSlugs = new Set(data.taskTemplates.map((row) => row.slug).filter(Boolean));
  const eventTemplateSlugs = new Set(data.eventTemplates.map((row) => row.slug).filter(Boolean));
  const storyEntrySlugs = new Set(data.storyEntries.map((row) => row.slug).filter(Boolean));
  const npcNames = new Set(data.npcNames.filter(Boolean));
  for (const legacyName of Object.keys(LEGACY_NPC_NAME_ALIASES)) {
    npcNames.add(legacyName);
  }
  const areaNames = new Set(data.areaNames.filter(Boolean));
  const milestoneKeys = new Set(Object.keys(MILESTONE_LABELS));
  const artifactSlugs = new Set(
    (data.artifactDefinitions || []).map((row) => row.slug).filter(Boolean),
  );
  const artifactStatusMap = buildArtifactAllowedStatusMap(data.artifactDefinitions || []);

  const results: ContentHealthCheckItem[] = [];
  const warnings: ContentHealthCheckItem[] = [];

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

  if (!data.hasEventTemplatesTable) {
    results.push({
      name: "event-templates (表)",
      pass: false,
      total: 1,
      failures: ["event_templates 表不存在，请先运行 seed 或 POST /api/admin/seed"],
    });
  }

  if (data.hasEventTemplatesTable) {
    {
      const failures: string[] = [];
      const slugCounts = new Map<string, number>();
      for (const row of data.eventTemplates) {
        if (!row.slug.trim()) {
          failures.push("(unknown): slug 为空");
          continue;
        }
        slugCounts.set(row.slug, (slugCounts.get(row.slug) || 0) + 1);
      }
      for (const [slug, count] of slugCounts) {
        if (count > 1) failures.push(`${slug}: slug 重复 (${count} 次)`);
      }
      results.push({
        name: "event-templates.slug",
        pass: failures.length === 0,
        total: data.eventTemplates.length,
        failures,
      });
    }

    {
      const items: { label: string; value: string }[] = [];
      for (const row of data.eventTemplates) {
        for (const slug of row.triggerLocationSlugs) {
          items.push({ label: row.slug, value: slug });
        }
      }
      results.push(
        checkMembership("event-templates.triggerLocationSlugs", items, mapLocationSlugs),
      );
    }

    {
      const items: { label: string; value: string }[] = [];
      for (const row of data.eventTemplates) {
        for (const slug of row.triggerTaskSlugs) {
          items.push({ label: row.slug, value: slug });
        }
      }
      results.push(checkMembership("event-templates.triggerTaskSlugs", items, taskTemplateSlugs));
    }

    {
      const items: { label: string; value: string }[] = [];
      for (const row of data.eventTemplates) {
        for (const name of row.triggerNpcNames) {
          items.push({ label: row.slug, value: name });
        }
      }
      results.push(checkMembership("event-templates.triggerNpcNames", items, npcNames));
    }

    {
      const items: { label: string; value: string }[] = [];
      for (const row of data.eventTemplates) {
        for (const name of row.triggerAreaNames) {
          items.push({ label: row.slug, value: name });
        }
      }
      results.push(checkMembership("event-templates.triggerAreaNames", items, areaNames));
    }

    {
      const failures: string[] = [];
      for (const row of data.eventTemplates) {
        if (!row.inkFile.trim()) {
          failures.push(`${row.slug}: inkFile 为空`);
        }
      }
      results.push({
        name: "event-templates.inkFile",
        pass: failures.length === 0,
        total: data.eventTemplates.length,
        failures,
      });
    }

    {
      const failures: string[] = [];
      let keyCount = 0;
      for (const row of data.eventTemplates) {
        for (const key of row.unlockMilestones) {
          keyCount++;
          if (!milestoneKeys.has(key)) {
            failures.push(`${row.slug}: unlockMilestones.${key} 不在 MILESTONE_LABELS 中`);
          }
        }
      }
      results.push({
        name: "event-templates.unlockMilestones",
        pass: failures.length === 0,
        total: keyCount,
        failures,
      });
    }
  }

  if (data.artifactDefinitions && data.artifactDefinitions.length > 0) {
    {
      const failures: string[] = [];
      const slugCounts = new Map<string, number>();
      for (const row of data.artifactDefinitions) {
        if (!row.slug.trim()) {
          failures.push("(unknown): slug 为空");
          continue;
        }
        slugCounts.set(row.slug, (slugCounts.get(row.slug) || 0) + 1);
      }
      for (const [slug, count] of slugCounts) {
        if (count > 1) failures.push(`${slug}: slug 重复 (${count} 次)`);
      }
      results.push({
        name: "artifact-definitions.slug",
        pass: failures.length === 0,
        total: data.artifactDefinitions.length,
        failures,
      });
    }

    {
      const failures: string[] = [];
      let total = 0;
      for (const row of data.artifactDefinitions) {
        total++;
        const allowed = resolveAllowedStatuses({
          allowedStatuses: row.allowedStatuses.map((status) => ({ status })),
          defaultStatus: row.defaultStatus,
        }).map((item) => item.status);
        const defaultStatus = row.defaultStatus || "draft";
        if (!allowed.includes(defaultStatus)) {
          failures.push(`${row.slug}: defaultStatus "${defaultStatus}" 不在 allowedStatuses 中`);
        }
      }
      results.push({
        name: "artifact-definitions.defaultStatus",
        pass: failures.length === 0,
        total,
        failures,
      });
    }

    {
      const items: { label: string; value: string }[] = [];
      for (const row of data.artifactDefinitions) {
        for (const slug of row.sourceLocationSlugs) {
          items.push({ label: row.slug, value: slug });
        }
      }
      results.push(checkMembership("artifact-definitions.sourceLocationSlugs", items, mapLocationSlugs));
    }

    {
      const items: { label: string; value: string }[] = [];
      for (const row of data.artifactDefinitions) {
        for (const name of row.sourceNpcNames) {
          items.push({ label: row.slug, value: name });
        }
      }
      results.push(checkMembership("artifact-definitions.sourceNpcNames", items, npcNames));
    }

    {
      const failures: string[] = [];
      for (const row of data.artifactDefinitions) {
        if (row.allowedStatuses.length === 0) {
          failures.push(
            `${row.slug}: allowedStatuses 为空，运行时使用标准状态集（${STANDARD_ARTIFACT_STATUSES.map((item) => item.status).join(" → ")}）`,
          );
        }
      }
      warnings.push({
        name: "artifact-definitions.standardStatusFallback (warning)",
        pass: failures.length === 0,
        total: data.artifactDefinitions.length,
        failures,
      });
    }
  }

  if (artifactSlugs.size > 0) {
    {
      const items: { label: string; value: string }[] = [];
      for (const row of data.taskTemplates) {
        for (const effect of row.inputArtifacts || []) {
          items.push({ label: row.slug, value: effect.artifactSlug });
        }
        for (const effect of row.outputArtifacts || []) {
          items.push({ label: row.slug, value: effect.artifactSlug });
        }
      }
      results.push(checkMembership("task-templates.artifactReferences", items, artifactSlugs));
    }

    {
      const items: { label: string; value: string }[] = [];
      for (const row of data.taskTemplates) {
        for (const slug of row.prerequisiteTaskSlugs || []) {
          items.push({ label: row.slug, value: slug });
        }
      }
      results.push(checkMembership("task-templates.prerequisiteTaskSlugs", items, taskTemplateSlugs));
    }

    {
      const items: { label: string; value: string }[] = [];
      for (const row of data.eventTemplates) {
        for (const effect of row.artifactEffects || []) {
          items.push({ label: row.slug, value: effect.artifactSlug });
        }
      }
      results.push(checkMembership("event-templates.artifactEffects", items, artifactSlugs));
    }

    {
      const failures: string[] = [];
      let total = 0;
      for (const row of data.taskTemplates) {
        for (const effect of row.inputArtifacts || []) {
          if (!effect.minStatus?.trim()) continue;
          total++;
          const def = artifactStatusMap.get(effect.artifactSlug);
          if (!def) continue;
          if (!def.allowed.has(effect.minStatus.trim())) {
            failures.push(
              `${row.slug}: inputArtifacts.minStatus "${effect.minStatus}" 不在成果物 ${effect.artifactSlug} 的 allowedStatuses 中`,
            );
          }
        }
        for (const effect of row.outputArtifacts || []) {
          if (!effect.status?.trim()) continue;
          total++;
          const def = artifactStatusMap.get(effect.artifactSlug);
          if (!def) continue;
          if (!def.allowed.has(effect.status.trim())) {
            failures.push(
              `${row.slug}: outputArtifacts.status "${effect.status}" 不在成果物 ${effect.artifactSlug} 的 allowedStatuses 中`,
            );
          }
        }
      }
      for (const row of data.eventTemplates) {
        for (const effect of row.artifactEffects || []) {
          if (!effect.status?.trim()) continue;
          total++;
          const def = artifactStatusMap.get(effect.artifactSlug);
          if (!def) continue;
          if (!def.allowed.has(effect.status.trim())) {
            failures.push(
              `${row.slug}: artifactEffects.status "${effect.status}" 不在成果物 ${effect.artifactSlug} 的 allowedStatuses 中`,
            );
          }
        }
      }
      results.push({
        name: "artifact-definitions.allowedStatuses",
        pass: failures.length === 0,
        total,
        failures,
      });
    }

    {
      const failures: string[] = [];
      let total = 0;
      for (const row of data.eventTemplates) {
        for (const effect of row.taskEffects || []) {
          total++;
          if (effect.action !== "spawn") {
            failures.push(
              `${row.slug}: taskEffects.action "${effect.action}" 不受支持（本阶段仅支持 spawn）`,
            );
          }
        }
      }
      warnings.push({
        name: "event-templates.taskEffects.unsupportedAction (warning)",
        pass: failures.length === 0,
        total,
        failures,
      });
    }
  }

  if (!data.hasStoryEntriesTable) {
    results.push({
      name: "story-entries (表)",
      pass: false,
      total: 1,
      failures: ["story_entries 表不存在，请先运行 seed 或 POST /api/admin/seed"],
    });
  }

  if (data.hasStoryEntriesTable) {
    {
      const failures: string[] = [];
      const slugCounts = new Map<string, number>();
      for (const row of data.storyEntries) {
        if (!row.slug.trim()) {
          failures.push("(unknown): slug 为空");
          continue;
        }
        slugCounts.set(row.slug, (slugCounts.get(row.slug) || 0) + 1);
      }
      for (const [slug, count] of slugCounts) {
        if (count > 1) failures.push(`${slug}: slug 重复 (${count} 次)`);
      }
      results.push({
        name: "story-entries.slug",
        pass: failures.length === 0,
        total: data.storyEntries.length,
        failures,
      });
    }

    {
      const failures: string[] = [];
      for (const row of data.storyEntries) {
        if (!row.inkFile.trim()) failures.push(`${row.slug}: inkFile 为空`);
      }
      results.push({
        name: "story-entries.inkFile",
        pass: failures.length === 0,
        total: data.storyEntries.length,
        failures,
      });
    }

    {
      const failures: string[] = [];
      for (const row of data.storyEntries) {
        if (!inkSourceExists(row.inkFile)) {
          failures.push(`${row.slug}: 源文件 src/ink/stories/${row.inkFile}.ink 不存在`);
        }
      }
      results.push({
        name: "story-entries.inkSourceFile",
        pass: failures.length === 0,
        total: data.storyEntries.length,
        failures,
      });
    }

    {
      const failures: string[] = [];
      for (const row of data.storyEntries) {
        if (!inkCompiledExists(row.inkFile)) {
          failures.push(`${row.slug}: 编译产物 src/ink/stories/${row.inkFile}.json 不存在`);
        }
      }
      results.push({
        name: "story-entries.compiledFile",
        pass: failures.length === 0,
        total: data.storyEntries.length,
        failures,
      });
    }

    {
      const items: { label: string; value: string }[] = [];
      for (const row of data.taskTemplates) {
        if (row.storySlug?.trim()) {
          items.push({ label: row.slug, value: row.storySlug });
        }
      }
      results.push(checkMembership("task-templates.storySlug", items, storyEntrySlugs));
    }

    {
      const items: { label: string; value: string }[] = [];
      for (const row of data.eventTemplates) {
        if (row.storySlug?.trim()) {
          items.push({ label: row.slug, value: row.storySlug });
        }
      }
      results.push(checkMembership("event-templates.storySlug", items, storyEntrySlugs));
    }

    {
      const items: { label: string; value: string }[] = [];
      for (const row of data.locationActions) {
        if (row.storySlug?.trim()) {
          items.push({ label: row.slug, value: row.storySlug });
        }
      }
      results.push(checkMembership("location-actions.storySlug", items, storyEntrySlugs));
    }

    {
      const items: { label: string; value: string }[] = [];
      for (const row of data.storyEntries) {
        for (const slug of row.relatedTaskSlugs) {
          items.push({ label: row.slug, value: slug });
        }
      }
      results.push(checkMembership("story-entries.relatedTaskSlugs", items, taskTemplateSlugs));
    }

    {
      const items: { label: string; value: string }[] = [];
      for (const row of data.storyEntries) {
        for (const slug of row.relatedEventSlugs) {
          items.push({ label: row.slug, value: slug });
        }
      }
      results.push(checkMembership("story-entries.relatedEventSlugs", items, eventTemplateSlugs));
    }

    {
      const items: { label: string; value: string }[] = [];
      for (const row of data.storyEntries) {
        for (const slug of row.relatedLocationSlugs) {
          items.push({ label: row.slug, value: slug });
        }
      }
      results.push(checkMembership("story-entries.relatedLocationSlugs", items, mapLocationSlugs));
    }

    {
      const items: { label: string; value: string }[] = [];
      for (const row of data.storyEntries) {
        for (const name of row.relatedNpcNames) {
          items.push({ label: row.slug, value: name });
        }
      }
      results.push(checkMembership("story-entries.relatedNpcNames", items, npcNames));
    }

    {
      const referenced = new Set<string>();
      for (const row of data.taskTemplates) {
        if (row.storySlug?.trim()) referenced.add(row.storySlug.trim());
      }
      for (const row of data.eventTemplates) {
        if (row.storySlug?.trim()) referenced.add(row.storySlug.trim());
      }
      for (const row of data.locationActions) {
        if (row.storySlug?.trim()) referenced.add(row.storySlug.trim());
      }
      const orphanFailures: string[] = [];
      for (const row of data.storyEntries) {
        if (!referenced.has(row.slug)) {
          orphanFailures.push(`${row.slug}: 未被任何任务/事件/地点行动引用`);
        }
      }
      warnings.push({
        name: "story-entries.unreferenced (warning)",
        pass: orphanFailures.length === 0,
        total: data.storyEntries.length,
        failures: orphanFailures,
      });
    }
  }

  const taskEffectChecks = buildTaskTemplateHealthChecks(data, milestoneKeys);
  results.push(...taskEffectChecks.results);
  warnings.push(...taskEffectChecks.warnings);

  warnings.push(checkInkLegacyDialogueFormat(collectInkFilesForFormatCheck(data)));

  return summarizeReport(results, { warnings });
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

async function queryGroupedChildRows(
  client: Client,
  table: string,
): Promise<Map<number, Record<string, unknown>[]>> {
  const grouped = new Map<number, Record<string, unknown>[]>();
  if (!(await tableExists(client, table))) return grouped;

  const result = await client.execute(`SELECT * FROM ${table} ORDER BY _order`);
  for (const row of result.rows) {
    const parentId = row._parent_id as number;
    const list = grouped.get(parentId) || [];
    list.push(row as Record<string, unknown>);
    grouped.set(parentId, list);
  }
  return grouped;
}

function mapMetricEffectRows(rows: Record<string, unknown>[]): MetricEffectRow[] {
  return rows.map((row) => ({
    metric: String(row.metric || ""),
    value: row.value === undefined || row.value === null ? undefined : Number(row.value),
    note: row.note ? String(row.note) : undefined,
  }));
}

function mapMilestoneEffectRows(rows: Record<string, unknown>[]): MilestoneEffectRow[] {
  return rows.map((row) => ({
    milestone: String(row.milestone || ""),
    value: row.value === undefined ? true : Boolean(row.value),
  }));
}

async function loadTaskTemplateVisualEffects(client: Client, taskTemplateIds: number[]) {
  const [
    successMetricEffects,
    failMetricEffects,
    milestoneEffectList,
    choiceEffectList,
    choiceMetricEffects,
  ] = await Promise.all([
    queryGroupedChildRows(client, "task_templates_success_metric_effects"),
    queryGroupedChildRows(client, "task_templates_fail_metric_effects"),
    queryGroupedChildRows(client, "task_templates_milestone_effect_list"),
    queryGroupedChildRows(client, "task_templates_choice_effect_list"),
    queryGroupedChildRows(client, "task_templates_choice_effect_list_metric_effects"),
  ]);

  const byTaskId: Record<
    number,
    {
      successMetricEffects: MetricEffectRow[];
      failMetricEffects: MetricEffectRow[];
      milestoneEffectList: MilestoneEffectRow[];
      choiceEffectList: ChoiceEffectRow[];
    }
  > = {};

  for (const taskId of taskTemplateIds) {
    const choices = (choiceEffectList.get(taskId) || []).map((row) => {
      const choiceRowId = row.id as number;
      return {
        choiceId: String(row.choice_id || row.choiceId || ""),
        label: row.label ? String(row.label) : undefined,
        metricEffects: mapMetricEffectRows(choiceMetricEffects.get(choiceRowId) || []),
        successRateDelta:
          row.success_rate_delta !== undefined || row.successRateDelta !== undefined
            ? Number(row.success_rate_delta ?? row.successRateDelta)
            : undefined,
        note: row.note ? String(row.note) : undefined,
      };
    });

    byTaskId[taskId] = {
      successMetricEffects: mapMetricEffectRows(successMetricEffects.get(taskId) || []),
      failMetricEffects: mapMetricEffectRows(failMetricEffects.get(taskId) || []),
      milestoneEffectList: mapMilestoneEffectRows(milestoneEffectList.get(taskId) || []),
      choiceEffectList: choices,
    };
  }

  return byTaskId;
}

function mapPayloadTaskTemplateRow(
  row: Record<string, unknown>,
  visual?: {
    successMetricEffects: MetricEffectRow[];
    failMetricEffects: MetricEffectRow[];
    milestoneEffectList: MilestoneEffectRow[];
    choiceEffectList: ChoiceEffectRow[];
  },
) {
  return {
    slug: String(row.slug || "(unknown)"),
    category: String(row.category || "") || undefined,
    area: String(row.area || ""),
    inkFile: String(row.ink_file || row.inkFile || ""),
    storySlug: String(row.story_slug || row.storySlug || "") || undefined,
    milestoneEffects: parseMilestoneEffects(row.milestone_effects ?? row.milestoneEffects),
    successEffects: parseJsonRecord(row.success_effects ?? row.successEffects),
    failEffects: parseJsonRecord(row.fail_effects ?? row.failEffects),
    choiceEffects: parseJsonRecord(row.choice_effects ?? row.choiceEffects),
    successMetricEffects: visual?.successMetricEffects || [],
    failMetricEffects: visual?.failMetricEffects || [],
    milestoneEffectList: visual?.milestoneEffectList || [],
    choiceEffectList: visual?.choiceEffectList || [],
    inputArtifacts: mapInputArtifactsFromDoc(row.input_artifacts ?? row.inputArtifacts),
    outputArtifacts: mapOutputArtifactsFromDoc(row.output_artifacts ?? row.outputArtifacts),
    prerequisiteTaskSlugs: mapPrerequisiteTaskSlugsFromDoc(
      row.prerequisite_task_slugs ?? row.prerequisiteTaskSlugs,
    ),
    requiredMilestones: mapRequiredMilestonesFromDoc(
      row.required_milestones ?? row.requiredMilestones,
    ),
  };
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
  const hasEventTemplatesTable = await tableExists(client, "event_templates");
  const hasStoryEntriesTable = await tableExists(client, "story_entries");
  const [
    locationActionRows,
    mapLocationRows,
    taskTemplateRows,
    eventTemplateRows,
    storyEntryRows,
    npcRows,
    areaRows,
    locationActionTaskSlugs,
    mapLocationTaskSlugs,
    mapLocationNpcNames,
    mapLocationAreaNames,
    eventTriggerLocationSlugs,
    eventTriggerTaskSlugs,
    eventTriggerNpcNames,
    eventTriggerAreaNames,
    eventUnlockMilestones,
    storyRelatedTaskSlugs,
    storyRelatedEventSlugs,
    storyRelatedLocationSlugs,
    storyRelatedNpcNames,
    taskInputArtifacts,
    taskOutputArtifacts,
    taskPrerequisiteSlugs,
    taskRequiredMilestones,
    eventArtifactEffects,
    eventTaskEffects,
    artifactDefinitionRows,
    artifactAllowedStatuses,
    artifactSourceLocationSlugs,
    artifactSourceNpcNames,
  ] = await Promise.all([
    hasLocationActionsTable ? queryRows(client, "location_actions") : Promise.resolve([]),
    queryRows(client, "map_locations"),
    queryRows(client, "task_templates"),
    hasEventTemplatesTable ? queryRows(client, "event_templates") : Promise.resolve([]),
    hasStoryEntriesTable ? queryRows(client, "story_entries") : Promise.resolve([]),
    queryRows(client, "npcs"),
    queryRows(client, "areas"),
    queryArrayByParent(client, "location_actions_trigger_task_slugs", "slug"),
    queryArrayByParent(client, "map_locations_related_task_slugs", "slug"),
    queryArrayByParent(client, "map_locations_related_npc_names", "name"),
    queryArrayByParent(client, "map_locations_related_area_names", "name"),
    queryArrayByParent(client, "event_templates_trigger_location_slugs", "slug"),
    queryArrayByParent(client, "event_templates_trigger_task_slugs", "slug"),
    queryArrayByParent(client, "event_templates_trigger_npc_names", "name"),
    queryArrayByParent(client, "event_templates_trigger_area_names", "name"),
    queryArrayByParent(client, "event_templates_unlock_milestones", "milestone"),
    queryArrayByParent(client, "story_entries_related_task_slugs", "slug"),
    queryArrayByParent(client, "story_entries_related_event_slugs", "slug"),
    queryArrayByParent(client, "story_entries_related_location_slugs", "slug"),
    queryArrayByParent(client, "story_entries_related_npc_names", "name"),
    queryGroupedChildRows(client, "task_templates_input_artifacts"),
    queryGroupedChildRows(client, "task_templates_output_artifacts"),
    queryArrayByParent(client, "task_templates_prerequisite_task_slugs", "slug"),
    queryArrayByParent(client, "task_templates_required_milestones", "milestone"),
    queryGroupedChildRows(client, "event_templates_artifact_effects"),
    queryGroupedChildRows(client, "event_templates_task_effects"),
    queryRows(client, "artifact_definitions"),
    queryGroupedChildRows(client, "artifact_definitions_allowed_statuses"),
    queryGroupedChildRows(client, "artifact_definitions_source_location_slugs"),
    queryGroupedChildRows(client, "artifact_definitions_source_npc_names"),
  ]);

  const taskTemplateIds = taskTemplateRows.map((row) => row.id as number);
  const visualEffects = await loadTaskTemplateVisualEffects(client, taskTemplateIds);

  const data: ContentHealthCheckData = {
    hasLocationActionsTable,
    hasEventTemplatesTable,
    hasStoryEntriesTable,
    locationActions: locationActionRows.map((row) => ({
      slug: String(row.slug || ""),
      locationSlug: String(row.location_slug || ""),
      triggerTaskSlugs: locationActionTaskSlugs.get(row.id as number) || [],
      storySlug: String(row.story_slug || row.storySlug || "") || undefined,
    })),
    mapLocations: mapLocationRows.map((row) => ({
      slug: String(row.slug || ""),
      relatedTaskSlugs: mapLocationTaskSlugs.get(row.id as number) || [],
      relatedNpcNames: mapLocationNpcNames.get(row.id as number) || [],
      relatedAreaNames: mapLocationAreaNames.get(row.id as number) || [],
    })),
    taskTemplates: taskTemplateRows.map((row) => {
      const id = row.id as number;
      return {
        ...mapPayloadTaskTemplateRow(row, visualEffects[id]),
        inputArtifacts: mapInputArtifactsFromGrouped(taskInputArtifacts.get(id)),
        outputArtifacts: mapOutputArtifactsFromGrouped(taskOutputArtifacts.get(id)),
        prerequisiteTaskSlugs: taskPrerequisiteSlugs.get(id) || [],
        requiredMilestones: taskRequiredMilestones.get(id) || [],
      };
    }),
    eventTemplates: eventTemplateRows.map((row) => {
      const id = row.id as number;
      return {
        slug: String(row.slug || "(unknown)"),
        inkFile: String(row.ink_file || row.inkFile || ""),
        storySlug: String(row.story_slug || row.storySlug || "") || undefined,
        triggerLocationSlugs: eventTriggerLocationSlugs.get(id) || [],
        triggerTaskSlugs: eventTriggerTaskSlugs.get(id) || [],
        triggerNpcNames: eventTriggerNpcNames.get(id) || [],
        triggerAreaNames: eventTriggerAreaNames.get(id) || [],
        unlockMilestones: eventUnlockMilestones.get(id) || [],
        artifactEffects: mapArtifactEffectsFromGrouped(eventArtifactEffects.get(id)),
        taskEffects: mapTaskEffectsFromDoc(eventTaskEffects.get(id)),
      };
    }),
    storyEntries: storyEntryRows.map((row) => ({
      slug: String(row.slug || "(unknown)"),
      inkFile: String(row.ink_file || row.inkFile || ""),
      relatedTaskSlugs: storyRelatedTaskSlugs.get(row.id as number) || [],
      relatedEventSlugs: storyRelatedEventSlugs.get(row.id as number) || [],
      relatedLocationSlugs: storyRelatedLocationSlugs.get(row.id as number) || [],
      relatedNpcNames: storyRelatedNpcNames.get(row.id as number) || [],
    })),
    npcNames: npcRows.map((row) => String(row.name || "")).filter(Boolean),
    areaNames: areaRows.map((row) => String(row.name || "")).filter(Boolean),
    artifactDefinitions: artifactDefinitionRows.map((row) => {
      const id = row.id as number;
      return {
        slug: String(row.slug || ""),
        defaultStatus: String(row.default_status || row.defaultStatus || "draft"),
        allowedStatuses: (artifactAllowedStatuses.get(id) || [])
          .map((child) => String(child.status || "").trim())
          .filter(Boolean),
        sourceLocationSlugs: (artifactSourceLocationSlugs.get(id) || [])
          .map((child) => String(child.slug || "").trim())
          .filter(Boolean),
        sourceNpcNames: (artifactSourceNpcNames.get(id) || [])
          .map((child) => String(child.name || "").trim())
          .filter(Boolean),
      };
    }),
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
      eventTemplatesResult,
      storyEntriesResult,
      npcsResult,
      areasResult,
      artifactDefinitionsResult,
    ] = await Promise.all([
      payload.find({ collection: "location-actions", limit: 500 }),
      payload.find({ collection: "map-locations", limit: 500 }),
      payload.find({ collection: "task-templates", limit: 500 }),
      payload.find({ collection: "event-templates", limit: 500 }),
      payload.find({ collection: "story-entries", limit: 500 }),
      payload.find({ collection: "npcs", limit: 500 }),
      payload.find({ collection: "areas", limit: 500 }),
      payload.find({ collection: "artifact-definitions", limit: 500 }),
    ]);

    const data: ContentHealthCheckData = {
      hasLocationActionsTable: true,
      hasEventTemplatesTable: true,
      hasStoryEntriesTable: true,
      locationActions: locationActionsResult.docs.map((doc) => ({
        slug: String(doc.slug || ""),
        locationSlug: String(doc.locationSlug || ""),
        triggerTaskSlugs:
          (doc.triggerTaskSlugs as { slug: string }[] | null)?.map((item) => item.slug).filter(Boolean) ||
          [],
        storySlug: doc.storySlug ? String(doc.storySlug) : undefined,
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
      taskTemplates: taskTemplatesResult.docs.map((doc) =>
        mapPayloadTaskTemplateRow(doc as Record<string, unknown>, {
          successMetricEffects: (doc.successMetricEffects as MetricEffectRow[] | null) || [],
          failMetricEffects: (doc.failMetricEffects as MetricEffectRow[] | null) || [],
          milestoneEffectList: (doc.milestoneEffectList as MilestoneEffectRow[] | null) || [],
          choiceEffectList: (doc.choiceEffectList as ChoiceEffectRow[] | null) || [],
        }),
      ),
      eventTemplates: eventTemplatesResult.docs.map((doc) => ({
        slug: String(doc.slug || "(unknown)"),
        inkFile: String(doc.inkFile || ""),
        storySlug: doc.storySlug ? String(doc.storySlug) : undefined,
        triggerLocationSlugs:
          (doc.triggerLocationSlugs as { slug: string }[] | null)
            ?.map((item) => item.slug)
            .filter(Boolean) || [],
        triggerTaskSlugs:
          (doc.triggerTaskSlugs as { slug: string }[] | null)
            ?.map((item) => item.slug)
            .filter(Boolean) || [],
        triggerNpcNames:
          (doc.triggerNpcNames as { name: string }[] | null)
            ?.map((item) => item.name)
            .filter(Boolean) || [],
        triggerAreaNames:
          (doc.triggerAreaNames as { name: string }[] | null)
            ?.map((item) => item.name)
            .filter(Boolean) || [],
        unlockMilestones:
          (doc.unlockMilestones as { milestone: string }[] | null)
            ?.map((item) => item.milestone)
            .filter(Boolean) || [],
        artifactEffects: mapArtifactEffectsFromDoc(doc.artifactEffects),
        taskEffects: mapTaskEffectsFromDoc(doc.taskEffects),
      })),
      storyEntries: storyEntriesResult.docs.map((doc) => ({
        slug: String(doc.slug || "(unknown)"),
        inkFile: String(doc.inkFile || ""),
        relatedTaskSlugs:
          (doc.relatedTaskSlugs as { slug: string }[] | null)
            ?.map((item) => item.slug)
            .filter(Boolean) || [],
        relatedEventSlugs:
          (doc.relatedEventSlugs as { slug: string }[] | null)
            ?.map((item) => item.slug)
            .filter(Boolean) || [],
        relatedLocationSlugs:
          (doc.relatedLocationSlugs as { slug: string }[] | null)
            ?.map((item) => item.slug)
            .filter(Boolean) || [],
        relatedNpcNames:
          (doc.relatedNpcNames as { name: string }[] | null)
            ?.map((item) => item.name)
            .filter(Boolean) || [],
      })),
      npcNames: npcsResult.docs.map((doc) => String(doc.name || "")).filter(Boolean),
      areaNames: areasResult.docs.map((doc) => String(doc.name || "")).filter(Boolean),
      artifactDefinitions: artifactDefinitionsResult.docs.map((doc) => ({
        slug: String(doc.slug || ""),
        defaultStatus: String(doc.defaultStatus || "draft"),
        allowedStatuses:
          (doc.allowedStatuses as { status: string }[] | null)
            ?.map((item) => item.status)
            .filter(Boolean) || [],
        sourceLocationSlugs:
          (doc.sourceLocationSlugs as { slug: string }[] | null)
            ?.map((item) => item.slug)
            .filter(Boolean) || [],
        sourceNpcNames:
          (doc.sourceNpcNames as { name: string }[] | null)
            ?.map((item) => item.name)
            .filter(Boolean) || [],
      })),
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
    hasEventTemplatesTable: studio.overview.eventTemplates > 0,
    hasStoryEntriesTable: studio.overview.storyEntries > 0,
    locationActions: studio.locationActions.map((action) => ({
      slug: action.id,
      locationSlug: action.locationId,
      triggerTaskSlugs: action.triggerTaskSlugs || [],
      storySlug: action.storySlug,
    })),
    mapLocations: studio.mapLocations.map((location) => ({
      slug: location.id,
      relatedTaskSlugs: location.relatedTaskSlugs || [],
      relatedNpcNames: location.relatedNpcNames || [],
      relatedAreaNames: location.relatedAreaNames || [],
    })),
    taskTemplates: studio.taskTemplates.map((template) => ({
      slug: template.slug,
      category: template.category,
      area: template.area || "",
      inkFile: template.inkFile || "",
      storySlug: template.storySlug,
      milestoneEffects: (template.milestoneEffects as Record<string, unknown> | null) || {},
      successEffects: (template.successEffects as Record<string, unknown> | null) || {},
      failEffects: (template.failEffects as Record<string, unknown> | null) || {},
      choiceEffects: (template.choiceEffects as Record<string, unknown> | null) || {},
      successMetricEffects: [],
      failMetricEffects: [],
      milestoneEffectList: [],
      choiceEffectList: [],
      inputArtifacts: template.inputArtifacts?.map((item) => ({
        artifactSlug: item.artifactSlug,
        minStatus: item.minStatus,
      })),
      outputArtifacts: template.outputArtifacts?.map((item) => ({
        artifactSlug: item.artifactSlug,
        status: item.status,
      })),
      prerequisiteTaskSlugs: template.prerequisiteTaskSlugs,
      requiredMilestones: template.requiredMilestones,
    })),
    eventTemplates: studio.eventTemplates.map((event) => ({
      slug: event.slug,
      inkFile: event.inkFile || "",
      storySlug: event.storySlug,
      triggerLocationSlugs: event.triggerLocationSlugs || [],
      triggerTaskSlugs: event.triggerTaskSlugs || [],
      triggerNpcNames: event.triggerNpcNames || [],
      triggerAreaNames: event.triggerAreaNames || [],
      unlockMilestones: event.unlockMilestones || [],
      artifactEffects: event.artifactEffects?.map((item) => ({
        artifactSlug: item.artifactSlug,
        status: item.status,
      })),
      taskEffects: event.taskEffects?.map((item) => ({
        action: item.action,
        taskSlug: item.taskSlug,
      })),
    })),
    storyEntries: studio.storyEntries.map((entry) => ({
      slug: entry.slug,
      inkFile: entry.inkFile,
      relatedTaskSlugs: entry.relatedTaskSlugs || [],
      relatedEventSlugs: entry.relatedEventSlugs || [],
      relatedLocationSlugs: entry.relatedLocationSlugs || [],
      relatedNpcNames: entry.relatedNpcNames || [],
    })),
    npcNames: studio.npcs.map((npc) => npc.name),
    areaNames: studio.areas.map((area) => area.name),
    artifactDefinitions: studio.artifactDefinitions.map((artifact) => ({
      slug: artifact.slug,
      defaultStatus: artifact.defaultStatus || "draft",
      allowedStatuses: (artifact.allowedStatuses || []).map((item) => item.status),
      sourceLocationSlugs: artifact.sourceLocationSlugs || [],
      sourceNpcNames: artifact.sourceNpcNames || [],
    })),
  });
}
