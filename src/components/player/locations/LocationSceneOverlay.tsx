"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ProjectState, Task } from "@prisma/client";
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  ExternalLink,
  Loader2,
  MessageSquare,
  ScrollText,
  ShieldAlert,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveNodeLocationId } from "@/lib/resolveNodeLocationId";
import type { SandtableLocationNode } from "@/game/locationSandtablePresentationEngine";
import type { LocationActionDisplayItem } from "@/game/locationPresentationEngine";
import { SandtableNpcList } from "./SandtableNpcList";
import { NpcTaskRequirementList } from "./NpcTaskRequirementList";
import { NpcTaskActionList } from "./NpcTaskActionList";
import { LocationActionExecutePanel } from "./LocationActionExecutePanel";
import {
  SandtableTokenList,
  SANDTABLE_STATUS_LABELS,
  WorkspaceColumn,
  statusBadgeClass,
} from "./sandtableDetailUi";

type WorkspacePayload = {
  locationId: string;
  locationName: string;
  unlocked: boolean;
  stageName: string;
  actionItems: LocationActionDisplayItem[];
  logs: { id: string; content: string; createdAt: string }[];
  user: {
    stamina: number;
    spirit: number;
    level: number;
    reputation: number;
  };
};

type LocationSceneOverlayProps = {
  node: SandtableLocationNode;
  regionName?: string;
  zoneName?: string;
  project: ProjectState;
  tasks: Task[];
  completedActionIds?: string[];
  onClose: () => void;
};

function formatLogTime(iso: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function StatusMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "warn" | "ok";
}) {
  return (
    <div
      className={cn(
        "border px-2.5 py-1.5 text-center",
        tone === "warn" && "border-amber-400/30 bg-amber-950/20",
        tone === "ok" && "border-emerald-400/30 bg-emerald-950/20",
        tone === "default" && "border-cyan-400/15 bg-slate-950/50",
      )}
    >
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-cyan-50">{value}</p>
    </div>
  );
}

