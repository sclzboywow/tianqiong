import type { LogType } from "@/game/prisma-types";
import type { RecommendedAction } from "@/game/playerGuidanceEngine";
import { getTodayLogs, MAP_ACTION_LOG_PREFIX, EVENT_POOL_LOG_PREFIX } from "@/game/logEngine";
import { CHARACTER_GROWTH_LOG_PREFIX } from "@/game/playerProgressEngine";
import {
  formatPlayerMetricEffectLinesFromRecord,
  sanitizePlayerLogContent,
  type PlayerEffectLine,
} from "@/game/taskEffectPlayerDisplay";
import { METRIC_LABELS } from "@/game/types";

export type DailyLogCategory = "project" | "task" | "growth" | "risk";

export type DailyReportCategoryId = "all" | DailyLogCategory;

export type LogItemIconType = "project" | "task" | "growth" | "risk" | "map" | "event";

export type LogItem = {
  id: string;
  type: DailyLogCategory;
  typeLabel: string;
  title: string;
  content: string;
  createdAt: Date;
  timeLabel: string;
  effectLines: PlayerEffectLine[];
  tone: "positive" | "negative" | "neutral" | "info";
  iconType: LogItemIconType;
};

export type DailyReportCategory = {
  id: DailyReportCategoryId;
  label: string;
  count: number;
};

export type DailyReportSummary = {
  totalLogs: number;
  /** 所有任务类日志（加入、提交、结算等） */
  taskLogs: number;
  /** 已完成/失败的任务结算条数 */
  completedTaskLogs: number;
  growthLogs: number;
  riskLogs: number;
  projectLogs: number;
};

export type DailyReportKeyChange = PlayerEffectLine;

export type DailyReportNextSuggestion = {
  headline: string;
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
};

export type DailyReportViewData = {
  summary: DailyReportSummary;
  categories: DailyReportCategory[];
  logItems: LogItem[];
  keyChanges: DailyReportKeyChange[];
  nextSuggestion: DailyReportNextSuggestion;
};

const CATEGORY_LABELS: Record<DailyLogCategory, string> = {
  project: "项目动态",
  task: "任务记录",
  growth: "角色成长",
  risk: "风险变化",
};

const TYPE_LABELS: Record<DailyLogCategory, string> = CATEGORY_LABELS;

const RISK_METRIC_KEYS = new Set(["latentRisk", "fireRisk", "safety", "quality", "cost"]);
const RISK_CONTENT_KEYWORDS = ["风险", "隐患", "消防", "安全"];

type RawLog = {
  id: string;
  content: string;
  createdAt: Date;
  logType: string;
  effectSummary: string | null;
  user?: { nickname: string } | null;
};

function formatTimeLabel(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function parseMetricEffectSummary(effectSummary: string | null): Record<string, number> | null {
  if (!effectSummary) return null;
  try {
    const parsed = JSON.parse(effectSummary) as Record<string, unknown>;
    const metrics: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "number" && value !== 0 && METRIC_LABELS[key]) {
        metrics[key] = value;
      }
    }
    return Object.keys(metrics).length > 0 ? metrics : null;
  } catch {
    return null;
  }
}

function hasRiskSignals(log: RawLog): boolean {
  const blob = `${log.content} ${log.effectSummary ?? ""}`;
  if (RISK_CONTENT_KEYWORDS.some((keyword) => blob.includes(keyword))) return true;

  const metrics = parseMetricEffectSummary(log.effectSummary);
  if (!metrics) return false;
  return Object.keys(metrics).some((key) => RISK_METRIC_KEYS.has(key));
}

