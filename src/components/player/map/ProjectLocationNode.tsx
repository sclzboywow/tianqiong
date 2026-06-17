"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { ProjectLocationFlowNode } from "./projectMapFlowTypes";

const HUB_NODE_IDS = new Set(["owner_project_management_dept", "project_meeting_room"]);

function ProjectLocationNodeComponent({ data }: NodeProps<ProjectLocationFlowNode>) {
  const displayName = data.name.includes("·") ? data.name.split("·").pop()!.trim() : data.name;
  const isHub = HUB_NODE_IDS.has(data.id);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-1 !h-1" />
      <div
        className={cn(
          "relative w-[220px] rounded-xl border px-3 py-2.5 shadow-lg transition-shadow",
          data.unlocked
            ? "border-[rgba(60,160,255,0.28)] bg-[rgba(10,24,40,0.92)]"
            : "border-[rgba(60,160,255,0.12)] bg-[rgba(10,24,40,0.55)] opacity-50 grayscale",
          isHub &&
            data.unlocked &&
            "border-[rgba(46,168,255,0.55)] shadow-[0_0_12px_rgba(30,136,255,0.18)]",
          data.isRecommended && data.unlocked && "border-[#FACC15] shadow-[0_0_14px_rgba(250,204,21,0.2)]",
          data.pendingTaskCount > 0 && data.unlocked && "border-[rgba(250,204,21,0.45)]",
        )}
      >
        {data.isRecommended && data.unlocked ? (
          <span className="absolute -right-1 -top-2 rounded-md border border-[rgba(250,204,21,0.4)] bg-[rgba(250,204,21,0.15)] px-1.5 py-0.5 text-[10px] font-medium text-[#FACC15]">
            推荐
          </span>
        ) : null}

        <p className="pr-8 text-[13px] font-semibold leading-snug text-[#EAF3FF]">{displayName}</p>
        <p className="mt-0.5 text-[11px] text-[#8EA3B8]">{data.typeLabel}</p>

        <div className="mt-2 flex flex-wrap gap-1">
          {data.pendingTaskCount > 0 ? (
            <span className="rounded-md border border-[rgba(250,204,21,0.35)] bg-[rgba(250,204,21,0.12)] px-1.5 py-0.5 text-[10px] text-[#FACC15]">
              待办 {data.pendingTaskCount}
            </span>
          ) : null}
          {data.riskTagLabels.length > 0 ? (
            <span
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px]",
                data.highRisk
                  ? "border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.12)] text-[#EF4444]"
                  : "border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] text-[#F87171]",
              )}
            >
              风险 {data.riskTagLabels.slice(0, 2).join("/")}
            </span>
          ) : null}
          {data.npcCount > 0 ? (
            <span className="rounded-md border border-[rgba(60,160,255,0.2)] bg-[rgba(30,136,255,0.1)] px-1.5 py-0.5 text-[10px] text-[#8EA3B8]">
              NPC {data.npcCount}
            </span>
          ) : null}
        </div>

        {!data.unlocked ? (
          <p className="mt-1.5 text-[10px] text-[#8EA3B8]">未解锁 · 点击查看条件</p>
        ) : null}
      </div>
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-1 !h-1" />
    </>
  );
}

export const ProjectLocationNode = memo(ProjectLocationNodeComponent);
