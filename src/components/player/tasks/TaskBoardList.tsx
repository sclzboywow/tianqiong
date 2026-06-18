"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  TaskBoardCategory,
  TaskBoardCategoryId,
  TaskItem,
} from "@/game/taskPresentationEngine";
import { taskMatchesCategory } from "@/game/taskPresentationEngine";
import { playerCardClass } from "../playerTheme";
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
    title: "全部待处理",
    description: "按处理优先级拆成队列，避免所有任务挤成一堆。",
  },
  mainline: {
    title: "主线任务",
    description: "优先推动章节目标和阶段关键节点。",
  },
  emergency: {
    title: "突发事件",
    description: "这些事项可能带来风险扩散，建议及时处理。",
  },
  collaboration: {
    title: "协作任务",
    description: "需要多人或特定岗位配合完成。",
  },
  completed: {
    title: "已完成",
    description: "历史结算记录，主要用于回看处理结果。",
  },
};

function BoardLane({ lane }: { lane: Lane }) {
  return (
    <section className={cn(playerCardClass, "overflow-hidden")}>
      <div className="border-b border-[rgba(60,160,255,0.12)] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#EAF3FF]">{lane.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#8EA3B8]">{lane.description}</p>
          </div>
          <span className="rounded-full border border-[rgba(60,160,255,0.18)] px-2 py-0.5 text-xs tabular-nums text-[#8EA3B8]">
            {lane.items.length}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-3">
        {lane.items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[rgba(60,160,255,0.16)] px-4 py-6 text-center text-sm text-[#8EA3B8]">
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
    const mainline = active.filter((item) => item.isMainline);
    const emergency = active.filter((item) => !item.isMainline && item.isEmergency);
    const collaboration = active.filter(
      (item) => !item.isMainline && !item.isEmergency && item.isCollaboration,
    );
    const other = active.filter(
      (item) => !item.isMainline && !item.isEmergency && !item.isCollaboration,
    );

    const result: Lane[] = [
      {
        id: "mainline",
        title: "主线推进",
        description: "会影响章节目标和阶段门，优先处理。",
        items: mainline,
        emptyText: "当前没有待处理主线任务。",
      },
      {
        id: "emergency",
        title: "突发风险",
        description: "风险类、广播类、稀有度较高的事项。",
        items: emergency,
        emptyText: "当前没有突发风险。",
      },
      {
        id: "collaboration",
        title: "协作待办",
        description: "需要多人提交或岗位协同的任务。",
        items: collaboration,
        emptyText: "当前没有协作任务。",
      },
    ];

    if (other.length > 0) {
      result.push({
        id: "other",
        title: "其他待办",
        description: "未归入主线、突发、协作的普通事项。",
        items: other,
        emptyText: "暂无其他待办。",
      });
    }

    return result;
  }, [taskItems]);

  const copy = CATEGORY_COPY[activeCategory];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.42)] p-3">
        <div className="mb-3 flex flex-col gap-1 px-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-[#2EA8FF]">任务筛选</p>
            <p className="text-xs text-[#8EA3B8]">按队列查看，不再把所有任务堆成资料卡。</p>
          </div>
        </div>
        <TaskBoardCategoryChips
          categories={categories}
          activeId={activeCategory}
          onSelect={setActiveCategory}
        />
      </section>

      {activeCategory === "all" ? (
        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-3">
          {lanes.map((lane) => (
            <BoardLane key={lane.id} lane={lane} />
          ))}
        </div>
      ) : (
        <section className={cn(playerCardClass, "p-4")}>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#EAF3FF]">{copy.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-[#8EA3B8]">{copy.description}</p>
            </div>
            <span className="text-xs tabular-nums text-[#8EA3B8]">{filtered.length} 项</span>
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[rgba(60,160,255,0.16)] px-4 py-8 text-center text-sm text-[#8EA3B8]">
              该分类下暂无任务。
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
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