function classifyLog(log: RawLog): DailyLogCategory {
  const content = log.content;

  if (content.startsWith(CHARACTER_GROWTH_LOG_PREFIX)) return "growth";
  if (
    content.includes("获得经验") ||
    content.includes("获得金币") ||
    content.includes("声望 +") ||
    content.includes("提升至 Lv")
  ) {
    return "growth";
  }

  if (log.logType === "TASK") return "task";
  if (content.includes("加入任务") || content.includes("提交") || content.includes("结算")) {
    return "task";
  }

  if (hasRiskSignals(log) && log.logType === "METRIC") return "risk";
  if (
    hasRiskSignals(log) &&
    !content.startsWith(MAP_ACTION_LOG_PREFIX) &&
    !content.startsWith(EVENT_POOL_LOG_PREFIX) &&
    log.logType !== "STAGE"
  ) {
    return "risk";
  }

  if (content.startsWith(MAP_ACTION_LOG_PREFIX)) return "project";
  if (content.startsWith(EVENT_POOL_LOG_PREFIX)) return "project";
  if (log.logType === "STAGE" || log.logType === "METRIC" || log.logType === "SYSTEM") {
    return "project";
  }

  if (hasRiskSignals(log)) return "risk";

  return "project";
}

function deriveIconType(category: DailyLogCategory, log: RawLog): LogItemIconType {
  if (log.content.startsWith(MAP_ACTION_LOG_PREFIX)) return "map";
  if (log.content.startsWith(EVENT_POOL_LOG_PREFIX)) return "event";
  return category;
}

function deriveLogTitle(category: DailyLogCategory, log: RawLog): string {
  const content = log.content;

  if (category === "growth") {
    if (content.includes("提升至 Lv")) return "等级提升";
    if (content.includes("完成「") || content.includes("完成任务")) return "任务奖励";
    return "角色成长";
  }

  if (category === "task") {
    if (content.includes("加入任务")) return "加入任务";
    if (content.includes("失败任务") || content.startsWith("失败")) return "任务结算";
    if (content.includes("完成") || content.includes("结算")) return "任务结算";
    if (content.includes("提交")) return "提交方案";
    return "任务动态";
  }

  if (category === "risk") return "风险变化";
  if (content.startsWith(MAP_ACTION_LOG_PREFIX)) return "地点行动";
  if (content.startsWith(EVENT_POOL_LOG_PREFIX)) return "事件触发";
  if (log.logType === "STAGE") return "阶段推进";
  if (log.logType === "METRIC") return "指标变化";
  return "项目动态";
}

function parseGrowthEffectLines(content: string): PlayerEffectLine[] {
  const lines: PlayerEffectLine[] = [];
  const expMatch = content.match(/经验\s*\+(\d+)/);
  const goldMatch = content.match(/金币\s*\+(\d+)/);
  const repMatch = content.match(/声望\s*\+(\d+)/);

  if (expMatch) lines.push({ text: `经验 +${expMatch[1]}`, tone: "positive" });
  if (goldMatch) lines.push({ text: `金币 +${goldMatch[1]}`, tone: "positive" });
  if (repMatch) lines.push({ text: `声望 +${repMatch[1]}`, tone: "positive" });

  return lines;
}

function deriveLogTone(category: DailyLogCategory, log: RawLog): LogItem["tone"] {
  const content = log.content;
  if (category === "growth") return "positive";
  if (category === "task") {
    if (content.includes("失败") || content.startsWith("失败")) return "negative";
    if (content.includes("完成") || content.includes("加入")) return "positive";
    return "info";
  }
  if (category === "risk") {
    const metrics = parseMetricEffectSummary(log.effectSummary);
    if (metrics?.latentRisk && metrics.latentRisk > 0) return "negative";
    if (metrics?.fireRisk && metrics.fireRisk > 0) return "negative";
    if (metrics?.latentRisk && metrics.latentRisk < 0) return "positive";
    return "neutral";
  }
  return "info";
}

function buildEffectLines(log: RawLog, category: DailyLogCategory): PlayerEffectLine[] {
  const fromSummary = formatPlayerMetricEffectLinesFromRecord(
    parseMetricEffectSummary(log.effectSummary),
    4,
  );
  if (fromSummary.length > 0) return fromSummary;

  if (category === "growth") {
    return parseGrowthEffectLines(log.content);
  }

  return [];
}

