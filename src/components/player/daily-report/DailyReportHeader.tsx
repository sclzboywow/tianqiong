import { FileClock } from "lucide-react";
import type { DailyReportSummary } from "@/game/dailyReportPresentationEngine";
import {
  taskDetailMetric,
  taskDetailMetricAccent,
  taskDetailPanelHeader,
  taskDetailTag,
} from "../tasks/taskBoardUi";

type DailyReportHeaderProps = {
  summary: DailyReportSummary;
};

export function DailyReportHeader({ summary }: DailyReportHeaderProps) {
  const isEmpty = summary.totalLogs === 0;

  return (
    <header className="border-b border-cyan-400/8">
      <div className={taskDetailPanelHeader}>
        <div className="mb-1 flex items-center gap-2 text-cyan-400/80">
          <FileClock className="size-4" />
          <p className="text-[11px] font-medium">项目归档 / 当日复盘</p>
        </div>
        <h1 className="text-lg font-semibold tracking-wide text-cyan-50">项目复盘台</h1>
        <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-slate-500">
          自动归档今日项目动态、任务结算、角色成长与风险变化。
        </p>
        <div className="mt-2">
          <span
            className={`${taskDetailTag} ${isEmpty ? "text-slate-500" : "text-emerald-300/80"}`}
          >
            {isEmpty ? "今日暂无新归档" : "今日动态已归档"}
          </span>
        </div>
      </div>

      {!isEmpty ? (
        <div className="grid grid-cols-2 gap-1.5 p-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className={taskDetailMetricAccent}>
            <p className="text-[10px] text-cyan-400/60">今日记录</p>
            <p className="mt-0.5 text-[12px] font-semibold tabular-nums text-cyan-100">
              {summary.totalLogs}
            </p>
          </div>
          <div className={taskDetailMetric}>
            <p className="text-[10px] text-slate-600">任务记录</p>
            <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-400">
              {summary.taskLogs}
            </p>
          </div>
          <div className={taskDetailMetricAccent}>
            <p className="text-[10px] text-cyan-400/55">任务结算</p>
            <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-cyan-200">
              {summary.completedTaskLogs}
            </p>
          </div>
          <div className={taskDetailMetric}>
            <p className="text-[10px] text-slate-600">角色成长</p>
            <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-400">
              {summary.growthLogs}
            </p>
          </div>
          <div className={taskDetailMetricAccent}>
            <p className="text-[10px] text-cyan-400/55">风险变化</p>
            <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-amber-200/90">
              {summary.riskLogs}
            </p>
          </div>
        </div>
      ) : null}
    </header>
  );
}
