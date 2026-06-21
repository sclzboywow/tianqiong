"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ContentOrchestrationOverview,
  OrchestrationAction,
  OrchestrationArtifact,
  OrchestrationStage,
  OrchestrationStoryEntry,
  OrchestrationTask,
} from "@/game/contentOrchestrationLoader";
import type {
  ActionsTabData,
  ArtifactsTabData,
  CleanupTabData,
  EventsTabData,
  HealthTabData,
  InspectorSelection,
  StageFilter,
  StoriesTabData,
  TabId,
  TasksTabData,
} from "./types";
import { EVENT_KIND_LABEL, TERMINAL_ARTIFACT_SLUGS } from "./types";
import {
  RiskDots,
  SelectableCard,
  TabError,
  TabLoading,
  sourceBadge,
} from "./utils";

type WorkspaceMainProps = {
  tab: TabId;
  stageFilter: StageFilter;
  overview: ContentOrchestrationOverview;
  tasksData?: TasksTabData;
  artifactsData?: ArtifactsTabData;
  actionsData?: ActionsTabData;
  eventsData?: EventsTabData;
  storiesData?: StoriesTabData;
  cleanupData?: CleanupTabData;
  healthData?: HealthTabData;
  loadingTab: TabId | null;
  errorTab: Partial<Record<TabId, string>>;
  selection: InspectorSelection;
  onSelect: (selection: InspectorSelection) => void;
  onRetry: (tab: Exclude<TabId, "overview">) => void;
  onNavigateTab: (tab: TabId, stageFilter?: StageFilter) => void;
};

function taskWarnings(task: OrchestrationTask): string[] {
  const warnings: string[] = [];
  if (task.relatedActionSlugs.length === 0) warnings.push("无地点行动");
  if (!task.relatedStorySlug && !task.storyEntryDocId) warnings.push("无 StoryEntry");
  if (task.source === "seedFallback") warnings.push("seedFallback");
  if (task.mismatchFields.length > 0) warnings.push(...task.mismatchFields);
  return warnings;
}

function TaskCard({
  task,
  selected,
  onSelect,
}: {
  task: OrchestrationTask;
  selected: boolean;
  onSelect: () => void;
}) {
  const warnings = taskWarnings(task);
  return (
    <SelectableCard selected={selected} onClick={onSelect}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-100">{task.title}</p>
          <p className="truncate font-mono text-xs text-zinc-500">{task.slug}</p>
        </div>
        <Badge variant="outline" className="shrink-0 text-xs">
          {task.stageProgress ?? 0}%
        </Badge>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {sourceBadge(task.source)}
        {task.category === "correction" ? (
          <Badge variant="outline" className="text-xs text-zinc-400">
            补正
          </Badge>
        ) : null}
        {warnings.length > 0 ? <RiskDots count={warnings.length} /> : null}
      </div>
    </SelectableCard>
  );
}

function ArtifactCard({
  artifact,
  selected,
  onSelect,
}: {
  artifact: OrchestrationArtifact;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <SelectableCard selected={selected} onClick={onSelect}>
      <p className="font-medium text-zinc-100">{artifact.name}</p>
      <p className="font-mono text-xs text-zinc-500">{artifact.slug}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {sourceBadge(artifact.source)}
        {artifact.usedByMainline ? (
          <Badge className="text-xs">主线</Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-zinc-500">
            非主线
          </Badge>
        )}
        {artifact.undefinedRefs.length > 0 ? (
          <RiskDots count={artifact.undefinedRefs.length} />
        ) : null}
      </div>
    </SelectableCard>
  );
}

