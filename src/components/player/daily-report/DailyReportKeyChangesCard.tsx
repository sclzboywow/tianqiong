import type { DailyReportKeyChange } from "@/game/dailyReportPresentationEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

type DailyReportKeyChangesCardProps = {
  changes: DailyReportKeyChange[];
};

function toneClass(tone: DailyReportKeyChange["tone"]) {
  if (tone === "positive") return "border-[rgba(34,197,94,0.18)] bg-[rgba(34,197,94,0.08)] text-[#86EFAC]";
  if (tone === "negative") return "border-[rgba(239,68,68,0.18)] bg-[rgba(239,68,68,0.08)] text-[#FCA5A5]";
  return "border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.45)] text-[#EAF3FF]/90";
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
                className={`rounded-xl border px-3 py-2 text-[13px] font-medium ${toneClass(change.tone)}`}
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
