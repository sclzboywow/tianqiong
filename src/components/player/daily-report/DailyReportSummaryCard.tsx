import type { DailyReportSummary } from "@/game/dailyReportPresentationEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

type DailyReportSummaryCardProps = {
  summary: DailyReportSummary;
};

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[rgba(60,160,255,0.1)] bg-[rgba(5,11,20,0.45)] px-3 py-2">
      <span className="text-[13px] text-[#8EA3B8]">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-[#EAF3FF]">{value}</span>
    </div>
  );
}

export function DailyReportSummaryCard({ summary }: DailyReportSummaryCardProps) {
  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <h3 className="text-base font-semibold text-[#EAF3FF]">今日摘要</h3>
      </div>
      <div className={`${playerCardBodyClass} space-y-2`}>
        <SummaryRow label="今日记录" value={summary.totalLogs} />
        <SummaryRow label="完成任务" value={summary.taskLogs} />
        <SummaryRow label="获得成长" value={summary.growthLogs} />
        <SummaryRow label="风险变化" value={summary.riskLogs} />
      </div>
    </section>
  );
}
