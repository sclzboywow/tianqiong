import Link from "next/link";
import { ArrowRight, ClipboardList, MapPin, Radio } from "lucide-react";
import type { RecommendedTaskBoardItem, TaskBoardData } from "@/game/taskPresentationEngine";
import {
  taskHudButtonPrimary,
  taskHudButtonSecondary,
  taskHudMetric,
  taskHudPanel,
  taskHudTag,
} from "./taskBoardUi";

type TaskBoardRecommendedCardProps = {
  item: RecommendedTaskBoardItem;
};

export function TaskBoardRecommendedCard({ item }: TaskBoardRecommendedCardProps) {
  const settlementLabel = item.task.type === "emergency" ? "进入结算" : "查看任务";
  const locationLabel = item.task.sourceLocationName
    ? `前往 ${item.task.sourceLocationName}`
    : "前往协同地图";

  return (
    <section className={`${taskHudPanel} relative border-cyan-400/35 bg-cyan-950/20`}>
      <div className="absolute inset-y-0 left-0 w-0.5 bg-cyan-400/70" />
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:p-5">
        <div className="min-w-0 pl-1">
          <p className="inline-flex items-center gap-2 text-[11px] font-medium text-cyan-300">
            <Radio className="size-3.5" />
            调度建议 · 当前优先
          </p>
          <h2 className="mt-2 text-lg font-semibold leading-tight text-cyan-50">{item.task.title}</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-400">指挥建议：{item.reason}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className={`${taskHudTag} border-cyan-400/25 text-cyan-100`}>{item.task.typeLabel}</span>
            <span className={`${taskHudTag} border-slate-600/30 text-slate-400`}>
              成功率 {Math.round(item.task.baseSuccessRate)}%
            </span>
            {item.task.sourceLocationName ? (
              <span className={`${taskHudTag} border-emerald-400/25 text-emerald-100`}>
                {item.task.sourceLocationName}
              </span>
            ) : null}
          </div>
        </div>

        <div className={`${taskHudPanel} flex flex-col justify-between p-3`}>
          <p className="text-[11px] leading-5 text-slate-500">
            先在协同地图处理现场，需要提交方案时再进入任务结算。
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row lg:flex-col">
            {item.task.locationHref ? (
              <Link href={item.task.locationHref} className={taskHudButtonPrimary}>
                <MapPin className="size-3.5 shrink-0" />
                {locationLabel}
              </Link>
            ) : null}
            <Link href={item.task.href} className={taskHudButtonSecondary}>
              {settlementLabel}
              <ArrowRight className="size-3.5 shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

type TaskBoardHeaderProps = {
  data: Pick<TaskBoardData, "stageName" | "summary" | "hud">;
};

export function TaskBoardHeader({ data }: TaskBoardHeaderProps) {
  const { stageName, summary, hud } = data;

  return (
    <header className="shrink-0 border-b border-cyan-400/15 px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-cyan-400/90">
            <ClipboardList className="size-4" />
            <p className="text-[11px] font-medium">全局调度 / 任务队列</p>
          </div>
          <h1 className="text-lg font-semibold tracking-wide text-cyan-50">任务调度台</h1>
          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-slate-500">
            协同地图负责地点内处理；此处统筹主线、突发风险与协作待办，任务详情用于严肃结算。
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-1.5">
          <div className={taskHudMetric}>
            <p className="text-[10px] text-slate-500">当前阶段</p>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-cyan-50">{stageName}</p>
          </div>
          <div className={taskHudMetric}>
            <p className="text-[10px] text-slate-500">主线卡点</p>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-cyan-100">
              {hud.mainlineBlocker ?? (summary.mainlineCount > 0 ? `${summary.mainlineCount} 项` : "无")}
            </p>
          </div>
          <div className={taskHudMetric}>
            <p className="text-[10px] text-slate-500">突发风险</p>
            <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-amber-200">
              {summary.emergencyCount}
            </p>
          </div>
          <div className={taskHudMetric}>
            <p className="text-[10px] text-slate-500">协作待办</p>
            <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-violet-200">
              {summary.collaborationCount}
            </p>
          </div>
          <div className={taskHudMetric}>
            <p className="text-[10px] text-slate-500">已完成</p>
            <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-400">
              {summary.completedCount}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
