import { TrendingUp } from "lucide-react";
import type { ProfileViewData } from "@/game/profilePresentationEngine";
import {
  taskDetailMetricAccent,
  taskDetailPanel,
  taskDetailPanelHeader,
} from "../tasks/taskBoardUi";

type PlayerGrowthCardProps = {
  profile: Pick<
    ProfileViewData,
    "level" | "exp" | "nextLevelExp" | "expProgressPercent"
  >;
};

export function PlayerGrowthCard({ profile }: PlayerGrowthCardProps) {
  const needExp = Math.max(0, profile.nextLevelExp - profile.exp);

  return (
    <section className={taskDetailPanel}>
      <div className={taskDetailPanelHeader}>
        <h3 className="flex items-center gap-2 text-sm font-medium text-cyan-100">
          <TrendingUp className="size-3.5 text-amber-400/80" />
          成长进度
        </h3>
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] text-slate-500">当前等级</p>
            <p className="text-xl font-semibold tabular-nums text-amber-200/90">Lv.{profile.level}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-500">经验值</p>
            <p className="text-[13px] font-semibold tabular-nums text-slate-300">
              {profile.exp}
              <span className="text-slate-600"> / {profile.nextLevelExp}</span>
            </p>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-slate-600">升级进度</span>
            <span className="tabular-nums text-cyan-200/90">{profile.expProgressPercent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden bg-slate-950/40">
            <div
              className="h-full bg-amber-400/45"
              style={{ width: `${profile.expProgressPercent}%` }}
            />
          </div>
        </div>

        <div className={taskDetailMetricAccent}>
          <p className="text-xs text-cyan-400/55">距离下一级</p>
          <p className="mt-0.5 text-[13px] text-cyan-100">还需 {needExp} 经验 · Lv.{profile.level + 1}</p>
        </div>
      </div>
    </section>
  );
}