export function LocationSceneOverlay({
  node,
  regionName,
  zoneName,
  project,
  tasks,
  completedActionIds,
  onClose,
}: LocationSceneOverlayProps) {
  const locationId = resolveNodeLocationId(node);
  const missingLocation = !locationId;
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
  const [loading, setLoading] = useState(!missingLocation);
  const [error, setError] = useState<string | null>(
    missingLocation ? "该沙盘节点暂无地点工作台" : null,
  );

  const applyWorkspaceResponse = useCallback((res: Response, data: unknown) => {
    const payload = data as { error?: string };
    if (!res.ok) {
      setError(payload.error || "加载地点工作台失败");
      setWorkspace(null);
      return;
    }
    setWorkspace(data as WorkspacePayload);
    setError(null);
  }, []);

  const refreshWorkspace = useCallback(async () => {
    if (!locationId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/locations/${locationId}/workspace`);
      const data = await res.json();
      applyWorkspaceResponse(res, data);
    } catch {
      setError("网络错误，请稍后重试");
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  }, [applyWorkspaceResponse, locationId]);

  useEffect(() => {
    if (!locationId) return;

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/locations/${locationId}/workspace`);
        const data = await res.json();
        if (cancelled) return;
        applyWorkspaceResponse(res, data);
      } catch {
        if (!cancelled) {
          setError("网络错误，请稍后重试");
          setWorkspace(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyWorkspaceResponse, locationId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const recommendedAction = workspace?.actionItems.find((action) => action.isRecommended);
  const riskItems = node.impactLabels?.length ? node.impactLabels : node.riskTags;
  const taskItems = node.relatedTaskTitles?.length ? node.relatedTaskTitles : node.relatedTaskSlugs;

  return (
    <div className="absolute inset-0 z-40 flex items-stretch justify-center lg:items-center lg:p-3">
      <button
        type="button"
        aria-label="关闭地点场景"
        className="absolute inset-0 bg-[#050B14]/75 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative flex min-h-0 flex-col overflow-hidden",
          "h-full w-full border-0 bg-[#060d18]/98",
          "lg:h-[min(820px,calc(100%-0.5rem))] lg:w-[88vw] lg:max-w-[1240px]",
          "lg:border lg:border-cyan-400/30 lg:shadow-[0_0_80px_rgba(0,0,0,0.55)]",
        )}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${node.name} 地点工作台`}
      >
        {/* 顶部地点状态栏 */}
        <header className="shrink-0 border-b border-cyan-400/15 bg-[#050b14]/80 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <button
                type="button"
                onClick={onClose}
                className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 border border-cyan-400/20 px-2.5 py-1.5 text-[11px] text-cyan-100 hover:border-cyan-400/40"
              >
                <ArrowLeft className="size-3.5" />
                返回地图
              </button>
              <div className="min-w-0">
                <p className="truncate text-[10px] text-slate-500">
                  {regionName} / {zoneName} · 地点工作台
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-semibold text-cyan-50">{node.name}</h2>
                  <span className={statusBadgeClass(node.status)}>
                    {SANDTABLE_STATUS_LABELS[node.status]}
                  </span>
                </div>
                {node.description ? (
                  <p className="mt-1 line-clamp-1 text-[12px] text-slate-400">{node.description}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 lg:min-w-[220px]">
              <StatusMetric label="在场" value={node.presentNpcCount ?? 0} tone="ok" />
              <StatusMetric label="任务" value={node.relatedTaskCount} />
              <StatusMetric
                label="事件"
                value={node.relatedEventCount}
                tone={node.relatedEventCount > 0 ? "warn" : "default"}
              />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="size-5 animate-spin text-cyan-400" />
            加载地点工作台…
          </div>
        ) : null}

        {!loading && error ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <p className="max-w-md border border-rose-400/20 bg-rose-950/20 p-4 text-[13px] text-rose-200">
              {error}
            </p>
          </div>
        ) : null}

        {!loading && !error ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
            {/* 左栏：NPC 互动 */}
            <WorkspaceColumn
              icon={Users}
              title="NPC 互动"
              subtitle="联络、协同与对话"
              className="min-h-[240px] shrink-0 lg:w-[30%] lg:min-h-0 lg:shrink"
            >
              <SandtableNpcList npcs={node.relatedNpcs} maxItems={12} />
              <div className="mt-4 border-t border-cyan-400/10 pt-4">
                <NpcTaskActionList
                  node={node}
                  project={project}
                  tasks={tasks}
                  completedActionIds={completedActionIds}
                />
              </div>
              <div className="mt-4 border border-cyan-400/10 bg-slate-950/40 p-3">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-cyan-100">
                  <MessageSquare className="size-3.5 text-cyan-400" />
                  对话
                </div>
                <p className="text-[11px] leading-5 text-slate-500">
                  对话系统筹备中。可先通过上方 NPC 卡片与推进动作完成协同。
                </p>
              </div>
            </WorkspaceColumn>

            {/* 中栏：任务 / 地点行动 */}
            <WorkspaceColumn
              icon={Zap}
              title="任务与行动"
              subtitle="推进条件、地点行动与推荐动作"
              className="min-h-[280px] shrink-0 lg:min-w-0 lg:flex-1 lg:min-h-0 lg:shrink"
            >
              {recommendedAction ? (
                <div className="mb-4 border border-cyan-400/35 bg-cyan-950/25 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] text-cyan-300">
                    <Sparkles className="size-3" />
                    推荐动作
                  </div>
                  <p className="text-sm font-medium text-cyan-50">{recommendedAction.label}</p>
                  {recommendedAction.description ? (
                    <p className="mt-1 text-[11px] leading-5 text-slate-400">
                      {recommendedAction.description}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <NpcTaskRequirementList node={node} project={project} tasks={tasks} />

              <div className="mt-4">
                <h4 className="mb-2 flex items-center gap-2 text-[11px] font-medium text-cyan-100">
                  <ClipboardList className="size-3.5 text-cyan-400" />
                  当前相关任务
                </h4>
                <SandtableTokenList items={taskItems} empty="暂无关联任务" />
              </div>

              <div className="mt-4">
                {workspace && workspace.unlocked ? (
                  <LocationActionExecutePanel
                    locationId={workspace.locationId}
                    actions={workspace.actionItems}
                    user={workspace.user}
                    unlocked={workspace.unlocked}
                    appearance="sandtable"
                    onExecuted={() => void refreshWorkspace()}
                  />
                ) : (
                  <p className="border border-cyan-400/10 bg-slate-950/40 p-3 text-[11px] text-slate-500">
                    {node.locked ? "地点尚未解锁，暂不可执行行动。" : "暂无可执行地点行动。"}
                  </p>
                )}
              </div>
            </WorkspaceColumn>

            {/* 右栏：事件 / 风险 / 日志 */}
            <WorkspaceColumn
              icon={ShieldAlert}
              title="态势与日志"
              subtitle="事件、风险与行动记录"
              className="min-h-[220px] shrink-0 lg:w-[28%] lg:min-h-0 lg:shrink"
            >
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-[11px] font-medium text-cyan-100">
                    <ShieldAlert className="size-3.5 text-rose-400" />
                    活跃事件
                  </h4>
                  {node.relatedEventCount > 0 ? (
                    <p className="border border-rose-400/20 bg-rose-950/20 p-2.5 text-[11px] leading-5 text-rose-100/90">
                      当前有 {node.relatedEventCount} 个关联事件待关注，可通过中栏地点行动触发或推进。
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-600">暂无活跃事件。</p>
                  )}
                </div>

                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-[11px] font-medium text-cyan-100">
                    <AlertTriangle className="size-3.5 text-amber-400" />
                    风险与影响
                  </h4>
                  <SandtableTokenList items={riskItems} empty="暂无风险标签" />
                </div>

                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-[11px] font-medium text-cyan-100">
                    <ScrollText className="size-3.5 text-cyan-400" />
                    地点日志
                  </h4>
                  {workspace && workspace.logs.length > 0 ? (
                    <ul className="space-y-2">
                      {workspace.logs.map((log) => (
                        <li
                          key={log.id}
                          className="border border-cyan-400/10 bg-slate-950/50 p-2.5 text-[11px] leading-5 text-slate-400"
                        >
                          <p className="text-slate-300">{log.content}</p>
                          <p className="mt-1 text-[10px] text-slate-600">{formatLogTime(log.createdAt)}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-slate-600">当前地点暂无行动记录。</p>
                  )}
                </div>
              </div>
            </WorkspaceColumn>
          </div>
        ) : null}

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-cyan-400/15 px-4 py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs text-cyan-100 hover:text-cyan-50"
          >
            <ArrowLeft className="size-3.5" />
            返回地图
          </button>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-cyan-200/90"
          >
            前往任务页
            <ExternalLink className="size-3" />
          </Link>
        </footer>
      </div>
    </div>
  );
}
