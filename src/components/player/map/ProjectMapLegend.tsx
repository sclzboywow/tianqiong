"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const LEGEND_ITEMS = [
  { color: "bg-zinc-600", label: "灰色：未解锁" },
  { color: "bg-[#1E88FF]", label: "蓝色：已解锁" },
  { color: "bg-[#FACC15]", label: "黄色：有待办 / 推荐" },
  { color: "bg-[#EF4444]", label: "红色：高风险标签" },
  { color: "border border-[#FACC15] bg-transparent", label: "推荐：今日建议前往" },
  { color: "bg-[rgba(30,136,255,0.5)]", label: "NPC：该地点有关联角色" },
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
        <h3 className="mb-2 text-sm font-semibold text-[#EAF3FF]">图例</h3>
        <div className="space-y-2">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs text-[#8EA3B8]">
              <span className={`size-2.5 shrink-0 rounded-full ${item.color}`} />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
