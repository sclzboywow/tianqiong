import { METRIC_LABELS_FROM_CONFIG } from "./metricConfig";
import { METRIC_LABELS } from "./types";
import type { ChoiceEffectsMap, MetricEffects, TaskTemplateData } from "./types";
import { MILESTONE_LABELS } from "./projectStages";

const METRIC_LABEL_MAP: Record<string, string> = {
  ...METRIC_LABELS,
  ...METRIC_LABELS_FROM_CONFIG,
};

export function formatMetricEffectLines(effects?: MetricEffects): string[] {
  if (!effects || Object.keys(effects).length === 0) return ["—"];
  return Object.entries(effects).map(
    ([key, value]) => `${METRIC_LABEL_MAP[key] || key} ${value > 0 ? "+" : ""}${value}`,
  );
}

export function formatMilestoneEffectLines(effects?: Record<string, boolean>): string[] {
  if (!effects || Object.keys(effects).length === 0) return ["—"];
  return Object.entries(effects)
    .filter(([, enabled]) => enabled)
    .map(([key]) => `解锁「${MILESTONE_LABELS[key] || key}」`);
}

export function formatChoiceEffectLines(choiceEffects?: ChoiceEffectsMap): string[] {
  if (!choiceEffects || Object.keys(choiceEffects).length === 0) return ["—"];
  return Object.entries(choiceEffects).map(([choiceId, effects]) => {
    const parts = formatMetricEffectLines(effects).filter((line) => line !== "—");
    return parts.length > 0
      ? `${choiceId}：${parts.join("，")}`
      : `${choiceId}：无指标变化`;
  });
}

export function formatResolutionMode(mode?: string): string {
  const labels: Record<string, string> = {
    SOLO: "单人结算",
    VOTE: "投票结算",
    ROLE_CHECKLIST: "岗位清单结算",
  };
  return mode ? labels[mode] || mode : "—";
}

export function summarizeTaskTemplateEffects(template: TaskTemplateData) {
  return {
    success: formatMetricEffectLines(template.successEffects),
    fail: formatMetricEffectLines(template.failEffects),
    milestones: formatMilestoneEffectLines(template.milestoneEffects),
    choices: formatChoiceEffectLines(template.choiceEffects),
  };
}
