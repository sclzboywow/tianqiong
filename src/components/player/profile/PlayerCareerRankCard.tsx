import { Award } from "lucide-react";
import type { CareerRankView } from "@/game/careerRankEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

type PlayerCareerRankCardProps = {
  career: CareerRankView;
};

export function PlayerCareerRankCard({ career }: PlayerCareerRankCardProps) {
  const { currentRank, nextRank, requirements, progressPercent, unlocks, bonusDescription } =
    career;

  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <div className="flex items-center gap-2">
          <Award className="size-4 text-[#FACC15]" />
          <h3 className="text-base font-semibold text-[#EAF3FF]">职业阶位</h3>
        </div>
        <p className="mt-1 text-xs text-[#8EA3B8]">项目管理权限成长路线</p>
      </div>

      <div className={playerCardBodyClass}>
        <div className="rounded-lg border border-[rgba(250,204,21,0.25)] bg-[rgba(250,204,21,0.08)] px-3 py-3">
          <p className="text-xs text-[#FACC15]/80">当前阶位</p>
          <p className="mt-0.5 text-lg font-semibold text-[#EAF3FF]">{currentRank.title}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#8EA3B8]">
            {currentRank.description}
          </p>
        </div>

        {nextRank ? (
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-[#8EA3B8]">
                晋升至「{nextRank.title}」
              </span>
              <span className="tabular-nums text-[#EAF3FF]">{progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1E88FF] to-[#2EA8FF]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {requirements.length > 0 ? (
              <>
                <ul className="mt-3 space-y-2">
                  {requirements.map((req) => (
                    <li
                      key={req.label}
                      className="flex items-start justify-between gap-2 rounded-lg border border-[rgba(60,160,255,0.1)] bg-[rgba(5,11,20,0.45)] px-3 py-2"
                    >
                      <span
                        className={`text-[13px] leading-snug ${
                          req.passed ? "text-[#22C55E]" : "text-[#EAF3FF]/90"
                        }`}
                      >
                        {req.passed ? "✓ " : "○ "}
                        {req.label}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-[#8EA3B8]">
                        {req.current}/{String(req.target)}
                      </span>
                    </li>
                  ))}
                </ul>
                {requirements.some((req) => req.type === "mainline") ? (
                  <p className="mt-2 text-xs text-[#8EA3B8]">
                    主线任务仅统计你参与并提交方案的任务。
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-[13px] text-[#22C55E]">已达最高职业阶位</p>
        )}

        {unlocks.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs text-[#8EA3B8]">当前阶位权限</p>
            <ul className="mt-2 space-y-1.5">
              {unlocks.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-[13px] text-[#EAF3FF]/85"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#FACC15]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {bonusDescription ? (
          <p className="mt-3 text-[11px] leading-relaxed text-[#8EA3B8]">{bonusDescription}</p>
        ) : null}
      </div>
    </section>
  );
}
