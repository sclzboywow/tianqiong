import type { DailyReportKeyChange } from "@/game/dailyReportPresentationEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

type DailyReportKeyChangesCardProps = {
  changes: DailyReportKeyChange[];
};

function toneClass(tone: DailyReportKeyChange["tone"]) {
  if (tone === "positive") return "text-[#22C55E]";
  if (tone === "negative") return "text-[#EF4444]";
  return "text-[#EAF3FF]/90";
}

export function DailyReportKeyChangesCard({ changes }: DailyReportKeyChangesCardProps) {
  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <h3 className="text-base font-semibold text-[#EAF3FF]">关键变化</h3>
      </div>
      <div className={playerCardBodyClass}>
        {changes.length === 0 ? (
          <p className="text-[13px] text-[#8EA3B8]">今日暂无指标或奖励变化记录。</p>
        ) : (
          <ul className="space-y-2">
            {changes.map((change) => (
              <li
                key={change.text}
                className={`rounded-lg border border-[rgba(60,160,255,0.1)] bg-[rgba(5,11,20,0.45)] px-3 py-2 text-[13px] font-medium ${toneClass(change.tone)}`}
              >
                {change.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
