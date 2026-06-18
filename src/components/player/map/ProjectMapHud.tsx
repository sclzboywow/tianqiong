import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";

type ProjectMapHudProps = {
  stageName: string;
  stageProgress: number;
  overallProgress: number;
  unlockedCount: number;
  totalCount: number;
  recommendedName?: string;
  className?: string;
};

export function ProjectMapHud({
  stageName,
  stageProgress,
  overallProgress,
  unlockedCount,
  totalCount,
  recommendedName,
  className,
}: ProjectMapHudProps) {
  return (
    <div
      className={cn(
        "pointer-events-none max-w-[min(520px,calc(100%-2rem))] rounded-xl border border-[rgba(60,160,255,0.22)] bg-[rgba(5,11,20,0.72)] p-3 shadow-lg backdrop-blur-md sm:p-4",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-[#2EA8FF]">
        <Compass className="size-4 shrink-0" />
        <h1 className="text-base font-semibold text-[#EAF3FF] sm:text-lg">协同地图</h1>
      </div>
      <p className="text-xs text-[#8EA3B8] sm:text-sm">大厅看全局，地图推事项</p>
      <p className="mt-2 text-[11px] leading-relaxed text-[#8EA3B8] sm:text-xs">
        点击节点进入地点工作台，处理地点行动、本地点待办与风险线索。
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] sm:gap-2 sm:text-xs">
        <span className="rounded-full border border-[rgba(60,160,255,0.18)] bg-[rgba(5,11,20,0.5)] px-2.5 py-1 text-[#EAF3FF]">
          当前阶段：{stageName}
        </span>
        <span className="rounded-full border border-[rgba(60,160,255,0.18)] bg-[rgba(5,11,20,0.5)] px-2.5 py-1 text-[#8EA3B8]">
          阶段进度 {stageProgress}%
        </span>
        <span className="rounded-full border border-[rgba(60,160,255,0.18)] bg-[rgba(5,11,20,0.5)] px-2.5 py-1 text-[#8EA3B8]">
          总体进度 {overallProgress}%
        </span>
        <span className="rounded-full border border-[rgba(60,160,255,0.18)] bg-[rgba(5,11,20,0.5)] px-2.5 py-1 text-[#8EA3B8]">
          已解锁 {unlockedCount}/{totalCount}
        </span>
        {recommendedName ? (
          <span className="rounded-full border border-[rgba(30,136,255,0.35)] bg-[rgba(30,136,255,0.1)] px-2.5 py-1 text-[#2EA8FF]">
            推荐：{recommendedName}
          </span>
        ) : null}
      </div>
    </div>
  );
}
