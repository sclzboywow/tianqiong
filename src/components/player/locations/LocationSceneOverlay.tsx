"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProjectState, Task } from "@prisma/client";
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  ExternalLink,
  Loader2,
  ScrollText,
  ShieldAlert,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveNodeLocationId } from "@/lib/resolveNodeLocationId";
import type { SandtableLocationNode } from "@/game/locationSandtablePresentationEngine";
import type { LocationActionDisplayItem } from "@/game/locationPresentationEngine";
import type { ActionDependencyPreview } from "@/game/locationActionPreviewEngine";
import { ActionDependencyPreviewPanel } from "./ActionDependencyPreview";
import type { DialogueEntry, NpcInteractionType } from "@/game/npcInteractionEngine";
import { getAvailableNpcInteractions } from "@/game/npcInteractionEngine";
import { LocationNpcMainCard } from "./LocationNpcMainCard";
import { SandtableNpcList } from "./SandtableNpcList";
import { NpcTaskRequirementList } from "./NpcTaskRequirementList";
import { NpcTaskActionList } from "./NpcTaskActionList";
import { LocationActionExecutePanel } from "./LocationActionExecutePanel";
import { LocationNpcDialoguePanel } from "./LocationNpcDialoguePanel";
import { NpcInkDialoguePanel } from "./NpcInkDialoguePanel";
import type { SandtableNpcRef } from "@/game/sandtableNpcResolver";
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
  actionDependencyPreviews?: Record<string, ActionDependencyPreview>;
  logs: { id: string; content: string; createdAt: string }[];
  npcDialogueHistory?: DialogueEntry[];
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
      <p className="text-[11px] text-slate-500">{label}</p>
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
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(
    node.relatedNpcs[0]?.npcId ?? null,
  );
  const [dialogueEntries, setDialogueEntries] = useState<DialogueEntry[]>([]);
  const [pendingInteraction, setPendingInteraction] = useState<NpcInteractionType | null>(null);
  const [inkDialogueNpc, setInkDialogueNpc] = useState<SandtableNpcRef | null>(null);

  const selectedNpc = useMemo(
    () => node.relatedNpcs.find((npc) => npc.npcId === selectedNpcId) ?? node.relatedNpcs[0],
    [node.relatedNpcs, selectedNpcId],
  );

  const applyWorkspaceResponse = useCallback((res: Response, data: unknown) => {
    const payload = data as { error?: string };
    if (!res.ok) {
      setError(payload.error || "加载地点工作台失败");
      setWorkspace(null);
      return;
    }
    const next = data as WorkspacePayload;
    setWorkspace(next);
    if (next.npcDialogueHistory) {
      setDialogueEntries(next.npcDialogueHistory);
    }
    setError(null);
  }, []);

  const refreshWorkspace = useCallback(async (options?: { silent?: boolean }) => {
    if (!locationId) return;

    if (!options?.silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch(`/api/locations/${locationId}/workspace`, { cache: "no-store" });
      const data = await res.json();
      applyWorkspaceResponse(res, data);
    } catch {
      if (!options?.silent) {
        setError("网络错误，请稍后重试");
        setWorkspace(null);
      }
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
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

  const visibleDialogueEntries = useMemo(() => {
    if (!selectedNpcId) return dialogueEntries;
    return dialogueEntries.filter((entry) => !entry.npcId || entry.npcId === selectedNpcId);
  }, [dialogueEntries, selectedNpcId]);

  const otherNpcCount = useMemo(
    () => node.relatedNpcs.filter((npc) => npc.npcId !== selectedNpcId).length,
    [node.relatedNpcs, selectedNpcId],
  );

  const handleNpcInteract = useCallback(
    async (interaction: NpcInteractionType) => {
      if (!locationId || !selectedNpc) return;
      if (interaction === "talk") return;

      setPendingInteraction(interaction);

      try {
        const res = await fetch("/api/locations/npc-interaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locationId,
            npcId: selectedNpc.npcId,
            interaction,
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          entries?: DialogueEntry[];
          log?: { id: string; content: string; createdAt: string };
          message?: string;
        };

        if (data.entries?.length) {
          setDialogueEntries((current) => [...current, ...data.entries!].slice(-24));
        }

        if (data.log) {
          setWorkspace((current) => {
            if (!current) return current;
            return {
              ...current,
              logs: [data.log!, ...current.logs.filter((log) => log.id !== data.log!.id)].slice(0, 8),
            };
          });
        } else if (!res.ok && !data.entries?.length) {
          setDialogueEntries((current) => [
            ...current,
            {
              id: `sys-err-${Date.now()}`,
              role: "system",
              speaker: "系统",
              text: data.message ?? "互动失败，请稍后重试。",
              npcId: selectedNpc.npcId,
              createdAt: Date.now(),
            },
          ]);
        }
      } catch {
        setDialogueEntries((current) => [
          ...current,
          {
            id: `sys-err-${Date.now()}`,
            role: "system",
            speaker: "系统",
            text: "网络错误，互动记录保存失败。",
            npcId: selectedNpc.npcId,
            createdAt: Date.now(),
          },
        ]);
      } finally {
        setPendingInteraction(null);
      }
    },
    [locationId, selectedNpc],
  );

  const openInkDialogue = useCallback((npc: SandtableNpcRef) => {
    setSelectedNpcId(npc.npcId);
    setInkDialogueNpc(npc);
  }, []);

  const closeInkDialogue = useCallback(() => {
    setInkDialogueNpc(null);
  }, []);

  const selectedNpcTalkEnabled = selectedNpc
    ? getAvailableNpcInteractions(selectedNpc).includes("talk")
    : false;

  const riskItems = node.impactLabels?.length ? node.impactLabels : node.riskTags;
  const taskItems = node.relatedTaskTitles?.length ? node.relatedTaskTitles : node.relatedTaskSlugs;
  const otherActionsCount =
    workspace?.actionItems.filter((action) => !action.isRecommended).length ?? 0;

  const blockedActionItems =
    workspace?.actionItems.filter(
      (action) => workspace.actionDependencyPreviews?.[action.id]?.hasBlockers,
    ) ?? [];
  const availableActionItems =
    workspace?.actionItems.filter(
      (action) => !workspace.actionDependencyPreviews?.[action.id]?.hasBlockers,
    ) ?? [];

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
                <p className="truncate text-[11px] text-slate-500">
                  {regionName} / {zoneName} · 地点工作台 · 当前阶段 {workspace?.stageName || project.currentStage}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-semibold text-cyan-50">{node.name}</h2>
                  <span className={statusBadgeClass(node.status)}>
                    {SANDTABLE_STATUS_LABELS[node.status]}
                  </span>
                </div>
                {node.description ? (
                  <p className="mt-1 line-clamp-1 text-[13px] text-slate-400">{node.description}</p>
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
            {/* 左栏：当前 NPC + 对话 + 其他 NPC */}
            <WorkspaceColumn
              icon={Users}
              title="NPC 互动"
              subtitle="选中 NPC · 对话反馈 · 切换对象"
              className="min-h-[280px] shrink-0 lg:w-[32%] lg:min-h-0 lg:shrink"
              scrollBody={false}
              bodyClassName="flex flex-col gap-3 overflow-hidden p-3"
            >
              {selectedNpc ? (
                <LocationNpcMainCard
                  npc={selectedNpc}
                  onTalk={() => openInkDialogue(selectedNpc)}
                  talkEnabled={selectedNpcTalkEnabled}
                />
              ) : null}

              <LocationNpcDialoguePanel
                className="min-h-0 flex-1"
                selectedNpc={selectedNpc}
                entries={visibleDialogueEntries}
                pendingInteraction={pendingInteraction}
                onInteract={(interaction) => void handleNpcInteract(interaction)}
              />

              {otherNpcCount > 0 ? (
                <div className="shrink-0 border-t border-cyan-400/10 pt-3">
                  <p className="mb-2 text-xs font-medium text-slate-500">
                    其他 NPC（{otherNpcCount}）
                  </p>
                  <SandtableNpcList
                    npcs={node.relatedNpcs}
                    maxItems={8}
                    variant="compact"
                    excludeNpcId={selectedNpcId ?? undefined}
                    selectedNpcId={selectedNpcId ?? undefined}
                    onSelectNpc={(npc) => setSelectedNpcId(npc.npcId)}
                    empty="暂无其他 NPC"
                  />
                </div>
              ) : null}
            </WorkspaceColumn>

            <WorkspaceColumn
              icon={Zap}
              title="任务与行动"
              subtitle="推荐动作优先，其余行动折叠展示"
              className="min-h-[280px] shrink-0 lg:min-w-0 lg:flex-1 lg:min-h-0 lg:shrink"
            >
              {blockedActionItems.length > 0 ? (
                <div className="mb-3 space-y-2">
                  <h4 className="text-xs font-medium text-amber-300">当前阻塞事项</h4>
                  {blockedActionItems.map((action) => (
                    <ActionDependencyPreviewPanel
                      key={action.id}
                      preview={workspace?.actionDependencyPreviews?.[action.id]}
                      actionLabel={action.label}
                      compact
                    />
                  ))}
                </div>
              ) : null}

              {availableActionItems.length > 0 ? (
                <p className="mb-2 text-xs font-medium text-emerald-300/90">
                  可办理（{availableActionItems.length}）
                </p>
              ) : null}

              {workspace && workspace.unlocked ? (
                <LocationActionExecutePanel
                  locationId={workspace.locationId}
                  actions={workspace.actionItems}
                  actionDependencyPreviews={workspace.actionDependencyPreviews}
                  user={workspace.user}
                  unlocked={workspace.unlocked}
                  appearance="sandtable"
                  layout="workspace-hero"
                  onExecuted={() => void refreshWorkspace({ silent: true })}
                />
              ) : (
                <p className="mb-3 border border-cyan-400/10 bg-slate-950/40 p-3 text-xs text-slate-500">
                  {node.locked ? "地点尚未解锁，暂不可执行行动。" : "暂无可执行地点行动。"}
                </p>
              )}

              <div className="mt-3 space-y-3">
                <NpcTaskRequirementList node={node} project={project} tasks={tasks} />

                <NpcTaskActionList
                  node={node}
                  project={project}
                  tasks={tasks}
                  completedActionIds={completedActionIds}
                />

                <div>
                  <h4 className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-500">
                    <ClipboardList className="size-3 text-cyan-400" />
                    当前相关任务
                  </h4>
                  <SandtableTokenList items={taskItems} empty="暂无关联任务" />
                </div>

                {workspace && workspace.unlocked && otherActionsCount > 0 ? (
                  <div>
                    <h4 className="mb-1.5 text-xs font-medium text-slate-500">
                      其他地点行动（{otherActionsCount}）
                    </h4>
                    <LocationActionExecutePanel
                      locationId={workspace.locationId}
                      actions={workspace.actionItems}
                      actionDependencyPreviews={workspace.actionDependencyPreviews}
                      user={workspace.user}
                      unlocked={workspace.unlocked}
                      appearance="sandtable"
                      layout="workspace-compact"
                      onExecuted={() => void refreshWorkspace({ silent: true })}
                    />
                  </div>
                ) : null}
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
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-cyan-100">
                    <ShieldAlert className="size-3.5 text-rose-400" />
                    活跃事件
                  </h4>
                  {node.relatedEventCount > 0 ? (
                    <p className="border border-rose-400/20 bg-rose-950/20 p-2.5 text-[13px] leading-5 text-rose-100/90">
                      当前有 {node.relatedEventCount} 个关联事件待关注，可通过中栏地点行动触发或推进。
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">暂无活跃事件。</p>
                  )}
                </div>

                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-cyan-100">
                    <AlertTriangle className="size-3.5 text-amber-400" />
                    风险与影响
                  </h4>
                  <SandtableTokenList items={riskItems} empty="暂无风险标签" />
                </div>

                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-cyan-100">
                    <ScrollText className="size-3.5 text-cyan-400" />
                    地点日志
                  </h4>
                  {workspace && workspace.logs.length > 0 ? (
                    <ul className="space-y-2">
                      {workspace.logs.map((log) => (
                        <li
                          key={log.id}
                          className="border border-cyan-400/10 bg-slate-950/50 p-2.5 text-[13px] leading-5 text-slate-400"
                        >
                          <p className="text-slate-300">{log.content}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{formatLogTime(log.createdAt)}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">当前地点暂无行动记录。</p>
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
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-200/90"
          >
            前往任务页
            <ExternalLink className="size-3" />
          </Link>
        </footer>

        {inkDialogueNpc && locationId ? (
          <NpcInkDialoguePanel
            open
            locationId={locationId}
            npc={inkDialogueNpc}
            onClose={closeInkDialogue}
          />
        ) : null}
      </div>
    </div>
  );
}
