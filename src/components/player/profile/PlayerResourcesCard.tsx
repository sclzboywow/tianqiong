import { cn } from "@/lib/utils";
import type { ProfileViewData } from "@/game/profilePresentationEngine";
import {
  PLAYER_SPIRIT_MAX,
  PLAYER_STAMINA_MAX,
} from "../playerTheme";
import {
  taskDetailPanel,
  taskDetailPanelHeader,
} from "../tasks/taskBoardUi";

type PlayerResourcesCardProps = {
  profile: Pick<ProfileViewData, "stamina" | "spirit" | "gold" | "reputation">;
};

function spiritHint(spirit: number): string {
  const pct = Math.round((spirit / PLAYER_SPIRIT_MAX) * 100);
  return `精神 ${spirit}/${PLAYER_SPIRIT_MAX}（${pct}%）`;
}

function resolveActionStatus(stamina: number, spirit: number) {
  const staminaPct = stamina / PLAYER_STAMINA_MAX;
  const spiritPct = spirit / PLAYER_SPIRIT_MAX;
  const minPct = Math.min(staminaPct, spiritPct);
  const spiritLow = spiritPct < 0.4;

  if (minPct >= 0.6 && !spiritLow) {
    return {
      label: "状态良好，可继续处理任务",
      className: "text-emerald-400/90",
    };
  }
  if (minPct >= 0.35) {
    return {
      label: spiritLow
        ? `${spiritHint(spirit)}，注意力偏弱，建议优先处理低消耗任务或先在协同地图休整`
        : "状态一般，建议优先处理低消耗任务",
      className: "text-amber-300/90",
    };
  }
  return {
    label: spiritLow
      ? `${spiritHint(spirit)}，暂不宜接高风险或多人协作任务，建议休整后再提交方案`
      : "状态偏低，建议谨慎处理高风险任务",
    className: "text-rose-400/85",
  };
}

function InlineResourceBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="w-7 shrink-0 text-[11px] text-slate-500">{label}</span>
      <div className="h-1 min-w-0 flex-1 overflow-hidden bg-slate-950/40">
        <div className="h-full bg-cyan-400/45" style={{ width: `${percent}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right text-[10px] tabular-nums text-slate-400">
        {value}/{max}
      </span>
    </div>
  );
}

export function PlayerResourcesCard({ profile }: PlayerResourcesCardProps) {
  const status = resolveActionStatus(profile.stamina, profile.spirit);

  return (
    <section className={taskDetailPanel}>
      <div className={`${taskDetailPanelHeader} py-2`}>
        <h3 className="text-sm font-medium text-cyan-100">行动状态</h3>
      </div>

      <div className="space-y-1.5 px-3 pb-2.5 pt-1">
        <p className={cn("text-xs font-medium", status.className)}>{status.label}</p>

        <div className="space-y-1">
          <InlineResourceBar label="体力" value={profile.stamina} max={PLAYER_STAMINA_MAX} />
          <InlineResourceBar label="精神" value={profile.spirit} max={PLAYER_SPIRIT_MAX} />
        </div>

        <div className="flex flex-wrap gap-x-4 text-[11px] tabular-nums text-slate-400">
          <span>
            <span className="text-slate-600">金币 </span>
            {profile.gold}
          </span>
          <span>
            <span className="text-slate-600">声望 </span>
            {profile.reputation}
          </span>
        </div>
      </div>
    </section>
  );
}
