import type { ProjectState } from "@prisma/client";
import { JOB_LABELS } from "@/utils/formatter";
import type { Job } from "@/game/prisma-types";
import { createStory, getStoryState } from "@/ink/inkRunner";
import { getTaskTemplates } from "./contentLoader";
import type { GameLogSummary } from "./logEngine";
import { getRecentLogsForTask } from "./logEngine";
import { resolveInkFileFromStorySlug } from "./storyEntryLoader";
import { getStageDisplayName } from "./projectStages";
import type { MetricEffects } from "./types";
import type { MapLocation } from "@/data/locations";
import type { LocationAction } from "@/data/locationActions";
import {
  buildTaskItem,
  buildTemplateToLocationIdMap,
  buildTemplateToLocationNameMap,
  type TaskItemType,
  type TaskWithParticipants,
} from "./taskPresentationEngine";
import type { PlayerEffectLine } from "./taskEffectPlayerDisplay";

export type TaskStoryChoice = {
  index: number;
  text: string;
  choiceId: string;
};

export type TaskStoryState = {
  lines: string[];
  choices: TaskStoryChoice[];
  ended: boolean;
};

export type TaskDetailParticipant = {
  id: string;
  nickname: string;
  jobLabel: string;
  hasSubmitted: boolean;
};

export type TaskDetailViewData = {
  id: string;
  currentUserId: string;
  title: string;
  description: string;
  status: string;
  statusLabel: string;
  type: TaskItemType;
  typeLabel: string;
  rarity: string;
  stageName: string;
  area: string;
  sourceName: string;
  sourceLocationName: string | null;
  sourceLocationId: string | null;
  locationHref: string | null;
  resolutionModeLabel: string;
  baseSuccessRate: number;
  requiredJobs: string[];
  requiredJobLabels: string[];
  requiredCount: number;
  participantCount: number;
  submittedCount: number;
  minResolveCount: number;
  successEffectsSummary: PlayerEffectLine[];
  failEffectsSummary: PlayerEffectLine[];
  milestoneLabels: string[];
  storySlug?: string;
  inkFile?: string;
  inkAvailable: boolean;
  storyState: TaskStoryState | null;
  canResolve: boolean;
  isCompleted: boolean;
  isActive: boolean;
  isJoined: boolean;
  hasSubmitted: boolean;
  resolvedSuccess?: boolean;
  participants: TaskDetailParticipant[];
  recentLogs: GameLogSummary[];
};

function parseJsonObject<T extends Record<string, unknown>>(raw: string | null | undefined): T {
  if (!raw) return {} as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return {} as T;
  }
}

function loadStoryState(task: TaskWithParticipants, inkFile: string): TaskStoryState | null {
  try {
    const inkStory = createStory(inkFile);
    const choiceEffects = parseJsonObject<MetricEffects>(task.choiceEffects);
    const choiceIds = Object.keys(choiceEffects);
    const state = getStoryState(inkStory, choiceIds);
    return {
      lines: state.lines,
      choices: state.choices,
      ended: state.ended,
    };
  } catch {
    return null;
  }
}

export async function buildTaskDetailViewData(
  task: TaskWithParticipants,
  project: ProjectState,
  userId: string,
  options?: {
    locations?: MapLocation[];
    locationActions?: LocationAction[];
  },
): Promise<TaskDetailViewData> {
  const sourceLocationId =
    options?.locations && options?.locationActions
      ? buildTemplateToLocationIdMap(options.locations, options.locationActions).get(
          task.templateId,
        ) ?? null
      : null;
  const sourceLocationName =
    options?.locations && options?.locationActions
      ? buildTemplateToLocationNameMap(options.locations, options.locationActions).get(
          task.templateId,
        ) ?? null
      : null;

  const item = buildTaskItem(task, project, {
    sourceLocationId,
    sourceLocationName,
  });
  const templates = await getTaskTemplates();
  const template = templates.find((entry) => entry.slug === task.templateId);
  const storySlug = template?.storySlug?.trim() || undefined;
  const resolvedInkFile =
    (await resolveInkFileFromStorySlug(storySlug, task.inkFile)) || task.inkFile || undefined;

  let inkAvailable = false;
  let storyState: TaskStoryState | null = null;
  if (resolvedInkFile) {
    storyState = loadStoryState(task, resolvedInkFile);
    inkAvailable = storyState !== null;
  }

  const submittedCount = task.participants.filter((participant) => participant.choiceId).length;
  const minResolveCount = task.minResolveCount || task.requiredCount || 1;
  const isParticipant = task.participants.some((participant) => participant.userId === userId);
  const myParticipant = task.participants.find((participant) => participant.userId === userId);
  const isActive = task.status === "PENDING" || task.status === "IN_PROGRESS";
  const isCompleted = task.status === "COMPLETED" || task.status === "FAILED";

  const recentLogs = await getRecentLogsForTask(task.title, 3);

  return {
    id: task.id,
    currentUserId: userId,
    title: item.title,
    description: item.description,
    status: item.status,
    statusLabel: item.statusLabel,
    type: item.type,
    typeLabel: item.typeLabel,
    rarity: item.rarity,
    stageName: getStageDisplayName(task.stage || project.currentStage),
    area: item.area,
    sourceName: item.sourceName,
    sourceLocationName: item.sourceLocationName,
    sourceLocationId: item.sourceLocationId,
    locationHref: item.locationHref,
    resolutionModeLabel: item.resolutionMode,
    baseSuccessRate: item.baseSuccessRate,
    requiredJobs: item.requiredJobs,
    requiredJobLabels: item.requiredJobLabels,
    requiredCount: item.requiredCount,
    participantCount: item.participantCount,
    submittedCount,
    minResolveCount,
    successEffectsSummary: item.successEffectsSummary,
    failEffectsSummary: item.failEffectsSummary,
    milestoneLabels: item.milestoneLabels,
    storySlug,
    inkFile: resolvedInkFile,
    inkAvailable,
    storyState,
    canResolve: isActive && isParticipant && !myParticipant?.choiceId && inkAvailable,
    isCompleted,
    isActive,
    isJoined: isParticipant,
    hasSubmitted: !!myParticipant?.choiceId,
    resolvedSuccess:
      task.status === "COMPLETED" ? true : task.status === "FAILED" ? false : undefined,
    participants: task.participants.map((participant) => ({
      id: participant.id,
      nickname: participant.user.nickname,
      jobLabel: JOB_LABELS[participant.user.job as Job] || "项目成员",
      hasSubmitted: !!participant.choiceId,
    })),
    recentLogs,
  };
}
