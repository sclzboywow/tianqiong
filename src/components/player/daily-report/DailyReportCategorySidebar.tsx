"use client";

import { cn } from "@/lib/utils";
import type { DailyReportCategory, DailyReportCategoryId } from "@/game/dailyReportPresentationEngine";

type DailyReportCategorySidebarProps = {
  categories: DailyReportCategory[];
  activeId: DailyReportCategoryId;
  onSelect: (id: DailyReportCategoryId) => void;
};

export function DailyReportCategorySidebar({
  categories,
  activeId,
  onSelect,
}: DailyReportCategorySidebarProps) {
  return (
    <nav className="space-y-1">
      {categories.map((category) => {
        const active = category.id === activeId;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
              active
                ? "border-[rgba(46,168,255,0.35)] bg-[rgba(30,136,255,0.12)] text-[#2EA8FF]"
                : "border-transparent text-[#8EA3B8] hover:border-[rgba(60,160,255,0.12)] hover:bg-[rgba(5,11,20,0.45)] hover:text-[#EAF3FF]",
            )}
          >
            <span>{category.label}</span>
            <span className="tabular-nums text-xs">{category.count}</span>
          </button>
        );
      })}
    </nav>
  );
}
