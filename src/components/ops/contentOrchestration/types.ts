import type { ContentHealthCheckReport } from "@/game/contentHealthCheck";
import type {
  CleanupItem,
  ContentOrchestrationData,
  ContentOrchestrationOverview,
  OrchestrationAction,
  OrchestrationArtifact,
  OrchestrationEvent,
  OrchestrationStage,
  OrchestrationStoryEntry,
  OrchestrationTask,
} from "@/game/contentOrchestrationLoader";

export type TabId =
  | "overview"
  | "tasks"
  | "artifacts"
  | "actions"
  | "events"
  | "stories"
  | "cleanup"
  | "health";

export type StageFilter = "all" | string;

export type InspectorSelection =
  | { kind: "task"; item: OrchestrationTask }
  | { kind: "artifact"; item: OrchestrationArtifact }
  | { kind: "action"; item: OrchestrationAction }
  | { kind: "event"; item: OrchestrationEvent }
  | { kind: "story"; item: OrchestrationStoryEntry }
  | { kind: "cleanup"; label: string; item: CleanupItem }
  | { kind: "stage"; stageId: string; stageName: string; summary: string }
  | null;

export type TasksTabData = { stages: OrchestrationStage[] };
export type ArtifactsTabData = {
  artifacts: OrchestrationArtifact[];
  terminalTask: OrchestrationTask | null;
};
export type ActionsTabData = { allActions: OrchestrationAction[] };
export type EventsTabData = { allEvents: OrchestrationEvent[] };
export type StoriesTabData = { allStoryEntries: OrchestrationStoryEntry[] };
export type CleanupTabData = { cleanup: ContentOrchestrationData["cleanup"] };
export type HealthTabData = {
  health: ContentOrchestrationData["health"];
  healthReport: ContentHealthCheckReport;
};

export type TabDataMap = {
  tasks: TasksTabData;
  artifacts: ArtifactsTabData;
  actions: ActionsTabData;
  events: EventsTabData;
  stories: StoriesTabData;
  cleanup: CleanupTabData;
  health: HealthTabData;
};

export type ContentOrchestrationPanelProps = {
  initialOverview: ContentOrchestrationOverview;
  initialTab?: TabId;
  initialTabData?: Partial<TabDataMap>;
};

export const TABS: { id: TabId; label: string; short: string }[] = [
  { id: "overview", label: "主线总览", short: "总览" },
  { id: "tasks", label: "阶段任务矩阵", short: "任务" },
  { id: "artifacts", label: "成果物流转", short: "成果物" },
  { id: "actions", label: "地点行动挂载", short: "行动" },
  { id: "events", label: "事件池挂载", short: "事件" },
  { id: "stories", label: "剧情入口校验", short: "剧情" },
  { id: "cleanup", label: "旧数据清理", short: "清理" },
  { id: "health", label: "健康检查", short: "健康" },
];

export const TAB_ENDPOINTS: Record<Exclude<TabId, "overview">, string> = {
  tasks: "/api/ops/content-orchestration/tasks",
  artifacts: "/api/ops/content-orchestration/artifacts",
  actions: "/api/ops/content-orchestration/actions",
  events: "/api/ops/content-orchestration/events",
  stories: "/api/ops/content-orchestration/stories",
  cleanup: "/api/ops/content-orchestration/cleanup",
  health: "/api/ops/content-orchestration/health",
};

export const TAB_LOADING_LABEL: Record<Exclude<TabId, "overview">, string> = {
  tasks: "正在加载任务矩阵...",
  artifacts: "正在加载成果物流转...",
  actions: "正在加载地点行动挂载...",
  events: "正在加载事件池挂载...",
  stories: "正在加载剧情入口校验...",
  cleanup: "正在加载旧数据清理...",
  health: "正在加载健康检查...",
};

export const STAGE_IDS = [
  "INITIATION",
  "APPROVAL",
  "DESIGN",
  "PROCUREMENT",
  "CONSTRUCTION",
] as const;

export const EVENT_KIND_LABEL: Record<OrchestrationEvent["kind"], string> = {
  construction: "正式建设项目事件",
  site: "现场支线事件",
  other: "其他事件",
};

export const TERMINAL_ARTIFACT_SLUGS = [
  "approval_reply",
  "planning_condition",
  "drawing_review_certificate",
  "construction_contract",
  "supervision_contract",
  "quality_safety_supervision",
  "funding_certificate",
] as const;
