import { VALID_PROJECT_METRIC_KEYS } from "./metricConfig";
import type { ChoiceEffectsMap, MetricEffects, TaskTemplateData } from "./types";

export type MetricEffectRow = {
  metric?: string;
  value?: number;
  note?: string;
};

export type MilestoneEffectRow = {
  milestone?: string;
  value?: boolean;
};

export type ChoiceMetricEffectRow = {
  metric?: string;
  value?: number;
};

export type ChoiceEffectRow = {
  choiceId?: string;
  label?: string;
  metricEffects?: ChoiceMetricEffectRow[];
  successRateDelta?: number;
  note?: string;
};

export type TaskTemplateEffectDoc = {
  successEffects?: MetricEffects | null;
  failEffects?: MetricEffects | null;
  choiceEffects?: ChoiceEffectsMap | null;
  milestoneEffects?: Record<string, boolean> | null;
  successMetricEffects?: MetricEffectRow[] | null;
  failMetricEffects?: MetricEffectRow[] | null;
  milestoneEffectList?: MilestoneEffectRow[] | null;
  choiceEffectList?: ChoiceEffectRow[] | null;
};

function parseJsonObject<T extends Record<string, unknown>>(raw: unknown): T | undefined {
  if (typeof raw === "string" && raw.trim()) {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as T;
  }
  return undefined;
}

function hasRows<T>(rows: T[] | null | undefined): rows is T[] {
  return Array.isArray(rows) && rows.length > 0;
}

export function buildMetricEffectsFromRows(rows: MetricEffectRow[] | null | undefined): MetricEffects {
  const effects: MetricEffects = {};
  if (!rows) return effects;

  for (const row of rows) {
    const metric = row.metric?.trim();
    if (!metric || row.value === undefined || row.value === null) continue;
    effects[metric as keyof MetricEffects] = row.value;
  }
  return effects;
}

export function buildMilestoneEffectsFromRows(
  rows: MilestoneEffectRow[] | null | undefined,
): Record<string, boolean> {
  const effects: Record<string, boolean> = {};
  if (!rows) return effects;

  for (const row of rows) {
    const milestone = row.milestone?.trim();
    if (!milestone) continue;
    effects[milestone] = row.value !== false;
  }
  return effects;
}

export function buildChoiceEffectsFromRows(
  rows: ChoiceEffectRow[] | null | undefined,
): ChoiceEffectsMap {
  const effects: ChoiceEffectsMap = {};
  if (!rows) return effects;

  for (const row of rows) {
    const choiceId = row.choiceId?.trim();
    if (!choiceId) continue;
    effects[choiceId] = buildMetricEffectsFromRows(row.metricEffects);
  }
  return effects;
}

function normalizeMetricEffects(raw: unknown): MetricEffects {
  return parseJsonObject<MetricEffects>(raw) || {};
}

function normalizeMilestoneEffects(raw: unknown): Record<string, boolean> {
  const parsed = parseJsonObject<Record<string, boolean>>(raw);
  if (!parsed) return {};
  const effects: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (value) effects[key] = true;
  }
  return effects;
}

function normalizeChoiceEffects(raw: unknown): ChoiceEffectsMap {
  return parseJsonObject<ChoiceEffectsMap>(raw) || {};
}

function metricEffectsEqual(a: MetricEffects, b: MetricEffects): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key as keyof MetricEffects] ?? null) !== (b[key as keyof MetricEffects] ?? null)) {
      return false;
    }
  }
  return true;
}

function milestoneEffectsEqual(a: Record<string, boolean>, b: Record<string, boolean>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (Boolean(a[key]) !== Boolean(b[key])) return false;
  }
  return true;
}

function choiceEffectsEqual(a: ChoiceEffectsMap, b: ChoiceEffectsMap): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (!metricEffectsEqual(a[key] || {}, b[key] || {})) return false;
  }
  return true;
}

