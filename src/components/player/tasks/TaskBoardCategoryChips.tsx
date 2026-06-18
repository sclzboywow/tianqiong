"use client";

import { cn } from "@/lib/utils";
import type { TaskBoardCategory, TaskBoardCategoryId } from "@/game/taskPresentationEngine";
import {
  taskHudChip,
  taskHudChipActive,
  taskHudChipArchive,
  taskHudChipArchiveActive,
  taskHudChipIdle,
} from "./taskBoardUi";

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
  const pendingCategories = categories.filter((category) => category.id !== "completed");
  const archiveCategory = categories.find((category) => category.id === "completed");

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {pendingCategories.map((category) => {
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

      {archiveCategory ? (
        <button
          type="button"
          onClick={() => onSelect("completed")}
          className={cn(
            taskHudChipArchive,
            "ml-auto",
            activeId === "completed" && taskHudChipArchiveActive,
          )}
        >
          <span>归档</span>
          <span className="tabular-nums opacity-80">{archiveCategory.count}</span>
        </button>
      ) : null}
    </div>
  );
}
