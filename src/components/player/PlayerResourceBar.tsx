import { Coins, Star, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRequiredExpForLevel } from "@/game/playerProgressEngine";
import { PLAYER_SPIRIT_MAX, PLAYER_STAMINA_MAX } from "./playerTheme";

type PlayerResourceBarProps = {
  stamina: number;
  spirit: number;
  level: number;
  exp: number;
  reputation: number;
  gold: number;
  careerRankTitle?: string;
  variant?: "default" | "compact";
};

function meterFillColor(kind: "stamina" | "spirit") {
  return kind === "stamina" ? "#22C55E" : "#2EA8FF";
}

function CompactMeter({
  label,
  value,
  max,
  kind,
}: {
  label: string;
  value: number;
  max: number;
  kind: "stamina" | "spirit";
}) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="min-w-[88px] flex-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-600">{label}</span>
        <span className="tabular-nums text-slate-400">
          {value}/{max}
        </span>
      </div>
      <div className="mt-1 h-1 overflow-hidden bg-slate-950/50">
        <div
          className="h-full"
          style={{ width: `${percent}%`, backgroundColor: meterFillColor(kind) }}
        />
      </div>
    </div>
  );
}

function CompactStat({
  label,
  value,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconClass?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-1">
      {Icon ? <Icon className={cn("size-3 shrink-0", iconClass)} /> : null}
      <span className="text-[10px] text-slate-600">{label}</span>
      <span className="text-[11px] font-semibold tabular-nums text-slate-300">{value}</span>
    </div>
  );
}

function DefaultResourceBar({
  stamina,
  spirit,
  level,
  exp,
  reputation,
  gold,
  careerRankTitle,
}: Omit<PlayerResourceBarProps, "variant">) {
  const expRequired = getRequiredExpForLevel(level);

  return (
    <section className="overflow-hidden border border-cyan-400/12 bg-slate-950/35 p-3 lg:p-4">
      <div className="grid grid-cols-3 gap-2 lg:hidden">
        <CompactMeter label="体力" value={stamina} max={PLAYER_STAMINA_MAX} kind="stamina" />
        <CompactMeter label="精神" value={spirit} max={PLAYER_SPIRIT_MAX} kind="spirit" />
        <CompactStat label="声望" value={reputation} icon={Star} iconClass="text-amber-300/80" />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 lg:hidden">
        <CompactStat label="等级" value={`Lv.${level}`} />
        <CompactStat label="金币" value={gold} icon={Coins} iconClass="text-amber-300/80" />
      </div>

      <div className="hidden flex-wrap items-center gap-x-4 gap-y-2 lg:flex">
        <CompactMeter label="体力" value={stamina} max={PLAYER_STAMINA_MAX} kind="stamina" />
        <CompactMeter label="精神" value={spirit} max={PLAYER_SPIRIT_MAX} kind="spirit" />
        <CompactStat label="Lv" value={level} />
        <CompactStat label="声望" value={reputation} icon={Star} iconClass="text-amber-300/80" />
        <CompactStat label="金币" value={gold} icon={Coins} iconClass="text-amber-300/80" />
        <span className="hidden text-[10px] text-slate-700 xl:inline">
          EXP {exp}/{expRequired}
        </span>
      </div>

      {careerRankTitle ? (
        <p className="mt-2 text-xs text-slate-600 lg:mt-3">
          当前阶位：
          <span className="text-cyan-400/80">{careerRankTitle}</span>
        </p>
      ) : null}
    </section>
  );
}

function CompactResourceBar({
  stamina,
  spirit,
  level,
  reputation,
  gold,
}: Pick<
  PlayerResourceBarProps,
  "stamina" | "spirit" | "level" | "reputation" | "gold"
>) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <CompactMeter label="体力" value={stamina} max={PLAYER_STAMINA_MAX} kind="stamina" />
      <CompactMeter label="精神" value={spirit} max={PLAYER_SPIRIT_MAX} kind="spirit" />
      <CompactStat label="Lv" value={level} />
      <CompactStat label="声望" value={reputation} icon={Star} iconClass="text-amber-300/80" />
      <CompactStat label="金币" value={gold} icon={Coins} iconClass="text-amber-300/80" />
    </div>
  );
}

export function PlayerResourceBar({
  variant = "default",
  ...props
}: PlayerResourceBarProps) {
  if (variant === "compact") {
    return (
      <CompactResourceBar
        stamina={props.stamina}
        spirit={props.spirit}
        level={props.level}
        reputation={props.reputation}
        gold={props.gold}
      />
    );
  }

  return <DefaultResourceBar {...props} />;
}
