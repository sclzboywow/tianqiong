"use client";

import { cn } from "@/lib/utils";
import type { DailyReportCategory, DailyReportCategoryId } from "@/game/dailyReportPresentationEngine";
import { taskHudChip, taskHudChipActive, taskHudChipIdle } from "../tasks/taskBoardUi";

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
    <div className="flex flex-wrap gap-1.5">
      {categories.map((category) => {
        const active = category.id === activeId;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={cn(taskHudChip, active ? taskHudChipActive : taskHudChipIdle)}
          >
            {category.label}
            <span className="tabular-nums text-[10px] opacity-70">{category.count}</span>
          </button>
        );
      })}
    </div>
  );
}
