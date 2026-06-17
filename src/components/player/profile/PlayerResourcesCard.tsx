import { Coins, Heart, Sparkles, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProfileViewData } from "@/game/profilePresentationEngine";
import {
  PLAYER_SPIRIT_MAX,
  PLAYER_STAMINA_MAX,
  playerCardBodyClass,
  playerCardClass,
  playerCardHeaderClass,
} from "../playerTheme";

type PlayerResourcesCardProps = {
  profile: Pick<ProfileViewData, "stamina" | "spirit" | "gold" | "reputation">;
};

function meterFillColor(kind: "stamina" | "spirit") {
  return kind === "stamina" ? "#22C55E" : "#2EA8FF";
}

function ResourceMeter({
  label,
  value,
  max,
  kind,
  icon: Icon,
}: {
  label: string;
  value: number;
  max: number;
  kind: "stamina" | "spirit";
  icon: LucideIcon;
}) {
  const color = meterFillColor(kind);
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="rounded-xl border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.5)] px-3 py-3">
      <div className="flex items-center gap-2.5">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-md"
          style={{
            backgroundColor: `${color}18`,
            border: `1px solid ${color}35`,
          }}
        >
          <Icon className="size-4" style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-[#8EA3B8]">{label}</span>
            <span className="text-sm font-medium tabular-nums text-[#EAF3FF]">
              {value}/{max}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <div
              className="h-full rounded-full"
              style={{ width: `${percent}%`, backgroundColor: color }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceStat({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.5)] px-3 py-3">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-md"
        style={{
          backgroundColor: `${color}18`,
          border: `1px solid ${color}35`,
        }}
      >
        <Icon className="size-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-[#8EA3B8]">{label}</p>
        <p className="text-lg font-semibold tabular-nums text-[#EAF3FF]">{value}</p>
      </div>
    </div>
  );
}

export function PlayerResourcesCard({ profile }: PlayerResourcesCardProps) {
  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <h3 className="text-base font-semibold text-[#EAF3FF]">资源状态</h3>
        <p className="mt-0.5 text-xs text-[#8EA3B8]">体力、精神与项目资源概览</p>
      </div>

      <div className={`${playerCardBodyClass} grid grid-cols-1 gap-2.5 sm:grid-cols-2`}>
        <ResourceMeter
          label="体力"
          value={profile.stamina}
          max={PLAYER_STAMINA_MAX}
          kind="stamina"
          icon={Heart}
        />
        <ResourceMeter
          label="精神"
          value={profile.spirit}
          max={PLAYER_SPIRIT_MAX}
          kind="spirit"
          icon={Sparkles}
        />
        <ResourceStat label="金币" value={profile.gold} icon={Coins} color="#FACC15" />
        <ResourceStat label="声望" value={profile.reputation} icon={Star} color="#FACC15" />
      </div>
    </section>
  );
}
