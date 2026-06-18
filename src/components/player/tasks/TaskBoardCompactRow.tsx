import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskItem } from "@/game/taskPresentationEngine";
import { taskHudButtonCompactPrimary, taskHudButtonCompactSecondary, taskHudTag } from "./taskBoardUi";

type TaskBoardCompactRowProps = {
  item: TaskItem;
};

function typeAccentClass(type: TaskItem["type"]) {
  switch (type) {
    case "mainline":
      return "border-l-cyan-400/70";
    case "emergency":
      return "border-l-amber-400/70";
    case "collaboration":
      return "border-l-violet-400/70";
    case "completed":
      return "border-l-slate-600";
  }
}

export function TaskBoardCompactRow({ item }: TaskBoardCompactRowProps) {
  const isCompleted = item.isCompleted;
  const detailLabel = isCompleted ? "查看结果" : "任务详情";
  const milestone =
    item.hasStageGate && item.milestoneLabels.length > 0
      ? item.milestoneLabels.join("、")
      : item.hasStageGate
        ? "阶段节点"
        : "—";

  return (
    <article
      className={cn(
        "border border-cyan-400/10 border-l-2 bg-slate-950/40 px-2.5 py-2",
        typeAccentClass(item.type),
        isCompleted && "opacity-65",
      )}
    >
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-cyan-50">{item.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
            <span className="truncate">
              地点：{item.sourceLocationName ?? "协同地图"}
            </span>
            {item.isMainline ? (
              <span className="truncate text-cyan-400/80">节点：{milestone}</span>
            ) : null}
            {!item.isMainline && item.isCollaboration ? (
              <span>
                协作 {item.participantCount}/{item.requiredCount}
              </span>
            ) : null}
            {!item.isMainline && item.isEmergency && item.urgency ? (
              <span className="text-amber-300/90">{item.urgency}风险</span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] lg:shrink-0">
          <span className={cn(taskHudTag, "border-slate-700/40 text-slate-400")}>
            {Math.round(item.baseSuccessRate)}%
          </span>
          <span className={cn(taskHudTag, "border-slate-700/40 text-slate-500")}>{item.statusLabel}</span>

          <div className="flex gap-1.5">
            {!isCompleted && item.locationHref ? (
              <Link href={item.locationHref} className={taskHudButtonCompactPrimary}>
                <MapPin className="size-3 shrink-0" />
                前往地点
              </Link>
            ) : null}
            <Link
              href={item.href}
              className={cn(
                isCompleted || !item.locationHref
                  ? taskHudButtonCompactPrimary
                  : taskHudButtonCompactSecondary,
              )}
            >
              {detailLabel}
              <ArrowRight className="size-3 shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
