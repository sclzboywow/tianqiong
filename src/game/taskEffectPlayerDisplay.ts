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

const CHOICE_ID_LABELS: Record<string, string> = {
  steady_push: "稳健推进",
  fast_push: "加快节奏",
  delay_coord: "延后协调",
  immediate_fix: "立即整改",
  schedule_fix: "计划整改",
  ignore_sign: "暂缓处理",
};

/** 玩家日志正文清理：去除技术 slug 与枚举 */
export function sanitizePlayerLogContent(content: string): string {
  let text = sanitizeTaskLogContent(content)
    .replace(/^【协同地图】/, "")
    .replace(/^【事件池】/, "")
    .replace(/【([^】]+)】/g, "「$1」")
    .replace(/最终方案：([a-z_]+)/gi, (_, choiceId: string) => {
      const label = CHOICE_ID_LABELS[choiceId.toLowerCase()] ?? "已提交方案";
      return `最终方案：${label}`;
    });

  for (const [job, label] of Object.entries({
    DOCUMENT_ASSISTANT: "资料员助理",
    CONSTRUCTION_ASSISTANT: "施工员助理",
    SAFETY_ASSISTANT: "安全员助理",
    MECHANICAL_ASSISTANT: "机电助理",
    COST_ASSISTANT: "造价助理",
    MATERIAL_ASSISTANT: "材料员助理",
    QUALITY_ASSISTANT: "质量员助理",
  })) {
    text = text.replace(new RegExp(`\\b${job}\\b`, "g"), label);
  }

  return text
    .replace(/\b[a-z]+_[a-z0-9_]+\b/gi, "")
    .replace(/\blocationId\b[^\s,。]*/gi, "")
    .replace(/\btemplateId\b[^\s,。]*/gi, "")
    .replace(/\beventSlug\b[^\s,。]*/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/，+/g, "，")
    .replace(/^，|，$/g, "")
    .trim();
}
