"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, ChevronDown, Lock, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const LEGEND_ITEMS: Array<{
  key: string;
  label: string;
  preview: ReactNode;
}> = [
  {
    key: "pending",
    label: "红色数字：本地点待办任务数",
    preview: (
      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[9px] font-semibold text-white">
        2
      </span>
    ),
  },
  {
    key: "recommended",
    label: "黄色推荐：当前建议前往",
    preview: (
      <span className="inline-flex items-center gap-0.5 rounded-md border border-[rgba(250,204,21,0.45)] bg-[rgba(250,204,21,0.18)] px-1 py-0.5 text-[9px] text-[#FACC15]">
        <Sparkles className="size-2.5" />
        推荐
      </span>
    ),
  },
  {
    key: "risk-high",
    label: "红色三角：高风险线索",
    preview: (
      <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#EF4444] text-white">
        <AlertTriangle className="size-2.5" />
      </span>
    ),
  },
  {
    key: "risk",
    label: "黄色三角：风险线索",
    preview: (
      <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#FACC15] text-[#422006]">
        <AlertTriangle className="size-2.5" />
      </span>
    ),
  },
  {
    key: "npc",
    label: "NPC：该地点有关联角色",
    preview: (
      <span className="inline-flex items-center gap-0.5 rounded-md border border-[rgba(60,160,255,0.25)] bg-[rgba(10,24,40,0.95)] px-1 py-0.5 text-[9px] text-[#8EA3B8]">
        <Users className="size-2.5 text-[#2EA8FF]" />2
      </span>
    ),
  },
  {
    key: "locked",
    label: "灰色锁定：地点未解锁",
    preview: <Lock className="size-3.5 text-[#8EA3B8]" />,
  },
];

type ProjectMapLegendProps = {
  className?: string;
};

export function ProjectMapLegend({ className }: ProjectMapLegendProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("pointer-events-auto z-10 w-[240px]", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mb-2 flex w-full items-center justify-between rounded-lg border border-[rgba(60,160,255,0.22)] bg-[rgba(5,11,20,0.72)] px-3 py-2 text-xs font-medium text-[#EAF3FF] backdrop-blur-md lg:hidden"
      >
        图例
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>

      <div
        className={cn(
          "rounded-xl border border-[rgba(60,160,255,0.22)] bg-[rgba(5,11,20,0.72)] p-3 shadow-lg backdrop-blur-md",
          open ? "block" : "hidden lg:block",
        )}
      >
        <h3 className="mb-2 text-sm font-semibold text-[#EAF3FF]">角标图例</h3>
        <div className="space-y-2">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.key} className="flex items-center gap-2 text-xs text-[#8EA3B8]">
              <span className="flex w-8 shrink-0 items-center justify-center">{item.preview}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
