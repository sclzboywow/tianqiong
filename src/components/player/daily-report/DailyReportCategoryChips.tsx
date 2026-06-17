"use client";

import { cn } from "@/lib/utils";
import type { DailyReportCategory, DailyReportCategoryId } from "@/game/dailyReportPresentationEngine";

type DailyReportCategoryChipsProps = {
  categories: DailyReportCategory[];
  activeId: DailyReportCategoryId;
  onSelect: (id: DailyReportCategoryId) => void;
};

export function DailyReportCategoryChips({
  categories,
  activeId,
  onSelect,
}: DailyReportCategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((category) => {
        const active = category.id === activeId;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors",
              active
                ? "border-[#2EA8FF] bg-[rgba(30,136,255,0.15)] text-[#2EA8FF]"
                : "border-[rgba(60,160,255,0.18)] text-[#8EA3B8]",
            )}
          >
            {category.label} ({category.count})
          </button>
        );
      })}
    </div>
  );
}
