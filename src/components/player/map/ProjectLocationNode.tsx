"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AlertTriangle, Lock, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectLocationFlowNode } from "./projectMapFlowTypes";

const HUB_NODE_IDS = new Set(["owner_project_management_dept", "project_meeting_room"]);

function formatPendingCount(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}

function ProjectLocationNodeComponent({ data }: NodeProps<ProjectLocationFlowNode>) {
  const isHub = HUB_NODE_IDS.has(data.id);
  const hasRisk = data.riskTagLabels.length > 0;
  const showPendingBadge = data.unlocked && data.pendingTaskCount > 0;
  const showRiskBadge = hasRisk;
  const showNpcBadge = data.npcCount > 0;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-1 !h-1" />
      <div
        className={cn(
          "relative w-[248px] rounded-xl border px-3 py-2.5 shadow-lg transition-shadow",
          data.unlocked
            ? "border-[rgba(60,160,255,0.28)] bg-[rgba(10,24,40,0.92)]"
            : "border-[rgba(60,160,255,0.12)] bg-[rgba(10,24,40,0.55)] opacity-50 grayscale",
          isHub &&
            data.unlocked &&
            "border-[rgba(46,168,255,0.55)] shadow-[0_0_12px_rgba(30,136,255,0.18)]",
          data.isRecommended && data.unlocked && "border-[#FACC15] shadow-[0_0_14px_rgba(250,204,21,0.2)]",
        )}
      >
        {data.isRecommended && data.unlocked ? (
          <span className="absolute -left-1 -top-2 inline-flex items-center gap-0.5 rounded-md border border-[rgba(250,204,21,0.45)] bg-[rgba(250,204,21,0.18)] px-1.5 py-0.5 text-[10px] font-medium text-[#FACC15] shadow-[0_0_8px_rgba(250,204,21,0.2)]">
            <Sparkles className="size-3" />
            推荐
          </span>
        ) : null}

        {showPendingBadge ? (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[11px] font-semibold text-white shadow-md">
            {formatPendingCount(data.pendingTaskCount)}
          </span>
        ) : null}

        {showNpcBadge ? (
          <span
            className={cn(
              "absolute -bottom-2 -left-2 inline-flex items-center gap-0.5 rounded-md border border-[rgba(60,160,255,0.25)] bg-[rgba(10,24,40,0.95)] px-1.5 py-0.5 text-[10px] text-[#8EA3B8]",
              !data.unlocked && "opacity-70",
            )}
          >
            <Users className="size-3 text-[#2EA8FF]" />
            {data.npcCount}
          </span>
        ) : null}

        {showRiskBadge ? (
          <span
            className={cn(
              "absolute -bottom-2 -right-2 inline-flex size-6 items-center justify-center rounded-full border shadow-md",
              data.highRisk
                ? "border-[rgba(239,68,68,0.45)] bg-[#EF4444] text-white"
                : "border-[rgba(250,204,21,0.45)] bg-[#FACC15] text-[#422006]",
              !data.unlocked && "opacity-70",
            )}
          >
            <AlertTriangle className="size-3.5" />
          </span>
        ) : null}

        {!data.unlocked ? (
          <span className="absolute right-2 top-2 text-[#8EA3B8]">
            <Lock className="size-3.5" />
          </span>
        ) : null}

        <p className="line-clamp-2 pr-6 text-[13px] font-semibold leading-snug text-[#EAF3FF]">
          {data.name}
        </p>
        <p className="mt-0.5 text-[11px] text-[#8EA3B8]">
          {data.typeLabel} · {data.group}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-1 !h-1" />
    </>
  );
}

export const ProjectLocationNode = memo(ProjectLocationNodeComponent);
