import type { ProjectStageId } from "@/game/projectStages";
import type { ConfigurableMetricKey } from "@/game/metricConfig";

export type ResolutionMode = "SOLO" | "VOTE" | "ROLE_CHECKLIST";

/** 与 PROJECT_METRIC_OPTIONS 一致，并保留 progress / stageProgress 兼容字段 */
export type MetricKey = ConfigurableMetricKey | "progress" | "stageProgress";

export type MetricEffects = Partial<Record<MetricKey, number>>;

export type ChoiceEffectsMap = Record<string, MetricEffects>;

export type ArtifactType =
  | "document"
  | "deliverable"
  | "permit"
  | "report"
  | "decision"
  | "asset";

export type ArtifactStatusEntry = {
  status: string;
  label?: string;
};

export interface ArtifactDefinitionData {
  slug: string;
  name: string;
  artifactType: ArtifactType;
  stage?: ProjectStageId;
  description?: string;
  reusable?: boolean;
  versioned?: boolean;
  expires?: number;
  defaultStatus?: string;
  allowedStatuses?: ArtifactStatusEntry[];
  sourceNpcNames?: string[];
  sourceLocationSlugs?: string[];
  tags?: string[];
  enabled?: boolean;
  payloadDocId?: string | number;
}

export interface ArtifactRequirement {
  artifactSlug: string;
  minStatus?: string;
  quantity?: number;
}

export interface ArtifactEffect {
  artifactSlug: string;
  status: string;
  versionBump?: boolean;
  metadata?: Record<string, unknown>;
}

export type TaskBlockPolicy = "hard_block" | "warn_only";

export interface ProjectArtifactRecord {
  id: string;
  seasonId: string;
  artifactSlug: string;
  status: string;
  version: number;
  metadata?: Record<string, unknown>;
  producedAt: Date;
  updatedAt: Date;
  expiresAt?: Date | null;
}

export type MissingArtifactInfo = {
  slug: string;
  name: string;
  required: string;
  actual: string | null;
};

export interface DependencyEvaluationResult {
  available: boolean;
  missingArtifacts: MissingArtifactInfo[];
  missingTasks: string[];
  missingMilestones: string[];
  blockingReasons: string[];
}

export interface DependencyContext {
  seasonId: string;
  completedTaskSlugs: string[];
  milestones: Record<string, boolean>;
  artifactStatuses: Record<string, string | null>;
}

export type EventTaskEffect = {
  action: "spawn";
  taskSlug: string;
};

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
  inputArtifacts?: ArtifactRequirement[];
  outputArtifacts?: ArtifactEffect[];
  prerequisiteTaskSlugs?: string[];
  requiredMilestones?: string[];
  blockPolicy?: TaskBlockPolicy;
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
  artifactEffects?: ArtifactEffect[];
  taskEffects?: EventTaskEffect[];
  metricEffects?: MetricEffects;
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
