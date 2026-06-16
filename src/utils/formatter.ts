import type { Job } from "@/game/prisma-types";

export const JOB_LABELS: Record<Job, string> = {
  DOCUMENT_ASSISTANT: "资料员助理",
  CONSTRUCTION_ASSISTANT: "施工员助理",
  SAFETY_ASSISTANT: "安全员助理",
  MECHANICAL_ASSISTANT: "机电助理",
  COST_ASSISTANT: "造价助理",
  MATERIAL_ASSISTANT: "材料员助理",
  QUALITY_ASSISTANT: "质量员助理",
};

export const RARITY_LABELS: Record<string, string> = {
  R: "R",
  SR: "SR",
  SSR: "SSR",
  UR: "UR",
};

export function formatMetricDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

export const RESOLUTION_MODE_LABELS: Record<string, string> = {
  SOLO: "单人任务",
  VOTE: "多人投票",
  ROLE_CHECKLIST: "岗位协作",
};

export function getLatentRiskLabel(value: number): string {
  if (value <= 30) return "可控";
  if (value <= 60) return "需关注";
  if (value <= 80) return "偏高";
  return "危险";
}

export function formatDate(date: Date): string {
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