function OverviewView({
  overview,
  onSelect,
  onNavigateTab,
}: {
  overview: ContentOrchestrationOverview;
  onSelect: (selection: InspectorSelection) => void;
  onNavigateTab: (tab: TabId, stageFilter?: StageFilter) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "正式主线任务", value: overview.overview.mainlineTaskCount },
          { label: "补正任务", value: overview.overview.correctionTaskCount },
          { label: "成果物定义", value: overview.overview.artifactCount },
          { label: "建设项目地点行动", value: overview.overview.constructionActionCount },
          { label: "建设项目事件", value: overview.overview.constructionEventCount },
          { label: "通用 Ink 套数", value: overview.overview.genericInkCount },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
            <p className="text-xs text-zinc-500">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-100">{item.value}</p>
          </div>
        ))}
      </div>

      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-100">健康摘要</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-400">
          <p>{overview.health.summary}</p>
          <p className="text-xs text-zinc-500">
            错误 {overview.health.errorCount} · 警告 {overview.health.warningCount}
          </p>
          <button
            type="button"
            onClick={() => onNavigateTab("health")}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
          >
            查看健康检查
          </button>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-300">阶段概览</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {overview.stages.map((stage) => (
            <SelectableCard
              key={stage.stageId}
              selected={false}
              onClick={() => {
                onSelect({
                  kind: "stage",
                  stageId: stage.stageId,
                  stageName: stage.stageName,
                  summary: `主线 ${stage.mainlineCount} · 补正 ${stage.correctionCount} · stageProgress ${stage.stageProgressSum}% · milestones: ${stage.requiredMilestones.join(", ") || "—"}`,
                });
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-zinc-100">{stage.stageName}</p>
                <Badge variant={stage.stageGateReady ? "default" : "outline"}>
                  {stage.stageProgressSum}%
                </Badge>
              </div>
              <p className="mt-1 font-mono text-xs text-zinc-500">{stage.stageId}</p>
              <p className="mt-2 text-xs text-zinc-400">
                主线 {stage.mainlineCount} · 补正 {stage.correctionCount}
              </p>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onNavigateTab("tasks", stage.stageId);
                }}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "mt-2 text-xs text-sky-400",
                )}
              >
                查看任务 →
              </button>
            </SelectableCard>
          ))}
        </div>
      </div>
    </div>
  );
}

