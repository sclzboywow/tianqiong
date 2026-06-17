import { Coins, Heart, Plus, Sparkles, Star, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getRequiredExpForLevel } from "@/game/playerProgressEngine";
import {
  PLAYER_SPIRIT_MAX,
  PLAYER_STAMINA_MAX,
  playerCardClass,
} from "./playerTheme";

type PlayerResourceBarProps = {
  stamina: number;
  spirit: number;
  level: number;
  exp: number;
  reputation: number;
  gold: number;
};

function meterFillColor(kind: "stamina" | "spirit" | "exp") {
  if (kind === "stamina") return "#22C55E";
  if (kind === "spirit") return "#2EA8FF";
  return "#FACC15";
}

function ResourceIconBox({
  icon: Icon,
  color,
}: {
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div
      className="flex size-7 shrink-0 items-center justify-center rounded-md"
      style={{
        backgroundColor: `${color}18`,
        border: `1px solid ${color}35`,
      }}
    >
      <Icon className="size-3.5" style={{ color }} />
    </div>
  );
}

function MobileMeter({
  label,
  value,
  max,
  kind,
  display,
}: {
  label: string;
  value: number;
  max: number;
  kind: "stamina" | "spirit" | "exp";
  display: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="rounded-xl border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.5)] px-3 py-2.5">
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-[#8EA3B8]">{label}</span>
        <span className="font-medium tabular-nums text-[#EAF3FF]">{display}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: meterFillColor(kind) }}
        />
      </div>
    </div>
  );
}

function MobileStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.5)] px-3 py-3">
      <span className="text-[13px] text-[#8EA3B8]">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-[#EAF3FF]">{value}</span>
    </div>
  );
}

function DesktopMeter({
  label,
  value,
  max,
  kind,
  rightLabel,
  icon,
}: {
  label: string;
  value: number;
  max: number;
  kind: "stamina" | "spirit" | "exp";
  rightLabel: string;
  icon: LucideIcon;
}) {
  const color = meterFillColor(kind);
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.5)] px-3 py-2">
      <ResourceIconBox icon={icon} color={color} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[#8EA3B8]">{label}</span>
          <span className="text-sm font-medium tabular-nums text-[#EAF3FF]">{rightLabel}</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
          <div
            className="h-full rounded-full"
            style={{ width: `${percent}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}

export function PlayerResourceBar({
  stamina,
  spirit,
  level,
  exp,
  reputation,
  gold,
}: PlayerResourceBarProps) {
  const expRequired = getRequiredExpForLevel(level);

  return (
    <section className={`${playerCardClass} p-3 lg:p-4`}>
      <div className="grid grid-cols-3 gap-2 lg:hidden">
        <MobileMeter
          label="体力"
          value={stamina}
          max={PLAYER_STAMINA_MAX}
          kind="stamina"
          display={`${stamina}/${PLAYER_STAMINA_MAX}`}
        />
        <MobileMeter
          label="精神"
          value={spirit}
          max={PLAYER_SPIRIT_MAX}
          kind="spirit"
          display={`${spirit}/${PLAYER_SPIRIT_MAX}`}
        />
        <MobileStat label="声望" value={reputation} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 lg:hidden">
        <MobileMeter
          label="等级"
          value={exp}
          max={expRequired}
          kind="exp"
          display={`Lv.${level}`}
        />
        <div className="flex items-center justify-between rounded-xl border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.5)] px-3 py-3">
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-[#FACC15]" />
            <div>
              <p className="text-[13px] text-[#8EA3B8]">金币</p>
              <p className="text-sm font-semibold tabular-nums text-[#EAF3FF]">{gold}</p>
            </div>
          </div>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md border border-[rgba(60,160,255,0.25)] text-[#8EA3B8]"
            aria-label="金币"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="hidden flex-col gap-3 lg:flex lg:flex-row lg:items-stretch lg:gap-3">
        <DesktopMeter
          label="体力"
          value={stamina}
          max={PLAYER_STAMINA_MAX}
          kind="stamina"
          rightLabel={`${stamina}/${PLAYER_STAMINA_MAX}`}
          icon={Heart}
        />
        <DesktopMeter
          label="精神"
          value={spirit}
          max={PLAYER_SPIRIT_MAX}
          kind="spirit"
          rightLabel={`${spirit}/${PLAYER_SPIRIT_MAX}`}
          icon={Sparkles}
        />
        <DesktopMeter
          label="等级"
          value={exp}
          max={expRequired}
          kind="exp"
          rightLabel={`Lv.${level}`}
          icon={TrendingUp}
        />
        <div className="flex min-w-[88px] items-center gap-2.5 rounded-lg border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.5)] px-3 py-2">
          <ResourceIconBox icon={Star} color="#FACC15" />
          <div>
            <p className="text-xs text-[#8EA3B8]">声望</p>
            <p className="text-sm font-semibold tabular-nums text-[#EAF3FF]">{reputation}</p>
          </div>
        </div>
        <div className="flex min-w-[120px] items-center justify-between gap-2 rounded-lg border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.5)] px-3 py-2">
          <div className="flex items-center gap-2.5">
            <ResourceIconBox icon={Coins} color="#FACC15" />
            <div>
              <p className="text-xs text-[#8EA3B8]">金币</p>
              <p className="text-sm font-semibold tabular-nums text-[#EAF3FF]">{gold}</p>
            </div>
          </div>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md border border-[rgba(60,160,255,0.25)] text-[#8EA3B8] hover:border-[#2EA8FF] hover:text-[#2EA8FF]"
            aria-label="金币"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
