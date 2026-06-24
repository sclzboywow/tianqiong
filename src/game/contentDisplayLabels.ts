import { resolveAllowedStatuses } from "@/data/artifactDefinitions";
import { METRIC_LABELS_FROM_CONFIG } from "./metricConfig";
import {
  getStageDisplayName as getStageDisplayNameFromConfig,
  MILESTONE_LABELS,
  STAGE_GATE_STATUS_LABELS,
} from "./projectStages";

export type DisplayOption = {
  value: string;
  label: string;
  description?: string;
  badge?: string;
};

export type ArtifactStatusOption = {
  status: string;
  label: string;
};

export type TaskLike = { slug: string; title?: string | null };
export type ArtifactLike = {
  slug: string;
  name?: string | null;
  allowedStatuses?: { status: string; label?: string | null }[];
  allowedStatusOptions?: { status: string; label: string }[];
  defaultStatus?: string | null;
};

export const ARTIFACT_STATUS_LABELS: Record<string, string> = {
  draft: "草稿",
  submitted: "已提交",
  reviewing: "审核中",
  in_review: "审核中",
  approved: "已批准",
  confirmed: "已确认",
  rejected: "已退回",
  revision_required: "需补正",
  completed: "已完成",
  pending: "待处理",
  in_progress: "进行中",
  archived: "已归档",
};

export const RUNTIME_TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: "待处理",
  IN_PROGRESS: "进行中",
  COMPLETED: "已完成",
  FAILED: "失败",
  CANCELLED: "已取消",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  material: "材料补正",
  approval: "审批退回",
  planning: "规划冲突",
  design: "设计修改",
  procurement: "招采风险",
  acceptance: "验收整改",
  construction: "施工风险",
};

/** 第一版始终显示辅助 slug（小号灰色） */
export function shouldShowSlug(): boolean {
  return true;
}

export function getStageDisplayName(stageId?: string | null): string {
  if (!stageId) return "—";
  return getStageDisplayNameFromConfig(stageId);
}

export function getMilestoneDisplayName(key?: string | null): string {
  if (!key) return "—";
  return MILESTONE_LABELS[key] || key;
}

export function getMetricDisplayName(metricKey?: string | null): string {
  if (!metricKey) return "—";
  return METRIC_LABELS_FROM_CONFIG[metricKey] || metricKey;
}

export function getStageGateStatusLabel(status?: string | null): string {
  if (!status) return "—";
  return STAGE_GATE_STATUS_LABELS[status] || status;
}

export function getRuntimeTaskStatusLabel(status?: string | null): string {
  if (!status) return "未生成";
  return RUNTIME_TASK_STATUS_LABELS[status] || status;
}

export function getNpcDisplayName(name?: string | null): string {
  return name?.trim() || "—";
}

export function getTaskDisplayName(
  slug?: string | null,
  tasks?: TaskLike[] | Map<string, TaskLike>,
): string {
  if (!slug) return "—";
  if (tasks instanceof Map) {
    return tasks.get(slug)?.title?.trim() || slug;
  }
  const found = tasks?.find((task) => task.slug === slug);
  return found?.title?.trim() || slug;
}

export function getArtifactDisplayName(
  slug?: string | null,
  artifacts?: ArtifactLike[] | Map<string, ArtifactLike>,
): string {
  if (!slug) return "—";
  if (artifacts instanceof Map) {
    return artifacts.get(slug)?.name?.trim() || slug;
  }
  const found = artifacts?.find((artifact) => artifact.slug === slug);
  return found?.name?.trim() || slug;
}

export function getLocationDisplayName(
  slug?: string | null,
  locations?: { slug: string; name?: string | null }[],
): string {
  if (!slug) return "—";
  const found = locations?.find((location) => location.slug === slug);
  return found?.name?.trim() || slug;
}

export function getEventDisplayName(
  slug?: string | null,
  events?: { slug: string; title?: string | null }[],
): string {
  if (!slug) return "—";
  const found = events?.find((event) => event.slug === slug);
  return found?.title?.trim() || slug;
}

export function resolveArtifactStatusOptions(
  artifact?: Pick<ArtifactLike, "allowedStatuses" | "allowedStatusOptions" | "defaultStatus"> | null,
): ArtifactStatusOption[] {
  if (!artifact) {
    return Object.entries(ARTIFACT_STATUS_LABELS).map(([status, label]) => ({
      status,
      label,
    }));
  }
  if (artifact.allowedStatusOptions?.length) {
    return artifact.allowedStatusOptions;
  }
  const allowed = resolveAllowedStatuses({
    allowedStatuses: artifact.allowedStatuses?.map((item) => ({
      status: item.status,
      label: item.label ?? undefined,
    })),
    defaultStatus: artifact.defaultStatus || "draft",
  });
  if (allowed.length > 0) {
    return allowed.map((item) => ({
      status: item.status,
      label: item.label?.trim() || ARTIFACT_STATUS_LABELS[item.status] || item.status,
    }));
  }
  return Object.entries(ARTIFACT_STATUS_LABELS).map(([status, label]) => ({
    status,
    label,
  }));
}