function TasksView({
  data,
  stageFilter,
  selection,
  onSelect,
}: {
  data: TasksTabData;
  stageFilter: StageFilter;
  selection: InspectorSelection;
  onSelect: (selection: InspectorSelection) => void;
}) {
  const stages = useMemo(() => {
    if (stageFilter === "all") return data.stages;
    return data.stages.filter((stage) => stage.stageId === stageFilter);
  }, [data.stages, stageFilter]);

  return (
    <div className="space-y-6">
      {stages.map((stage) => (
        <StageTasksSection
          key={stage.stageId}
          stage={stage}
          selection={selection}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function StageTasksSection({
  stage,
  selection,
  onSelect,
}: {
  stage: OrchestrationStage;
  selection: InspectorSelection;
  onSelect: (selection: InspectorSelection) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-medium text-zinc-200">{stage.stageName}</h2>
        <Badge variant="outline" className="font-mono text-xs">
          {stage.stageId}
        </Badge>
        {stage.warnings.length > 0 ? <RiskDots count={stage.warnings.length} /> : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stage.tasks.map((task) => (
          <TaskCard
            key={task.slug}
            task={task}
            selected={selection?.kind === "task" && selection.item.slug === task.slug}
            onSelect={() => onSelect({ kind: "task", item: task })}
          />
        ))}
      </div>
      {stage.correctionTasks.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-xs text-zinc-500">补正任务（不计入正式主线计数）</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {stage.correctionTasks.map((task) => (
              <TaskCard
                key={task.slug}
                task={task}
                selected={selection?.kind === "task" && selection.item.slug === task.slug}
                onSelect={() => onSelect({ kind: "task", item: task })}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ArtifactsView({
  data,
  stageFilter,
  selection,
  onSelect,
}: {
  data: ArtifactsTabData;
  stageFilter: StageFilter;
  selection: InspectorSelection;
  onSelect: (selection: InspectorSelection) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, OrchestrationArtifact[]>();
    for (const artifact of data.artifacts) {
      const stage = artifact.stage || "未分组";
      if (stageFilter !== "all" && stage !== stageFilter && stage !== "未分组") continue;
      const list = map.get(stage) || [];
      list.push(artifact);
      map.set(stage, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data.artifacts, stageFilter]);

  return (
    <div className="space-y-6">
      {data.terminalTask ? (
        <Card className="border-emerald-900/40 bg-emerald-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-300">
              终局任务 · {data.terminalTask.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <button
              type="button"
              onClick={() => onSelect({ kind: "task", item: data.terminalTask! })}
              className="font-mono text-xs text-sky-400 hover:underline"
            >
              {data.terminalTask.slug}
            </button>
            <ul className="space-y-1 font-mono text-xs text-zinc-400">
              {TERMINAL_ARTIFACT_SLUGS.map((slug) => {
                const art = data.artifacts.find((a) => a.slug === slug);
                return (
                  <li key={slug}>
                    {slug} ← {(art?.producedBy || []).join(" → ") || "无产出任务"}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {grouped.map(([stage, artifacts]) => (
        <section key={stage}>
          <h2 className="mb-3 text-sm font-medium text-zinc-300">{stage}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {artifacts.map((artifact) => (
              <ArtifactCard
                key={artifact.slug}
                artifact={artifact}
                selected={
                  selection?.kind === "artifact" && selection.item.slug === artifact.slug
                }
                onSelect={() => onSelect({ kind: "artifact", item: artifact })}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ActionsView({
  data,
  selection,
  onSelect,
}: {
  data: ActionsTabData;
  selection: InspectorSelection;
  onSelect: (selection: InspectorSelection) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, OrchestrationAction[]>();
    for (const action of data.allActions) {
      const location = action.locationSlug || "未指定地点";
      const list = map.get(location) || [];
      list.push(action);
      map.set(location, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data.allActions]);

  return (
    <div className="space-y-6">
      {grouped.map(([location, actions]) => (
        <section key={location}>
          <h2 className="mb-3 font-mono text-sm font-medium text-zinc-300">{location}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {actions.map((action) => (
              <SelectableCard
                key={action.slug}
                selected={selection?.kind === "action" && selection.item.slug === action.slug}
                onClick={() => onSelect({ kind: "action", item: action })}
                className={action.risks.length > 0 ? "border-rose-900/40" : undefined}
              >
                <p className="font-medium text-zinc-100">{action.label}</p>
                <p className="font-mono text-xs text-zinc-500">{action.slug}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {action.unlockStage ? (
                    <Badge variant="outline" className="text-xs">
                      {action.unlockStage}
                    </Badge>
                  ) : null}
                  <RiskDots count={action.risks.length} />
                </div>
              </SelectableCard>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EventsView({
  data,
  selection,
  onSelect,
}: {
  data: EventsTabData;
  selection: InspectorSelection;
  onSelect: (selection: InspectorSelection) => void;
}) {
  const kinds = ["construction", "site", "other"] as const;

  return (
    <div className="space-y-6">
      {kinds.map((kind) => {
        const rows = data.allEvents.filter((event) => event.kind === kind);
        if (rows.length === 0) return null;
        return (
          <section key={kind}>
            <h2 className="mb-3 text-sm font-medium text-zinc-300">
              {EVENT_KIND_LABEL[kind]}（{rows.length}）
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((event) => (
                <SelectableCard
                  key={event.slug}
                  selected={selection?.kind === "event" && selection.item.slug === event.slug}
                  onClick={() => onSelect({ kind: "event", item: event })}
                  className={event.risks.length > 0 ? "border-rose-900/40" : undefined}
                >
                  <p className="font-medium text-zinc-100">{event.title}</p>
                  <p className="font-mono text-xs text-zinc-500">{event.slug}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {event.triggerStage ? (
                      <Badge variant="outline" className="text-xs">
                        {event.triggerStage}
                      </Badge>
                    ) : null}
                    <RiskDots count={event.risks.length} />
                  </div>
                </SelectableCard>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function StoriesView({
  data,
  selection,
  onSelect,
}: {
  data: StoriesTabData;
  selection: InspectorSelection;
  onSelect: (selection: InspectorSelection) => void;
}) {
  const anomalous = data.allStoryEntries.filter((entry) => entry.risks.length > 0);
  const normal = data.allStoryEntries.filter((entry) => entry.risks.length === 0);

  function StoryCard({ entry }: { entry: OrchestrationStoryEntry }) {
    return (
      <SelectableCard
        selected={selection?.kind === "story" && selection.item.slug === entry.slug}
        onClick={() => onSelect({ kind: "story", item: entry })}
        className={entry.risks.length > 0 ? "border-rose-900/40" : undefined}
      >
        <p className="font-medium text-zinc-100">{entry.title}</p>
        <p className="font-mono text-xs text-zinc-500">{entry.slug}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {entry.inkFile ? (
            <Badge variant="outline" className="font-mono text-xs">
              {entry.inkFile}
            </Badge>
          ) : null}
          <RiskDots count={entry.risks.length} />
        </div>
      </SelectableCard>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-medium text-rose-300">
          异常优先（{anomalous.length}）
        </h2>
        {anomalous.length === 0 ? (
          <p className="text-sm text-emerald-400">暂无异常 StoryEntry</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {anomalous.map((entry) => (
              <StoryCard key={entry.slug} entry={entry} />
            ))}
          </div>
        )}
      </section>

      <details className="rounded-lg border border-zinc-800 bg-zinc-950/30">
        <summary className="cursor-pointer px-4 py-3 text-sm text-zinc-400">
          正常项（{normal.length}）— 点击展开
        </summary>
        <div className="grid gap-3 border-t border-zinc-800 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {normal.map((entry) => (
            <StoryCard key={entry.slug} entry={entry} />
          ))}
        </div>
      </details>
    </div>
  );
}

function CleanupView({
  data,
  selection,
  onSelect,
}: {
  data: CleanupTabData;
  selection: InspectorSelection;
  onSelect: (selection: InspectorSelection) => void;
}) {
  const groups = [
    ["旧 Chapter1 任务", data.cleanup.oldTasks],
    ["旧 Chapter1 事件", data.cleanup.oldEvents],
    ["旧 Chapter1 StoryEntry", data.cleanup.oldStoryEntries],
    ["旧 Chapter1 地点行动", data.cleanup.oldLocationActions],
    ["旧阶段主线任务", data.cleanup.oldStageTasks],
    ["旧阶段 StoryEntry", data.cleanup.oldStageStoryEntries],
    ["旧 Ink", data.cleanup.oldInkFiles],
  ] as const;

  const issueCount = groups
    .flatMap(([, items]) => items)
    .filter((item) => item.found).length;

  const payloadUnavailable = data.cleanup.payloadCheckAvailable === false;
  const showClean = data.cleanup.clean && !payloadUnavailable;

  return (
    <Card
      className={cn(
        "border-zinc-800",
        showClean ? "bg-emerald-950/20" : "bg-amber-950/20",
      )}
    >
      <CardHeader>
        <CardTitle className="text-base text-zinc-100">
          {payloadUnavailable
            ? "Payload cleanup 检查不可用"
            : showClean
              ? "旧数据已清理"
              : `旧数据残留（${issueCount} 项）`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {payloadUnavailable ? (
          <p className="text-amber-200">
            无法连接 Payload 全量检查（含 disabled 记录）。请确认 Payload 可用后刷新，避免误判为已清理。
          </p>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-2">
          {groups.map(([label, items]) => {
            const found = items.filter((item) => item.found);
            return (
              <div
                key={label}
                className={cn(
                  "rounded-md border px-3 py-2",
                  found.length > 0 ? "border-amber-800/50" : "border-zinc-800",
                )}
              >
                <p className="text-xs text-zinc-400">{label}</p>
                <p
                  className={cn(
                    "mt-1 font-medium",
                    found.length > 0 ? "text-amber-300" : "text-emerald-400",
                  )}
                >
                  {found.length > 0 ? `${found.length} 项残留` : "无残留"}
                </p>
              </div>
            );
          })}
        </div>

        {!showClean ? (
          <details className="rounded-lg border border-amber-800/40 bg-amber-950/10">
            <summary className="cursor-pointer px-4 py-3 text-sm text-amber-200">
              展开残留详情
            </summary>
            <div className="space-y-4 border-t border-amber-900/30 px-4 py-4">
              <p className="text-xs text-amber-200">
                执行{" "}
                <span className="font-mono">npm run cleanup:legacy-chapter1:apply</span>
              </p>
              {groups.map(([label, items]) => {
                const found = items.filter((item) => item.found);
                if (found.length === 0) return null;
                return (
                  <div key={label}>
                    <p className="mb-2 font-medium text-zinc-300">{label}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {found.map((item) => (
                        <SelectableCard
                          key={item.slug}
                          selected={
                            selection?.kind === "cleanup" &&
                            selection.item.slug === item.slug &&
                            selection.label === label
                          }
                          onClick={() => onSelect({ kind: "cleanup", label, item })}
                        >
                          <p className="font-mono text-xs text-amber-300">{item.slug}</p>
                          {item.detail ? (
                            <p className="mt-1 text-xs text-zinc-400">{item.detail}</p>
                          ) : null}
                          <p className="mt-1 text-xs text-zinc-500">{item.source}</p>
                        </SelectableCard>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}

function HealthView({ data }: { data: HealthTabData }) {
  return (
    <div className="space-y-4">
      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-100">{data.health.summary}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {data.health.errors.length > 0 ? (
            <ul className="space-y-1 text-rose-300">
              {data.health.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
          {data.health.warnings.slice(0, 20).map((warning) => (
            <p key={warning} className="text-xs text-amber-300/90">
              {warning}
            </p>
          ))}
          {data.health.warnings.length > 20 ? (
            <p className="text-xs text-zinc-500">另有 {data.health.warnings.length - 20} 条警告</p>
          ) : null}
        </CardContent>
      </Card>
      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-100">content:check 摘要</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-400">
          <p>
            通过 {data.healthReport.passCount} · 失败 {data.healthReport.failCount} · 警告{" "}
            {data.healthReport.warnCount}
          </p>
          <Link
            href="/ops/content-studio?tab=debug"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 inline-flex")}
          >
            打开依赖调试
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export function ContentOrchestrationWorkspaceMain({
  tab,
  stageFilter,
  overview,
  tasksData,
  artifactsData,
  actionsData,
  eventsData,
  storiesData,
  cleanupData,
  healthData,
  loadingTab,
  errorTab,
  selection,
  onSelect,
  onRetry,
  onNavigateTab,
}: WorkspaceMainProps) {
  if (tab === "overview") {
    return <OverviewView overview={overview} onSelect={onSelect} onNavigateTab={onNavigateTab} />;
  }

  if (tab === "tasks") {
    if (loadingTab === "tasks" && !tasksData) {
      return <TabLoading label="正在加载任务矩阵..." />;
    }
    if (errorTab.tasks && !tasksData) {
      return <TabError message={errorTab.tasks} onRetry={() => onRetry("tasks")} />;
    }
    if (tasksData) {
      return (
        <TasksView
          data={tasksData}
          stageFilter={stageFilter}
          selection={selection}
          onSelect={onSelect}
        />
      );
    }
    return null;
  }

  if (tab === "artifacts") {
    if (loadingTab === "artifacts" && !artifactsData) {
      return <TabLoading label="正在加载成果物流转..." />;
    }
    if (errorTab.artifacts && !artifactsData) {
      return <TabError message={errorTab.artifacts} onRetry={() => onRetry("artifacts")} />;
    }
    if (artifactsData) {
      return (
        <ArtifactsView
          data={artifactsData}
          stageFilter={stageFilter}
          selection={selection}
          onSelect={onSelect}
        />
      );
    }
    return null;
  }

  if (tab === "actions") {
    if (loadingTab === "actions" && !actionsData) {
      return <TabLoading label="正在加载地点行动挂载..." />;
    }
    if (errorTab.actions && !actionsData) {
      return <TabError message={errorTab.actions} onRetry={() => onRetry("actions")} />;
    }
    if (actionsData) {
      return <ActionsView data={actionsData} selection={selection} onSelect={onSelect} />;
    }
    return null;
  }

  if (tab === "events") {
    if (loadingTab === "events" && !eventsData) {
      return <TabLoading label="正在加载事件池挂载..." />;
    }
    if (errorTab.events && !eventsData) {
      return <TabError message={errorTab.events} onRetry={() => onRetry("events")} />;
    }
    if (eventsData) {
      return <EventsView data={eventsData} selection={selection} onSelect={onSelect} />;
    }
    return null;
  }

  if (tab === "stories") {
    if (loadingTab === "stories" && !storiesData) {
      return <TabLoading label="正在加载剧情入口校验..." />;
    }
    if (errorTab.stories && !storiesData) {
      return <TabError message={errorTab.stories} onRetry={() => onRetry("stories")} />;
    }
    if (storiesData) {
      return <StoriesView data={storiesData} selection={selection} onSelect={onSelect} />;
    }
    return null;
  }

  if (tab === "cleanup") {
    if (loadingTab === "cleanup" && !cleanupData) {
      return <TabLoading label="正在加载旧数据清理..." />;
    }
    if (errorTab.cleanup && !cleanupData) {
      return <TabError message={errorTab.cleanup} onRetry={() => onRetry("cleanup")} />;
    }
    if (cleanupData) {
      return <CleanupView data={cleanupData} selection={selection} onSelect={onSelect} />;
    }
    return null;
  }

  if (tab === "health") {
    if (loadingTab === "health" && !healthData) {
      return <TabLoading label="正在加载健康检查..." />;
    }
    if (errorTab.health && !healthData) {
      return <TabError message={errorTab.health} onRetry={() => onRetry("health")} />;
    }
    if (healthData) {
      return <HealthView data={healthData} />;
    }
    return null;
  }

  return null;
}
