"use client";

import { cn } from "@/lib/utils";
import type { TaskBoardCategory, TaskBoardCategoryId } from "@/game/taskPresentationEngine";
import { taskHudChip, taskHudChipActive, taskHudChipIdle } from "./taskBoardUi";

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
            <span>{category.label}</span>
            <span className="border border-current/20 px-1 py-0 text-[9px] tabular-nums opacity-80">
              {category.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
