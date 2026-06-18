import { RadioTower } from "lucide-react";
import type { ChapterInfo } from "@/game/playerGuidanceEngine";
import { taskDetailPanelHeader } from "./tasks/taskBoardUi";
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
        <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">
          {chapterInfo.chapterSubtitle}
          <span className="text-slate-700"> · </span>
          {stageName}
          <span className="text-slate-700"> · </span>
          <CommandCenterGuideButton />
        </p>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 px-3 py-2.5 text-[11px]">
        <div>
          <span className="text-slate-600">阶段推进 </span>
          <span className="font-semibold tabular-nums text-cyan-100">{stageProgress}%</span>
        </div>
        <div>
          <span className="text-slate-600">主线卡点 </span>
          <span
            className={`font-semibold tabular-nums ${
              mainlineBlockerCount > 0 ? "text-amber-200/90" : "text-emerald-300/70"
            }`}
          >
            {mainlineBlockerCount > 0 ? mainlineBlockerCount : "无"}
          </span>
        </div>
        <div>
          <span className="text-slate-600">风险态势 </span>
          <span
            className={`font-semibold tabular-nums ${
              riskCount > 0 ? "text-rose-300/90" : "text-slate-500"
            }`}
          >
            {riskCount > 0 ? `${riskCount} 项` : riskLabel}
          </span>
        </div>
        <div className="text-slate-600">
          总体工程 <span className="tabular-nums text-slate-400">{overallProgress}%</span>
        </div>
        <div className="hidden min-w-0 flex-1 truncate text-[10px] text-slate-700 sm:block">
          {chapterInfo.chapterName}
        </div>
      </div>

      {/* 桌面端 (xl+)：资源摘要嵌在 HUD 底部；移动端改由 Layout 底部 resourceBar 渲染 */}
      <div className="hidden px-3 py-2 xl:block">
        <PlayerResourceBar variant="compact" {...resources} />
      </div>
    </header>
  );
}