function transformLog(log: RawLog): LogItem {
  const type = classifyLog(log);
  const content = sanitizePlayerLogContent(log.content);

  return {
    id: log.id,
    type,
    typeLabel: TYPE_LABELS[type],
    title: deriveLogTitle(type, log),
    content,
    createdAt: log.createdAt,
    timeLabel: formatTimeLabel(log.createdAt),
    effectLines: buildEffectLines(log, type),
    tone: deriveLogTone(type, log),
    iconType: deriveIconType(type, log),
  };
}

const RISK_EFFECT_KEYWORDS = ["风险", "隐患", "安全", "消防"];

export function matchesRiskCategoryItem(item: LogItem): boolean {
  if (item.type === "risk") return true;
  return item.effectLines.some((line) =>
    RISK_EFFECT_KEYWORDS.some((keyword) => line.text.includes(keyword)),
  );
}

function countCompletedTaskLogs(logItems: LogItem[]): number {
  return logItems.filter(
    (item) =>
      item.type === "task" &&
      (item.title === "任务结算" ||
        item.content.includes("完成任务") ||
        item.content.includes("任务失败")),
  ).length;
}

function buildSummary(logItems: LogItem[]): DailyReportSummary {
  return {
    totalLogs: logItems.length,
    taskLogs: logItems.filter((item) => item.type === "task").length,
    completedTaskLogs: countCompletedTaskLogs(logItems),
    growthLogs: logItems.filter((item) => item.type === "growth").length,
    riskLogs: logItems.filter(matchesRiskCategoryItem).length,
    projectLogs: logItems.filter((item) => item.type === "project").length,
  };
}

function buildCategories(summary: DailyReportSummary): DailyReportCategory[] {
  return [
    { id: "all", label: "全部", count: summary.totalLogs },
    { id: "project", label: "项目动态", count: summary.projectLogs },
    { id: "task", label: "任务记录", count: summary.taskLogs },
    { id: "growth", label: "角色成长", count: summary.growthLogs },
    { id: "risk", label: "风险变化", count: summary.riskLogs },
  ];
}

function extractKeyChanges(logItems: LogItem[]): DailyReportKeyChange[] {
  const seen = new Set<string>();
  const changes: DailyReportKeyChange[] = [];

  for (const item of logItems) {
    for (const line of item.effectLines) {
      if (seen.has(line.text)) continue;
      seen.add(line.text);
      changes.push(line);
      if (changes.length >= 6) return changes;
    }
  }

  return changes;
}

function buildNextSuggestion(action: RecommendedAction): DailyReportNextSuggestion {
  const isTask = action.href.startsWith("/tasks/");
  return {
    headline: "当前建议",
    title: isTask ? `处理任务「${action.title}」` : action.title,
    description: action.reason || action.description,
    href: action.href,
    buttonLabel: isTask ? "前往处理" : "立即前往",
  };
}

export async function buildDailyReportViewData(
  recommendedAction: RecommendedAction,
): Promise<DailyReportViewData> {
  const logs = await getTodayLogs();
  const logItems = logs.map((log) =>
    transformLog({
      id: log.id,
      content: log.content,
      createdAt: log.createdAt,
      logType: log.logType as LogType,
      effectSummary: log.effectSummary,
      user: log.user,
    }),
  );

  const summary = buildSummary(logItems);

  return {
    summary,
    categories: buildCategories(summary),
    logItems,
    keyChanges: extractKeyChanges(logItems),
    nextSuggestion: buildNextSuggestion(recommendedAction),
  };
}

export function filterLogItemsByCategory(
  logItems: LogItem[],
  categoryId: DailyReportCategoryId,
): LogItem[] {
  if (categoryId === "all") return logItems;
  if (categoryId === "risk") return logItems.filter(matchesRiskCategoryItem);
  return logItems.filter((item) => item.type === categoryId);
}
