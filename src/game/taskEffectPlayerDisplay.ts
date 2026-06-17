import { PROJECT_METRIC_OPTIONS } from "./metricConfig";
import type { MetricEffects } from "./types";
import { METRIC_LABELS } from "./types";
import { MILESTONE_LABELS } from "./projectStages";

const METRIC_LABEL_MAP: Record<string, string> = {
  ...METRIC_LABELS,
  ...Object.fromEntries(PROJECT_METRIC_OPTIONS.map((option) => [option.key, option.label])),
};

const GOOD_DIRECTION_MAP = Object.fromEntries(
  PROJECT_METRIC_OPTIONS.map((option) => [option.key, option.goodDirection]),
) as Record<string, "up" | "down">;

export type PlayerEffectLine = {
  text: string;
  tone: "positive" | "negative" | "neutral";
};

function isEffectPositive(metricKey: string, delta: number): boolean {
  const direction = GOOD_DIRECTION_MAP[metricKey] || "up";
  if (direction === "up") return delta > 0;
  return delta < 0;
}

export function formatPlayerMetricEffectLines(
  effects?: MetricEffects | null,
  maxLines = 3,
): PlayerEffectLine[] {
  if (!effects) return [];

  const lines = Object.entries(effects)
    .filter((entry): entry is [string, number] => entry[1] !== undefined && entry[1] !== 0)
    .map(([key, value]) => {
      const label = METRIC_LABEL_MAP[key] || key;
      const signed = value > 0 ? `+${value}` : `${value}`;
      const tone: PlayerEffectLine["tone"] =
        value === 0 ? "neutral" : isEffectPositive(key, value) ? "positive" : "negative";
      return { text: `${label} ${signed}`, tone };
    });

  return lines.slice(0, maxLines);
}

export function formatPlayerMetricEffectLinesFromRecord(
  effects?: Record<string, number> | null,
  maxLines = 6,
): PlayerEffectLine[] {
  if (!effects) return [];
  return formatPlayerMetricEffectLines(effects as MetricEffects, maxLines);
}

export function formatPlayerMilestoneLabels(
  milestoneEffects?: Record<string, boolean> | null,
  maxLabels = 2,
): string[] {
  if (!milestoneEffects) return [];
  return Object.entries(milestoneEffects)
    .filter(([, enabled]) => enabled)
    .map(([key]) => MILESTONE_LABELS[key] || key)
    .slice(0, maxLabels);
}

export function sanitizeTaskLogContent(content: string): string {
  return content
    .replace(/^【角色成长】/, "")
    .replace(/，最终方案：[^，]+/, "，已完成结算")
    .trim();
}