export function resolveTaskTemplateEffects(doc: TaskTemplateEffectDoc): {
  successEffects: MetricEffects;
  failEffects: MetricEffects;
  choiceEffects: ChoiceEffectsMap;
  milestoneEffects: Record<string, boolean>;
} {
  const jsonSuccess = normalizeMetricEffects(doc.successEffects);
  const jsonFail = normalizeMetricEffects(doc.failEffects);
  const jsonChoice = normalizeChoiceEffects(doc.choiceEffects);
  const jsonMilestone = normalizeMilestoneEffects(doc.milestoneEffects);

  const fromSuccessRows = buildMetricEffectsFromRows(doc.successMetricEffects);
  const fromFailRows = buildMetricEffectsFromRows(doc.failMetricEffects);
  const fromChoiceRows = buildChoiceEffectsFromRows(doc.choiceEffectList);
  const fromMilestoneRows = buildMilestoneEffectsFromRows(doc.milestoneEffectList);

  return {
    successEffects: hasRows(doc.successMetricEffects) ? fromSuccessRows : jsonSuccess,
    failEffects: hasRows(doc.failMetricEffects) ? fromFailRows : jsonFail,
    choiceEffects: hasRows(doc.choiceEffectList) ? fromChoiceRows : jsonChoice,
    milestoneEffects: hasRows(doc.milestoneEffectList) ? fromMilestoneRows : jsonMilestone,
  };
}

export function isValidProjectMetric(metric: string): boolean {
  return VALID_PROJECT_METRIC_KEYS.has(metric);
}

export function detectEffectFieldMismatches(doc: TaskTemplateEffectDoc): string[] {
  const warnings: string[] = [];
  const resolved = resolveTaskTemplateEffects(doc);

  if (hasRows(doc.successMetricEffects)) {
    const fromJson = normalizeMetricEffects(doc.successEffects);
    if (Object.keys(fromJson).length > 0 && !metricEffectsEqual(fromJson, resolved.successEffects)) {
      warnings.push("successMetricEffects 与 successEffects JSON 不一致");
    }
  }

  if (hasRows(doc.failMetricEffects)) {
    const fromJson = normalizeMetricEffects(doc.failEffects);
    if (Object.keys(fromJson).length > 0 && !metricEffectsEqual(fromJson, resolved.failEffects)) {
      warnings.push("failMetricEffects 与 failEffects JSON 不一致");
    }
  }

  if (hasRows(doc.milestoneEffectList)) {
    const fromJson = normalizeMilestoneEffects(doc.milestoneEffects);
    if (Object.keys(fromJson).length > 0 && !milestoneEffectsEqual(fromJson, resolved.milestoneEffects)) {
      warnings.push("milestoneEffectList 与 milestoneEffects JSON 不一致");
    }
  }

  if (hasRows(doc.choiceEffectList)) {
    const fromJson = normalizeChoiceEffects(doc.choiceEffects);
    if (Object.keys(fromJson).length > 0 && !choiceEffectsEqual(fromJson, resolved.choiceEffects)) {
      warnings.push("choiceEffectList 与 choiceEffects JSON 不一致");
    }
  }

  return warnings;
}

export function applyResolvedEffectsToTemplate(
  template: TaskTemplateData,
  doc: TaskTemplateEffectDoc,
): TaskTemplateData {
  const resolved = resolveTaskTemplateEffects(doc);
  return {
    ...template,
    successEffects: resolved.successEffects,
    failEffects: resolved.failEffects,
    choiceEffects: resolved.choiceEffects,
    milestoneEffects: resolved.milestoneEffects,
  };
}

export function metricEffectsToRows(effects?: MetricEffects | null): MetricEffectRow[] {
  if (!effects) return [];
  return Object.entries(effects)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([metric, value]) => ({ metric, value }));
}

export function milestoneEffectsToRows(
  effects?: Record<string, boolean> | null,
): MilestoneEffectRow[] {
  if (!effects) return [];
  return Object.entries(effects)
    .filter(([, enabled]) => enabled)
    .map(([milestone]) => ({ milestone, value: true }));
}

export function choiceEffectsToRows(effects?: ChoiceEffectsMap | null): ChoiceEffectRow[] {
  if (!effects) return [];
  return Object.entries(effects).map(([choiceId, metricEffects]) => ({
    choiceId,
    metricEffects: metricEffectsToRows(metricEffects),
  }));
}
