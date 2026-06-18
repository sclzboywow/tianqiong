"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  DoorOpen,
  Lock,
  ShieldAlert,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SandtableLocationNode } from "@/game/locationSandtablePresentationEngine";
import { SANDTABLE_STATUS_LABELS } from "./sandtableDetailUi";

type LocationBriefPanelProps = {
  node?: SandtableLocationNode;
  regionName?: string;
  zoneName?: string;
  onEnter?: (node: SandtableLocationNode) => void;
};

export function LocationBriefPanel({
  node,
  regionName,
  zoneName,
  onEnter,
}: LocationBriefPanelProps) {
  if (!node) {
    return (
      <aside className="flex h-full w-full flex-col border-l border-cyan-400/15 bg-[#060d18]/90 p-4 text-sm text-slate-500">
        点击地图上的地点查看简要信息
      </aside>
    );
  }

  const canEnter = Boolean(node.canEnter && !node.locked);

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-l border-cyan-400/20 bg-[#060d18]/95 p-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate whitespace-nowrap text-[11px] text-slate-500">
            {regionName} / {zoneName}
          </p>
          <h2 className="mt-1 truncate whitespace-nowrap text-base font-semibold text-cyan-50">
            {node.name}
          </h2>
        </div>
        <span
          className={cn(
            "shrink-0 border px-2 py-0.5 text-[10px] whitespace-nowrap",
            node.status === "recommended" && "border-yellow-400/40 text-yellow-100",
            node.status === "has_task" && "border-amber-400/40 text-amber-100",
            node.status === "has_event" && "border-rose-400/40 text-rose-100",
            node.status === "completed" && "border-emerald-400/40 text-emerald-100",
            node.status === "locked" && "border-slate-600/30 text-slate-500",
            node.status === "normal" && "border-cyan-400/25 text-cyan-100",
          )}
        >
          {SANDTABLE_STATUS_LABELS[node.status]}
        </span>
      </div>

      {node.description ? (
        <p className="mt-3 line-clamp-4 border border-cyan-400/10 bg-slate-950/50 p-3 text-[13px] leading-6 text-slate-300">
          {node.description}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
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
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] text-slate-500">
            <AlertTriangle className="size-3" />
            影响指标
          </p>
          <div className="flex flex-wrap gap-1">
            {node.impactLabels.slice(0, 4).map((item) => (
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
        <p className="text-center text-[10px] text-slate-600">
          在当前地图内打开地点场景工作台
        </p>
        <Link
          href="/tasks"
          className="flex h-9 items-center justify-center gap-1.5 border border-cyan-400/20 text-xs text-cyan-100 hover:border-cyan-400/40"
        >
          <ClipboardList className="size-3.5" />
          查看任务板
        </Link>
      </div>
    </aside>
  );
}

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
        "border px-2.5 py-2",
        highlight
          ? "border-emerald-400/30 bg-emerald-950/20 text-emerald-100"
          : "border-cyan-400/10 bg-slate-950/50 text-slate-400",
      )}
    >
      <div className="flex items-center gap-1 text-[10px]">
        <Icon className="size-3 shrink-0" />
        {label}
      </div>
      <p className="mt-1 text-sm font-medium text-cyan-50">{value}</p>
    </div>
  );
}