export function getArtifactStatusLabel(
  status?: string | null,
  artifact?: Pick<ArtifactLike, "allowedStatuses" | "allowedStatusOptions" | "defaultStatus"> | null,
): string {
  if (!status) return "未产出";
  const options = resolveArtifactStatusOptions(artifact);
  const matched = options.find((item) => item.status === status);
  if (matched) return matched.label;
  return ARTIFACT_STATUS_LABELS[status] || status;
}

export function formatDisplayWithSlug(label: string, slug?: string | null): string {
  const primary = label.trim() || slug || "—";
  if (!slug || !shouldShowSlug() || primary === slug) return primary;
  return `${primary}（${slug}）`;
}

export function formatArtifactWithStatus(
  artifactSlug: string,
  status: string | null | undefined,
  artifacts?: ArtifactLike[] | Map<string, ArtifactLike>,
): string {
  const artifact =
    artifacts instanceof Map
      ? artifacts.get(artifactSlug)
      : artifacts?.find((item) => item.slug === artifactSlug);
  const name = getArtifactDisplayName(artifactSlug, artifacts);
  const statusLabel = getArtifactStatusLabel(status, artifact);
  return `${name} · ${statusLabel}`;
}

export function toDisplayOption(
  value: string,
  label: string,
  description?: string,
): DisplayOption {
  return { value, label, description };
}

export function taskToDisplayOption(task: TaskLike): DisplayOption {
  const title = task.title?.trim() || task.slug;
  return {
    value: task.slug,
    label: title,
    description: shouldShowSlug() ? task.slug : undefined,
  };
}

export function artifactToDisplayOption(artifact: ArtifactLike): DisplayOption {
  const name = artifact.name?.trim() || artifact.slug;
  return {
    value: artifact.slug,
    label: name,
    description: shouldShowSlug() ? artifact.slug : undefined,
  };
}

export function locationToDisplayOption(location: {
  slug: string;
  name?: string | null;
}): DisplayOption {
  const name = location.name?.trim() || location.slug;
  return {
    value: location.slug,
    label: name,
    description: shouldShowSlug() ? location.slug : undefined,
  };
}

export function formatSelectOptionLabel(option: DisplayOption): string {
  if (option.description && option.description !== option.label) {
    return formatDisplayWithSlug(option.label, option.description);
  }
  return option.label;
}

export function buildTaskTitleMap(tasks: TaskLike[]): Map<string, string> {
  return new Map(tasks.map((task) => [task.slug, task.title?.trim() || task.slug]));
}

export function buildArtifactNameMap(artifacts: ArtifactLike[]): Map<string, string> {
  return new Map(
    artifacts.map((artifact) => [artifact.slug, artifact.name?.trim() || artifact.slug]),
  );
}

export function buildArtifactLookup(artifacts: ArtifactLike[]): Map<string, ArtifactLike> {
  return new Map(artifacts.map((artifact) => [artifact.slug, artifact]));
}

/** 将阻塞原因中的 slug 尽量替换为中文名（前端展示用） */
export function localizeBlockingReason(
  reason: string,
  context?: {
    taskTitles?: Map<string, string>;
    artifactNames?: Map<string, string>;
    artifactLookup?: Map<string, ArtifactLike>;
  },
): string {
  let text = reason;

  if (context?.taskTitles) {
    for (const [slug, title] of context.taskTitles) {
      if (title !== slug) {
        text = text.replaceAll(`「${slug}」`, `「${title}」`);
        text = text.replaceAll(`: ${slug}`, `: ${title}`);
      }
    }
  }

  if (context?.artifactNames) {
    for (const [slug, name] of context.artifactNames) {
      if (name !== slug) {
        text = text.replaceAll(`「${name}」`, `「${name}」`);
        text = text.replaceAll(slug, name);
      }
    }
  }

  // 成果物状态英文 → 中文（当前：approved，需要：confirmed 等）
  text = text.replace(
    /（当前：([^，]+)，需要：([^）]+)）/g,
    (_match, actual: string, required: string) => {
      const artifactSlug = extractArtifactSlugFromReason(reason, context?.artifactNames);
      const artifact = artifactSlug
        ? context?.artifactLookup?.get(artifactSlug)
        : undefined;
      return `（当前：${getArtifactStatusLabel(actual.trim(), artifact)}，需要：${getArtifactStatusLabel(required.trim(), artifact)}）`;
    },
  );

  if (context?.artifactLookup) {
    for (const [slug, artifact] of context.artifactLookup) {
      const name = artifact.name?.trim() || slug;
      for (const [status, label] of Object.entries(ARTIFACT_STATUS_LABELS)) {
        text = text.replaceAll(`${name}（当前：${status}`, `${name}（当前：${label}`);
      }
    }
  }

  return text;
}

function extractArtifactSlugFromReason(
  reason: string,
  artifactNames?: Map<string, string>,
): string | undefined {
  if (!artifactNames) return undefined;
  for (const [slug, name] of artifactNames) {
    if (reason.includes(`「${name}」`)) return slug;
  }
  return undefined;
}

export function localizeBlockingReasons(
  reasons: string[],
  context?: Parameters<typeof localizeBlockingReason>[1],
): string[] {
  return reasons.map((reason) => localizeBlockingReason(reason, context));
}
