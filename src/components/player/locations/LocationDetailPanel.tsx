"use client";

import { ClipboardList, DoorOpen, Lock, ShieldAlert, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SandtableLocationNode } from "@/game/locationSandtablePresentationEngine";
import { SANDTABLE_STATUS_LABELS, statusBadgeClass } from "./sandtableDetailUi";

type LocationDetailPanelProps = {
  node?: SandtableLocationNode;
  regionName?: string;
  zoneName?: string;
  onEnter?: (node: SandtableLocationNode) => void;
};

function StatChip({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "border px-2 py-1.5 text-[10px]",
        highlight
          ? "border-emerald-400/30 bg-emerald-950/20 text-emerald-100"
          : "border-cyan-400/10 bg-slate-950/50 text-slate-400",
      )}
    >
      <div className="flex items-center gap-1">
        <Icon className="size-3 shrink-0" />
        {label}
      </div>
      <p className="mt-0.5 text-sm font-medium text-cyan-50">{value}</p>
    </div>
  );
}

/** 右侧地点预览：摘要 + 进入地点，详细交互在场景浮层内完成 */
export function LocationDetailPanel({
  node,
  regionName,
  zoneName,
  onEnter,
}: LocationDetailPanelProps) {
  if (!node) {
    return (
      <aside className="flex h-full w-full flex-col border-l border-cyan-400/15 bg-[#060d18]/90 p-4 text-sm text-slate-500">
        点击地图上的地点查看预览
      </aside>
    );
  }

  const canEnter = Boolean(node.canEnter && !node.locked);

  return (
    <aside className="flex h-full w-full flex-col border-l border-cyan-400/20 bg-[#060d18]/95 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500">
            {regionName} / {zoneName}
          </p>
          <h2 className="mt-1 truncate text-base font-semibold text-cyan-50">{node.name}</h2>
        </div>
        <span className={statusBadgeClass(node.status)}>{SANDTABLE_STATUS_LABELS[node.status]}</span>
      </div>

      {node.description ? (
        <p className="mt-3 line-clamp-3 border border-cyan-400/10 bg-slate-950/50 p-3 text-[13px] leading-6 text-slate-300">
          {node.description}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatChip icon={Users} label="相关 NPC" value={node.relatedNpcs.length} />
        <StatChip icon={ClipboardList} label="相关任务" value={node.relatedTaskCount} />
        <StatChip icon={ShieldAlert} label="活跃事件" value={node.relatedEventCount} />
        <StatChip
          icon={Users}
          label="在场 NPC"
          value={node.presentNpcCount ?? 0}
          highlight={(node.presentNpcCount ?? 0) > 0}
        />
      </div>

      {node.impactLabels && node.impactLabels.length > 0 ? (
        <div className="mt-4">
          <p className="mb-1.5 text-[11px] text-slate-500">影响指标</p>
          <div className="flex flex-wrap gap-1">
            {node.impactLabels.slice(0, 3).map((item) => (
              <span
                key={item}
                className="border border-cyan-400/15 bg-slate-950/60 px-2 py-0.5 text-[10px] text-slate-400"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-auto space-y-2 pt-4">
        <button
          type="button"
          disabled={!canEnter}
          onClick={() => canEnter && onEnter?.(node)}
          className={cn(
            "flex h-10 w-full items-center justify-center gap-2 text-sm font-semibold transition",
            canEnter
              ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              : "cursor-not-allowed bg-slate-800 text-slate-500",
          )}
        >
          {canEnter ? <DoorOpen className="size-4" /> : <Lock className="size-4" />}
          进入地点
        </button>
        <p className="text-center text-[11px] text-slate-500">
          在地点工作台内处理 NPC、任务与事件
        </p>
      </div>
    </aside>
  );
}
