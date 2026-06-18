"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { TaskBoardCategory, TaskBoardCategoryId, TaskItem } from "@/game/taskPresentationEngine";
import { taskMatchesCategory } from "@/game/taskPresentationEngine";
import { taskHudPanel, taskHudPanelHeader } from "./taskBoardUi";
import { TaskBoardCategoryChips } from "./TaskBoardCategoryChips";
import { TaskBoardCompactRow } from "./TaskBoardCompactRow";

type TaskBoardListProps = {
  taskItems: TaskItem[];
  categories: TaskBoardCategory[];
  excludeTaskId?: string;
};

type PendingSection = {
  id: "mainline" | "emergency" | "collaboration";
  title: string;
  items: TaskItem[];
};

const CATEGORY_COPY: Record<Exclude<TaskBoardCategoryId, "all">, { title: string; description: string }> = {
  mainline: {
    title: "主线推进",
    description: "优先推动章节目标和阶段关键节点。",
  },
  emergency: {
    title: "突发风险",
    description: "风险类事项，建议在协同地图及时处理。",
  },
  collaboration: {
    title: "协作待办",
    description: "需要多人或特定岗位配合完成。",
  },
  completed: {
    title: "已完成归档",
    description: "历史结算记录，用于复盘处理结果。",
  },
};

function PendingQueueSection({ section }: { section: PendingSection }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
        <h3 className="text-[11px] font-medium text-cyan-100">{section.title}</h3>
        <span className="text-[10px] tabular-nums text-slate-600">{section.items.length}</span>
      </div>
      <ul className="space-y-1.5">
        {section.items.map((item) => (
          <li key={item.id}>
            <TaskBoardCompactRow item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PendingQueueView({
  sections,
  hasExcludedPriority,
}: {
  sections: PendingSection[];
  hasExcludedPriority: boolean;
}) {
  const visibleSections = sections.filter((section) => section.items.length > 0);

  if (visibleSections.length === 0) {
    return (
      <p className="border border-dashed border-cyan-400/10 px-3 py-4 text-center text-[11px] text-slate-600">
        {hasExcludedPriority ? "其他队列暂无待处理项。" : "当前无待处理任务。"}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {visibleSections.map((section) => (
        <PendingQueueSection key={section.id} section={section} />
      ))}
    </div>
  );
}

export function TaskBoardList({ taskItems, categories, excludeTaskId }: TaskBoardListProps) {
  const [activeCategory, setActiveCategory] = useState<TaskBoardCategoryId>("all");

  const pendingItems = useMemo(
    () => taskItems.filter((item) => !item.isCompleted && item.id !== excludeTaskId),
    [excludeTaskId, taskItems],
  );

  const filtered = useMemo(
    () => taskItems.filter((item) => taskMatchesCategory(item, activeCategory)),
    [activeCategory, taskItems],
  );

  const pendingSections = useMemo<PendingSection[]>(() => {
    return [
      {
        id: "mainline",
        title: "主线推进",
        items: pendingItems.filter((item) => item.isMainline),
      },
      {
        id: "emergency",
        title: "突发风险",
        items: pendingItems.filter((item) => !item.isMainline && item.isEmergency),
      },
      {
        id: "collaboration",
        title: "协作待办",
        items: pendingItems.filter(
          (item) => !item.isMainline && !item.isEmergency && item.isCollaboration,
        ),
      },
    ];
  }, [pendingItems]);

  const copy =
    activeCategory === "all"
      ? null
      : CATEGORY_COPY[activeCategory as Exclude<TaskBoardCategoryId, "all">];

  return (
    <div className="space-y-3">
      <section className={cn(taskHudPanel, "p-2.5")}>
        <p className="mb-2 px-0.5 text-[10px] text-slate-500">按队列筛选 · 地点内处理请前往协同地图</p>
        <TaskBoardCategoryChips
          categories={categories}
          activeId={activeCategory}
          onSelect={setActiveCategory}
        />
      </section>

      {activeCategory === "all" ? (
        <section className={taskHudPanel}>
          <div className={taskHudPanelHeader}>
            <h2 className="text-[12px] font-medium text-cyan-50">待处理队列</h2>
            <p className="mt-0.5 text-[10px] text-slate-500">主线、突发、协作纵向展示 · 已完成请用筛选或右侧日志复盘</p>
          </div>
          <div className="p-3">
            <PendingQueueView
              sections={pendingSections}
              hasExcludedPriority={Boolean(excludeTaskId)}
            />
          </div>
        </section>
      ) : (
        <section className={cn(taskHudPanel, "p-3")}>
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[13px] font-semibold text-cyan-50">{copy?.title}</h2>
              <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{copy?.description}</p>
            </div>
            <span className="text-[10px] tabular-nums text-slate-500">{filtered.length} 项</span>
          </div>

          {filtered.length === 0 ? (
            <p className="border border-dashed border-cyan-400/10 px-4 py-6 text-center text-[11px] text-slate-600">
              该分类下暂无任务。
            </p>
          ) : (
            <ul className="space-y-1.5">
              {filtered.map((item) => (
                <li key={item.id}>
                  <TaskBoardCompactRow item={item} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
