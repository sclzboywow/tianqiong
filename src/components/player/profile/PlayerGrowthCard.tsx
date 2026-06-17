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
  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-[#FACC15]" />
          <h3 className="text-base font-semibold text-[#EAF3FF]">角色成长</h3>
        </div>
      </div>

      <div className={playerCardBodyClass}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-[#8EA3B8]">当前等级</p>
            <p className="text-2xl font-bold tabular-nums text-[#FACC15]">Lv.{profile.level}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#8EA3B8]">当前经验</p>
            <p className="text-sm font-semibold tabular-nums text-[#EAF3FF]">
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
          <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FACC15] to-[#FDE047] shadow-[0_0_12px_rgba(250,204,21,0.35)]"
              style={{ width: `${profile.expProgressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-[#8EA3B8]">
            距离 Lv.{profile.level + 1} 还需 {Math.max(0, profile.nextLevelExp - profile.exp)} 经验
          </p>
        </div>
      </div>
    </section>
  );
}
