"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { TaskBoardCategory, TaskBoardCategoryId, TaskItem } from "@/game/taskPresentationEngine";
import { taskMatchesCategory } from "@/game/taskPresentationEngine";
import { taskHudPanel, taskHudPanelHeader } from "./taskBoardUi";
import { TaskBoardCategoryChips } from "./TaskBoardCategoryChips";
import { TaskBoardCard } from "./TaskBoardCard";

type TaskBoardListProps = {
  taskItems: TaskItem[];
  categories: TaskBoardCategory[];
};

type Lane = {
  id: string;
  title: string;
  description: string;
  items: TaskItem[];
  emptyText: string;
};

const CATEGORY_COPY: Record<TaskBoardCategoryId, { title: string; description: string }> = {
  all: {
    title: "全部队列",
    description: "主线、突发、协作与归档分栏展示。",
  },
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

function BoardLane({ lane }: { lane: Lane }) {
  return (
    <section className={cn(taskHudPanel, "flex min-h-0 flex-col overflow-hidden")}>
      <div className={taskHudPanelHeader}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-cyan-50">{lane.title}</h2>
            <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{lane.description}</p>
          </div>
          <span className={cn(taskHudPanel, "shrink-0 px-1.5 py-0.5 text-[10px] tabular-nums text-slate-400")}>
            {lane.items.length}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {lane.items.length === 0 ? (
          <p className="border border-dashed border-cyan-400/12 px-3 py-5 text-center text-[11px] text-slate-600">
            {lane.emptyText}
          </p>
        ) : (
          lane.items.map((item) => <TaskBoardCard key={item.id} item={item} />)
        )}
      </div>
    </section>
  );
}

export function TaskBoardList({ taskItems, categories }: TaskBoardListProps) {
  const [activeCategory, setActiveCategory] = useState<TaskBoardCategoryId>("all");

  const filtered = useMemo(
    () => taskItems.filter((item) => taskMatchesCategory(item, activeCategory)),
    [activeCategory, taskItems],
  );

  const lanes = useMemo<Lane[]>(() => {
    const active = taskItems.filter((item) => !item.isCompleted);
    const completed = taskItems.filter((item) => item.isCompleted).slice(0, 8);

    return [
      {
        id: "mainline",
        title: "主线推进",
        description: "会影响章节目标和阶段门，优先处理。",
        items: active.filter((item) => item.isMainline),
        emptyText: "当前没有待处理主线任务。",
      },
      {
        id: "emergency",
        title: "突发风险",
        description: "风险类、广播类事项，建议优先关注。",
        items: active.filter((item) => !item.isMainline && item.isEmergency),
        emptyText: "当前没有突发风险。",
      },
      {
        id: "collaboration",
        title: "协作待办",
        description: "需要多人提交或岗位协同的任务。",
        items: active.filter(
          (item) => !item.isMainline && !item.isEmergency && item.isCollaboration,
        ),
        emptyText: "当前没有协作待办。",
      },
      {
        id: "completed",
        title: "已完成归档",
        description: "已结算任务，可回看处理结果。",
        items: completed,
        emptyText: "暂无已完成任务。",
      },
    ];
  }, [taskItems]);

  const copy = CATEGORY_COPY[activeCategory];

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
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-4">
          {lanes.map((lane) => (
            <BoardLane key={lane.id} lane={lane} />
          ))}
        </div>
      ) : (
        <section className={cn(taskHudPanel, "p-3")}>
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[13px] font-semibold text-cyan-50">{copy.title}</h2>
              <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{copy.description}</p>
            </div>
            <span className="text-[10px] tabular-nums text-slate-500">{filtered.length} 项</span>
          </div>

          {filtered.length === 0 ? (
            <p className="border border-dashed border-cyan-400/12 px-4 py-8 text-center text-[11px] text-slate-600">
              该分类下暂无任务。
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {filtered.map((item) => (
                <TaskBoardCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
