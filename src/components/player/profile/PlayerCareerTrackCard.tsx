import { Compass } from "lucide-react";
import type { CareerTrackConfig } from "@/game/careerTrackConfig";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

type PlayerCareerTrackCardProps = {
  track: CareerTrackConfig;
};

export function PlayerCareerTrackCard({ track }: PlayerCareerTrackCardProps) {
  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <div className="flex items-center gap-2">
          <Compass className="size-4 text-[#2EA8FF]" />
          <h3 className="text-base font-semibold text-[#EAF3FF]">专业方向</h3>
        </div>
        <p className="mt-1 text-xs text-[#8EA3B8]">根据岗位推断的能力倾向</p>
      </div>

      <div className={playerCardBodyClass}>
        <div className="rounded-lg border border-[rgba(60,160,255,0.18)] bg-[rgba(30,136,255,0.08)] px-3 py-3">
          <p className="text-lg font-semibold text-[#EAF3FF]">{track.title}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#8EA3B8]">{track.description}</p>
        </div>

        <div className="mt-3">
          <p className="text-xs text-[#8EA3B8]">适配任务类型</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {track.adaptedTasks.map((task) => (
              <span
                key={task}
                className="rounded-md border border-[rgba(60,160,255,0.18)] bg-[rgba(5,11,20,0.5)] px-2 py-1 text-[11px] text-[#EAF3FF]/85"
              >
                {task}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-[#EAF3FF]/80">{track.bonusDescription}</p>
      </div>
    </section>
  );
}
