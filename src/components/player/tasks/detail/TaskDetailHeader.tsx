import Link from "next/link";
import { ArrowLeft, ClipboardCheck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskDetailViewData } from "@/game/taskDetailPresentationEngine";
import {
  taskHudButtonPrimary,
  taskHudButtonSecondary,
  taskHudMetric,
  taskHudPanelHeader,
  taskHudTag,
} from "../taskBoardUi";

type TaskDetailHeaderProps = {
  data: TaskDetailViewData;
};

function typeTagClass(type: TaskDetailViewData["type"]) {
  switch (type) {
    case "mainline":
      return "border-cyan-400/35 text-cyan-100";
    case "emergency":
      return "border-amber-400/35 text-amber-200";
    case "collaboration":
      return "border-violet-400/35 text-violet-200";
    case "completed":
      return "border-slate-600/30 text-slate-500";
  }
}

export function TaskDetailHeader({ data }: TaskDetailHeaderProps) {
  return (
    <header className="border-b border-cyan-400/15">
      <div className={`${taskHudPanelHeader} flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between`}>
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-cyan-400/90">
            <ClipboardCheck className="size-4" />
            <p className="text-[11px] font-medium">任务结算室 / 方案决策</p>
          </div>
          <h1 className="text-lg font-semibold tracking-wide text-cyan-50">{data.title}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={cn(taskHudTag, typeTagClass(data.type))}>{data.typeLabel}</span>
            <span
              className={cn(
                taskHudTag,
                data.isCompleted
                  ? "border-slate-600/30 text-slate-500"
                  : "border-emerald-400/30 text-emerald-300",
              )}
            >
              {data.statusLabel}
            </span>
            <span className={`${taskHudTag} border-slate-600/30 text-slate-400`}>
              等级 {data.rarity}
            </span>
            {data.sourceLocationName ? (
              <span className={`${taskHudTag} border-emerald-400/25 text-emerald-100`}>
                {data.sourceLocationName}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          <Link href="/tasks" className={taskHudButtonSecondary}>
            <ArrowLeft className="size-3.5 shrink-0" />
            返回任务调度台
          </Link>
          {data.sourceLocationName && data.locationHref ? (
            <Link href={data.locationHref} className={taskHudButtonPrimary}>
              <MapPin className="size-3.5 shrink-0" />
              前往 {data.sourceLocationName}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className={taskHudMetric}>
          <p className="text-[10px] text-slate-500">当前阶段</p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-cyan-50">{data.stageName}</p>
        </div>
        <div className={taskHudMetric}>
          <p className="text-[10px] text-slate-500">来源</p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-300">{data.sourceName}</p>
        </div>
        <div className={taskHudMetric}>
          <p className="text-[10px] text-slate-500">基础成功率</p>
          <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-cyan-100">
            {Math.round(data.baseSuccessRate)}%
          </p>
        </div>
        <div className={taskHudMetric}>
          <p className="text-[10px] text-slate-500">参与进度</p>
          <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-300">
            {data.participantCount}/{data.requiredCount}
          </p>
        </div>
        <div className={taskHudMetric}>
          <p className="text-[10px] text-slate-500">提交进度</p>
          <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-300">
            {data.submittedCount}/{data.minResolveCount}
          </p>
        </div>
      </div>
    </header>
  );
}
