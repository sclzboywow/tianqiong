import type { DailyReportSummary } from "@/game/dailyReportPresentationEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

type DailyReportSummaryCardProps = {
  summary: DailyReportSummary;
};

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[rgba(60,160,255,0.1)] bg-[rgba(5,11,20,0.45)] px-3 py-3">
      <p className="text-[11px] text-[#8EA3B8]">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-[#EAF3FF]">{value}</p>
    </div>
  );
}

export function DailyReportSummaryCard({ summary }: DailyReportSummaryCardProps) {
  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <h3 className="text-base font-semibold text-[#EAF3FF]">今日摘要</h3>
        <p className="mt-1 text-xs text-[#8EA3B8]">自动归档今日项目变化</p>
      </div>
      <div className={`${playerCardBodyClass} space-y-3`}>
        <div className="rounded-2xl border border-[rgba(46,168,255,0.18)] bg-[rgba(30,136,255,0.08)] px-4 py-4">
          <p className="text-xs text-[#8EA3B8]">今日记录</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-[#2EA8FF]">
            {summary.totalLogs}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SummaryTile label="任务记录" value={summary.taskLogs} />
          <SummaryTile label="任务结算" value={summary.completedTaskLogs} />
          <SummaryTile label="角色成长" value={summary.growthLogs} />
          <SummaryTile label="风险变化" value={summary.riskLogs} />
        </div>
      </div>
    </section>
  );
}
