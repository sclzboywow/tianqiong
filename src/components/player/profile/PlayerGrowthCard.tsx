import { TrendingUp } from "lucide-react";
import type { ProfileViewData } from "@/game/profilePresentationEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

type PlayerGrowthCardProps = {
  profile: Pick<
    ProfileViewData,
    "level" | "exp" | "nextLevelExp" | "expProgressPercent"
  >;
};

export function PlayerGrowthCard({ profile }: PlayerGrowthCardProps) {
  const needExp = Math.max(0, profile.nextLevelExp - profile.exp);

  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-[#FACC15]" />
          <h3 className="text-base font-semibold text-[#EAF3FF]">成长进度</h3>
        </div>
        <p className="mt-1 text-xs text-[#8EA3B8]">通过任务结算获得经验并提升等级</p>
      </div>

      <div className={playerCardBodyClass}>
        <div className="rounded-2xl border border-[rgba(250,204,21,0.22)] bg-[rgba(250,204,21,0.08)] px-4 py-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-[#FACC15]/80">当前等级</p>
              <p className="mt-1 text-4xl font-bold tabular-nums text-[#FACC15]">Lv.{profile.level}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#8EA3B8]">经验值</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-[#EAF3FF]">
                {profile.exp}
                <span className="text-[#8EA3B8]"> / {profile.nextLevelExp}</span>
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-[#8EA3B8]">升级进度</span>
              <span className="tabular-nums text-[#EAF3FF]">{profile.expProgressPercent}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FACC15] to-[#FDE047] shadow-[0_0_12px_rgba(250,204,21,0.35)]"
                style={{ width: `${profile.expProgressPercent}%` }}
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-[#8EA3B8]">
            距离 Lv.{profile.level + 1} 还需 {needExp} 经验
          </p>
        </div>
      </div>
    </section>
  );
}
