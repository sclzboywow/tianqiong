import type { ProjectStageId } from "@/game/projectStages";

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
  | "stageProgress"
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
  storySlug?: string;
  baseSuccessRate?: number;
  successEffects?: MetricEffects;
  failEffects?: MetricEffects;
  choiceEffects?: ChoiceEffectsMap;
  triggerBroadcast?: boolean;
  resolutionMode?: ResolutionMode;
  minResolveCount?: number;
  stage?: ProjectStageId;
  milestoneEffects?: Record<string, boolean>;
  category?: string;
}

export interface EventTemplateData {
  slug: string;
  title: string;
  description?: string;
  rarity: string;
  area?: string;
  eventType?: string;
  inkFile: string;
  storySlug?: string;
  npcList?: string[];
  recommendedJobs?: string[];
  baseSuccessRate?: number;
  triggerBroadcast?: boolean;
  triggerStage?: ProjectStageId;
  triggerLocationSlugs?: string[];
  triggerAreaNames?: string[];
  triggerNpcNames?: string[];
  riskTags?: string[];
  unlockMilestones?: string[];
  minDay?: number;
  maxDay?: number;
  weight?: number;
  onceOnly?: boolean;
  cooldownDays?: number;
  triggerTaskSlugs?: string[];
  resultText?: string;
  noTaskText?: string;
  enabled?: boolean;
  payloadDocId?: string | number;
}

export type StoryEntryStatus = "draft" | "published";
export type StoryEntryType =
  | "mainline_stage"
  | "task_story"
  | "event_story"
  | "location_story"
  | "npc_dialogue"
  | "ending";

export interface StoryEntryData {
  slug: string;
  title: string;
  description?: string;
  storyType: StoryEntryType;
  status: StoryEntryStatus;
  inkFile: string;
  compiledFile?: string;
  startKnot?: string;
  stage?: ProjectStageId;
  relatedLocationSlugs?: string[];
  relatedTaskSlugs?: string[];
  relatedEventSlugs?: string[];
  relatedNpcNames?: string[];
  tags?: string[];
  previewText?: string;
  estimatedMinutes?: number;
  sortOrder?: number;
  enabled?: boolean;
  payloadDocId?: string | number;
}

export interface AchievementTemplateData {
  slug: string;
  name: string;
  description: string;
  conditionType: string;
  conditionValue: Record<string, unknown>;
  rewardConfig?: Record<string, unknown>;
  broadcastEnabled?: boolean;
  category?: string;
}

export const METRIC_LABELS: Record<string, string> = {
  progress: "总进度",
  quality: "质量",
  safety: "安全",
  cost: "成本压力",
  dataIntegrity: "资料完整度",
  fireRisk: "消防风险",
  ownerTrust: "甲方信任",
  propertyHandover: "物业接管度",
  latentRisk: "潜在风险",
  stageProgress: "阶段进度",
};
