"use client";

import { cn } from "@/lib/utils";
import type { TaskBoardCategory, TaskBoardCategoryId } from "@/game/taskPresentationEngine";

type TaskBoardCategoryChipsProps = {
  categories: TaskBoardCategory[];
  activeId: TaskBoardCategoryId;
  onSelect: (id: TaskBoardCategoryId) => void;
};

export function TaskBoardCategoryChips({
  categories,
  activeId,
  onSelect,
}: TaskBoardCategoryChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const active = category.id === activeId;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
              active
                ? "border-[#2EA8FF] bg-[rgba(30,136,255,0.15)] text-[#2EA8FF]"
                : "border-[rgba(60,160,255,0.18)] text-[#8EA3B8] hover:border-[rgba(60,160,255,0.34)] hover:text-[#C9D7E6]",
            )}
          >
            <span>{category.label}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                active ? "bg-[rgba(30,136,255,0.22)] text-[#93C5FD]" : "bg-[rgba(255,255,255,0.05)]",
              )}
            >
              {category.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
