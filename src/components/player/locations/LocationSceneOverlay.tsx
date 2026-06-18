"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ProjectState, Task } from "@prisma/client";
import {
  ArrowLeft,
  ClipboardList,
  DoorOpen,
  Loader2,
  MessageSquare,
  ScrollText,
  ShieldAlert,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveNodeLocationId } from "@/lib/resolveNodeLocationId";
import type { SandtableLocationNode } from "@/game/locationSandtablePresentationEngine";
import type { LocationActionDisplayItem } from "@/game/locationPresentationEngine";
import { SandtableNpcList } from "./SandtableNpcList";
import { NpcTaskRequirementList } from "./NpcTaskRequirementList";
import { NpcTaskActionList } from "./NpcTaskActionList";
import { LocationActionExecutePanel } from "./LocationActionExecutePanel";
import { SandtableDetailSection, SandtableTokenList, SANDTABLE_STATUS_LABELS } from "./sandtableDetailUi";

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

  return (
    <div className="absolute inset-0 z-40 flex">
      <button
        type="button"
        aria-label="关闭地点场景"
        className="absolute inset-0 bg-[#050B14]/70 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative ml-auto flex h-full w-full max-w-3xl flex-col border-l border-cyan-400/25 bg-[#060d18]/98 shadow-[-12px_0_40px_rgba(0,0,0,0.45)]">
        <header className="shrink-0 border-b border-cyan-400/15 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <button
                type="button"
                onClick={onClose}
                className="mb-2 inline-flex items-center gap-1.5 text-[11px] text-cyan-300/90 hover:text-cyan-200"
              >
                <ArrowLeft className="size-3.5" />
                返回地图
              </button>
              <p className="truncate text-[10px] text-slate-500">
                {regionName} / {zoneName} · 地点场景
              </p>
              <h2 className="mt-0.5 truncate text-lg font-semibold text-cyan-50">{node.name}</h2>
            </div>
            <span
              className={cn(
                "shrink-0 border px-2 py-0.5 text-[10px] whitespace-nowrap",
                node.status === "recommended" && "border-yellow-400/40 text-yellow-100",
                node.status === "has_task" && "border-amber-400/40 text-amber-100",
                node.status === "has_event" && "border-rose-400/40 text-rose-100",
                node.status === "locked" && "border-slate-600/30 text-slate-500",
                node.status !== "locked" && node.status !== "has_event" && node.status !== "has_task" && node.status !== "recommended" && "border-cyan-400/25 text-cyan-100",
              )}
            >
              {SANDTABLE_STATUS_LABELS[node.status]}
            </span>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {node.description ? (
            <p className="border border-cyan-400/10 bg-slate-950/50 p-3 text-[13px] leading-6 text-slate-300">
              {node.description}
            </p>
          ) : null}

          {loading ? (
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin text-cyan-400" />
              加载地点工作台…
            </div>
          ) : null}

          {!loading && error ? (
            <p className="mt-4 border border-rose-400/20 bg-rose-950/20 p-3 text-[13px] text-rose-200">
              {error}
            </p>
          ) : null}

          {!loading && !error ? (
            <>
              <SandtableDetailSection icon={Users} title="相关 NPC">
                <SandtableNpcList npcs={node.relatedNpcs} maxItems={8} />
              </SandtableDetailSection>

              <NpcTaskRequirementList node={node} project={project} tasks={tasks} />
              <NpcTaskActionList
                node={node}
                project={project}
                tasks={tasks}
                completedActionIds={completedActionIds}
              />

              {workspace && workspace.unlocked ? (
                <div className="mt-4">
                  <LocationActionExecutePanel
                    locationId={workspace.locationId}
                    actions={workspace.actionItems}
                    user={workspace.user}
                    unlocked={workspace.unlocked}
                    appearance="sandtable"
                    onExecuted={() => void refreshWorkspace()}
                  />
                </div>
              ) : (
                <SandtableDetailSection icon={DoorOpen} title="地点行动">
                  <p className="text-[11px] text-slate-600">
                    {node.locked ? "地点尚未解锁，暂不可执行行动。" : "暂无可执行地点行动。"}
                  </p>
                </SandtableDetailSection>
              )}

              <SandtableDetailSection icon={ClipboardList} title="相关任务">
                <SandtableTokenList
                  items={node.relatedTaskTitles?.length ? node.relatedTaskTitles : node.relatedTaskSlugs}
                  empty="暂无任务"
                />
              </SandtableDetailSection>

              <SandtableDetailSection icon={ShieldAlert} title="事件">
                {node.relatedEventCount > 0 ? (
                  <p className="text-[11px] text-rose-200/90">
                    当前有 {node.relatedEventCount} 个关联事件待关注，可通过地点行动触发或推进。
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-600">暂无活跃事件。</p>
                )}
              </SandtableDetailSection>

              <SandtableDetailSection icon={MessageSquare} title="对话">
                <p className="text-[11px] text-slate-600">
                  对话系统筹备中。可先通过 NPC 卡片与任务推进动作完成协同。
                </p>
              </SandtableDetailSection>

              <SandtableDetailSection icon={ScrollText} title="地点日志">
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
              </SandtableDetailSection>
            </>
          ) : null}
        </div>

        <footer className="shrink-0 border-t border-cyan-400/15 p-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 items-center justify-center gap-1.5 border border-cyan-400/20 text-xs text-cyan-100 hover:border-cyan-400/40"
            >
              <ArrowLeft className="size-3.5" />
              返回地图
            </button>
            <Link
              href="/tasks"
              className="flex h-9 items-center justify-center gap-1.5 border border-cyan-400/20 text-xs text-cyan-100 hover:border-cyan-400/40"
            >
              <ClipboardList className="size-3.5" />
              前往任务页
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
