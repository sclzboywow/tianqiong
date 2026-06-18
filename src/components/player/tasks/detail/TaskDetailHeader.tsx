import Link from "next/link";
import { ClipboardCheck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskDetailViewData } from "@/game/taskDetailPresentationEngine";
import {
  taskDetailMetric,
  taskDetailMetricAccent,
  taskDetailPanelHeader,
  taskDetailTag,
  taskHudButtonDetailPrimary,
  taskHudButtonDetailSecondary,
} from "../taskBoardUi";

type TaskDetailHeaderProps = {
  data: TaskDetailViewData;
};

function typeTagClass(type: TaskDetailViewData["type"]) {
  switch (type) {
    case "mainline":
      return "text-cyan-200";
    case "emergency":
      return "text-amber-200";
    case "collaboration":
      return "text-violet-200";
    case "completed":
      return "text-slate-500";
  }
}

export function TaskDetailHeader({ data }: TaskDetailHeaderProps) {
  return (
    <header className="border-b border-cyan-400/8">
      <div className={`${taskDetailPanelHeader} flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between`}>
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-cyan-400/80">
            <ClipboardCheck className="size-4" />
            <p className="text-[11px] font-medium">任务结算室 / 方案决策</p>
          </div>
          <h1 className="text-lg font-semibold tracking-wide text-cyan-50">{data.title}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={cn(taskDetailTag, typeTagClass(data.type))}>{data.typeLabel}</span>
            <span
              className={cn(
                taskDetailTag,
                data.isCompleted ? "text-slate-500" : "text-emerald-300/90",
              )}
            >
              {data.statusLabel}
            </span>
            <span className={`${taskDetailTag} text-slate-500`}>等级 {data.rarity}</span>
            {data.sourceLocationName ? (
              <span className={`${taskDetailTag} text-emerald-200/80`}>{data.sourceLocationName}</span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          {data.sourceLocationName && data.locationHref ? (
            <Link href={data.locationHref} className={taskHudButtonDetailPrimary}>
              <MapPin className="size-4 shrink-0" />
              前往地点：{data.sourceLocationName}
            </Link>
          ) : null}
          <Link href="/tasks" className={taskHudButtonDetailSecondary}>
            ← 返回任务调度台
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 p-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className={taskDetailMetric}>
          <p className="text-[10px] text-slate-600">当前阶段</p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">{data.stageName}</p>
        </div>
        <div className={taskDetailMetric}>
          <p className="text-[10px] text-slate-600">来源</p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">{data.sourceName}</p>
        </div>
        <div className={taskDetailMetricAccent}>
          <p className="text-[10px] text-cyan-400/60">基础成功率</p>
          <p className="mt-0.5 text-[12px] font-semibold tabular-nums text-cyan-50">
            {Math.round(data.baseSuccessRate)}%
          </p>
        </div>
        <div className={taskDetailMetricAccent}>
          <p className="text-[10px] text-cyan-400/55">参与进度</p>
          <p className="mt-0.5 text-[12px] font-semibold tabular-nums text-cyan-100">
            {data.participantCount}/{data.requiredCount}
          </p>
        </div>
        <div className={taskDetailMetricAccent}>
          <p className="text-[10px] text-cyan-400/55">提交进度</p>
          <p className="mt-0.5 text-[12px] font-semibold tabular-nums text-cyan-100">
            {data.submittedCount}/{data.minResolveCount}
          </p>
        </div>
      </div>
    </header>
  );
}
