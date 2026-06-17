import type { LogItem } from "@/game/dailyReportPresentationEngine";
import { DailyReportLogCard } from "./DailyReportLogCard";

type DailyReportTimelineProps = {
  items: LogItem[];
};

export function DailyReportTimeline({ items }: DailyReportTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[rgba(60,160,255,0.12)] bg-[rgba(10,24,40,0.45)] px-4 py-8 text-center">
        <p className="text-sm text-[#8EA3B8]">该分类下暂无今日记录。</p>
        <p className="mt-1 text-xs text-[#8EA3B8]/80">完成任务或执行地点行动后，日志会显示在这里。</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-3 lg:space-y-4">
      <div className="pointer-events-none absolute bottom-0 left-[15px] top-0 hidden w-px bg-[rgba(60,160,255,0.15)] lg:block" />
      {items.map((item) => (
        <div key={item.id} className="relative lg:pl-8">
          <span className="absolute left-2.5 top-5 hidden size-2 rounded-full bg-[#2EA8FF] lg:block" />
          <DailyReportLogCard item={item} />
        </div>
      ))}
    </div>
  );
}
