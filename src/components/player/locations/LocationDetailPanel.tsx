"use client";

import Link from "next/link";
import type { ProjectState, Task } from "@prisma/client";
import {
  AlertTriangle,
  ClipboardList,
  DoorOpen,
  Eye,
  Lock,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SandtableLocationNode } from "@/game/locationSandtablePresentationEngine";
import { SandtableNpcList } from "./SandtableNpcList";
import { NpcTaskRequirementList } from "./NpcTaskRequirementList";
import { NpcTaskActionList } from "./NpcTaskActionList";
import {
  SandtableDetailSection,
  SandtableTokenList,
  SANDTABLE_STATUS_LABELS,
} from "./sandtableDetailUi";

type LocationDetailPanelProps = {
  node?: SandtableLocationNode;
  regionName?: string;
  zoneName?: string;
  project: ProjectState;
  tasks: Task[];
  completedNpcTaskActionIds?: string[];
  onEnter?: (node: SandtableLocationNode) => void;
};

export function LocationDetailPanel({
  node,
  regionName,
  zoneName,
  project,
  tasks,
  completedNpcTaskActionIds,
  onEnter,
}: LocationDetailPanelProps) {
  if (!node) {
    return (
      <aside className="flex h-full w-full flex-col border-l border-cyan-400/15 bg-[#060d18]/90 p-4 text-sm text-slate-500">
        点击地图上的地点查看详情
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
        <p className="mt-3 border border-cyan-400/10 bg-slate-950/50 p-3 text-[13px] leading-6 text-slate-300">
          {node.description}
        </p>
      ) : null}

      <SandtableDetailSection icon={Users} title="相关 NPC">
        <SandtableNpcList npcs={node.relatedNpcs} />
      </SandtableDetailSection>

      <NpcTaskRequirementList node={node} project={project} tasks={tasks} />

      <NpcTaskActionList
        node={node}
        project={project}
        tasks={tasks}
        completedActionIds={completedNpcTaskActionIds}
      />

      <SandtableDetailSection icon={DoorOpen} title="可执行行动">
        <SandtableTokenList
          items={
            node.locked
              ? ["等待解锁"]
              : node.availableActionLabels?.length
                ? node.availableActionLabels
                : ["现场查看", "同步信息", "发起协同"]
          }
          empty="暂无行动"
        />
      </SandtableDetailSection>

      <SandtableDetailSection icon={ClipboardList} title="相关任务">
        <SandtableTokenList
          items={node.relatedTaskTitles?.length ? node.relatedTaskTitles : node.relatedTaskSlugs}
          empty="暂无任务"
        />
      </SandtableDetailSection>

      <SandtableDetailSection icon={AlertTriangle} title="影响指标">
        <SandtableTokenList
          items={node.impactLabels?.length ? node.impactLabels : node.riskTags}
          empty="暂无风险标签"
        />
      </SandtableDetailSection>

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
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/tasks"
            className="flex h-9 items-center justify-center gap-1.5 border border-cyan-400/20 text-xs text-cyan-100 hover:border-cyan-400/40"
          >
            <ClipboardList className="size-3.5" />
            查看任务
          </Link>
          <button
            type="button"
            className="flex h-9 items-center justify-center gap-1.5 border border-cyan-400/20 text-xs text-cyan-100 hover:border-cyan-400/40"
          >
            <Eye className="size-3.5" />
            设为关注
          </button>
        </div>
      </div>
    </aside>
  );
}
