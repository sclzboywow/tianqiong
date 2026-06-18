import { RadioTower } from "lucide-react";
import type { ChapterInfo } from "@/game/playerGuidanceEngine";
import {
  taskDetailMetric,
  taskDetailMetricAccent,
  taskDetailPanelHeader,
  taskDetailTag,
} from "./tasks/taskBoardUi";
import { PlayerResourceBar } from "./PlayerResourceBar";
import { CommandCenterGuideButton } from "./ChapterOneOnboardingModal";

type CommandCenterHeaderProps = {
  chapterInfo: ChapterInfo;
  stageName: string;
  stageProgress: number;
  overallProgress: number;
  mainlineBlockerCount: number;
  riskCount: number;
  riskLabel: string;
  resources: {
    stamina: number;
    spirit: number;
    level: number;
    exp: number;
    reputation: number;
    gold: number;
  };
};

export function CommandCenterHeader({
  chapterInfo,
  stageName,
  stageProgress,
  overallProgress,
  mainlineBlockerCount,
  riskCount,
  riskLabel,
  resources,
}: CommandCenterHeaderProps) {
  return (
    <header className="border-b border-cyan-400/8">
      <div className={taskDetailPanelHeader}>
        <div className="mb-1 flex items-center gap-2 text-cyan-400/80">
          <RadioTower className="size-4" />
          <p className="text-[11px] font-medium">项目指挥 / 总控分流</p>
        </div>
        <h1 className="text-lg font-semibold tracking-wide text-cyan-50">项目指挥台</h1>
        <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-slate-500">
          总览项目态势、当前指令与待处理卡点，快速分流至协同地图、任务台或复盘台。
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className={`${taskDetailTag} text-cyan-200/90`}>{chapterInfo.chapterSubtitle}</span>
          <span className={`${taskDetailTag} text-slate-400`}>{stageName}</span>
          {mainlineBlockerCount > 0 ? (
            <span className={`${taskDetailTag} text-amber-200/90`}>
              主线卡点 {mainlineBlockerCount}
            </span>
          ) : (
            <span className={`${taskDetailTag} text-emerald-300/70`}>主线推进中</span>
          )}
          {riskCount > 0 ? (
            <span className={`${taskDetailTag} text-rose-300/90`}>风险 {riskCount} 项</span>
          ) : (
            <span className={`${taskDetailTag} text-slate-500`}>风险可控</span>
          )}
          <CommandCenterGuideButton />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 p-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className={taskDetailMetricAccent}>
          <p className="text-[10px] text-cyan-400/60">阶段推进</p>
          <p className="mt-0.5 text-[12px] font-semibold tabular-nums text-cyan-100">
            {stageProgress}%
          </p>
        </div>
        <div className={taskDetailMetric}>
          <p className="text-[10px] text-slate-600">总体工程</p>
          <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-400">
            {overallProgress}%
          </p>
        </div>
        <div className={taskDetailMetricAccent}>
          <p className="text-[10px] text-cyan-400/55">主线卡点</p>
          <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-amber-200/90">
            {mainlineBlockerCount}
          </p>
        </div>
        <div className={taskDetailMetric}>
          <p className="text-[10px] text-slate-600">风险态势</p>
          <p
            className={`mt-0.5 text-[11px] font-semibold tabular-nums ${
              riskCount > 0 ? "text-rose-300/90" : "text-slate-500"
            }`}
          >
            {riskCount > 0 ? `${riskCount} 项` : riskLabel}
          </p>
        </div>
        <div className={`${taskDetailMetricAccent} hidden sm:block`}>
          <p className="text-[10px] text-cyan-400/55">当前章节</p>
          <p className="mt-0.5 truncate text-[11px] font-medium text-cyan-100/90">
            {chapterInfo.chapterName}
          </p>
        </div>
        <div className={`${taskDetailMetric} hidden sm:block`}>
          <p className="text-[10px] text-slate-600">当前阶段</p>
          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">{stageName}</p>
        </div>
      </div>

      <div className="hidden border-t border-cyan-400/5 px-3 py-2 xl:block">
        <PlayerResourceBar variant="compact" {...resources} />
      </div>
    </header>
  );
}
