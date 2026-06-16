export type ResolutionMode = "SOLO" | "VOTE" | "ROLE_CHECKLIST";

export type MetricKey =
  | "progress"
  | "quality"
  | "safety"
  | "cost"
  | "dataIntegrity"
  | "fireRisk"
  | "ownerTrust"
  | "propertyHandover"
  | "spirit"
  | "latentRisk"
  | "merchantSatisfaction";

export type MetricEffects = Partial<Record<MetricKey, number>>;

export type ChoiceEffectsMap = Record<string, MetricEffects>;

export interface TaskTemplateData {
  slug: string;
  title: string;
  description?: string;
  rarity: string;
  sourceType: string;
  sourceName?: string;
  area: string;
  npcList?: string[];
  requiredJobs?: string[];
  requiredCount?: number;
  deadlineHours?: number;
  inkFile: string;
  baseSuccessRate?: number;
  successEffects?: MetricEffects;
  failEffects?: MetricEffects;
  choiceEffects?: ChoiceEffectsMap;
  triggerBroadcast?: boolean;
  resolutionMode?: ResolutionMode;
  minResolveCount?: number;
}

export interface AchievementTemplateData {
  slug: string;
  name: string;
  description: string;
  conditionType: string;
  conditionValue: Record<string, unknown>;
  rewardConfig?: Record<string, unknown>;
  broadcastEnabled?: boolean;
}

export const METRIC_LABELS: Record<string, string> = {
  progress: "总进度",
  quality: "质量",
  safety: "安全",
  cost: "成本",
  dataIntegrity: "资料完整度",
  fireRisk: "消防风险",
  ownerTrust: "甲方信任",
  propertyHandover: "物业接管度",
  latentRisk: "潜在风险",
};
