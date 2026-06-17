import { Briefcase } from "lucide-react";
import type { ProfileViewData } from "@/game/profilePresentationEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

type PlayerJobAbilityCardProps = {
  jobAbility: ProfileViewData["jobAbility"];
};

export function PlayerJobAbilityCard({ jobAbility }: PlayerJobAbilityCardProps) {
  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-[#2EA8FF]" />
          <h3 className="text-base font-semibold text-[#EAF3FF]">岗位能力</h3>
        </div>
        <p className="mt-1 text-xs text-[#8EA3B8]">
          {jobAbility.jobLabel} · {jobAbility.roleTagline}
        </p>
      </div>

      <div className={playerCardBodyClass}>
        <ul className="space-y-2.5">
          {jobAbility.abilities.map((ability) => (
            <li
              key={ability}
              className="flex items-start gap-2 text-[13px] leading-relaxed text-[#EAF3FF]/90 lg:text-sm"
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#2EA8FF]" />
              {ability}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
