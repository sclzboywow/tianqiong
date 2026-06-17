"use client";

import { useMemo, useState } from "react";
import type {
  TaskBoardCategory,
  TaskBoardCategoryId,
  TaskItem,
} from "@/game/taskPresentationEngine";
import { taskMatchesCategory } from "@/game/taskPresentationEngine";
import { TaskBoardCategorySidebar } from "./TaskBoardCategorySidebar";
import { TaskBoardCategoryChips } from "./TaskBoardCategoryChips";
import { TaskBoardCard } from "./TaskBoardCard";

type TaskBoardListProps = {
  taskItems: TaskItem[];
  categories: TaskBoardCategory[];
};

export function TaskBoardList({ taskItems, categories }: TaskBoardListProps) {
  const [activeCategory, setActiveCategory] = useState<TaskBoardCategoryId>("all");

  const filtered = useMemo(
    () => taskItems.filter((item) => taskMatchesCategory(item, activeCategory)),
    [activeCategory, taskItems],
  );

  return (
    <>
      <div className="hidden shrink-0 lg:block">
        <TaskBoardCategorySidebar
          categories={categories}
          activeId={activeCategory}
          onSelect={setActiveCategory}
        />
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <TaskBoardCategoryChips
          categories={categories}
          activeId={activeCategory}
          onSelect={setActiveCategory}
        />

        {filtered.length === 0 ? (
          <p className="rounded-xl border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.5)] px-4 py-8 text-center text-sm text-[#8EA3B8]">
            该分类下暂无任务。
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <TaskBoardCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
