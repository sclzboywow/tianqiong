import Link from "next/link";
import type { LogItem } from "@/game/dailyReportPresentationEngine";
import { DailyReportLogCard } from "./DailyReportLogCard";

type DailyReportTimelineProps = {
  items: LogItem[];
};

export function DailyReportTimeline({ items }: DailyReportTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[rgba(60,160,255,0.12)] bg-[rgba(10,24,40,0.45)] px-4 py-10 text-center">
        <p className="text-sm text-[#8EA3B8]">今日暂无记录。</p>
        <p className="mt-1 text-xs text-[#8EA3B8]/80">
          完成任务或执行地点行动后，日志会显示在这里。
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/tasks"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1E88FF] px-4 text-sm font-medium text-white hover:bg-[#2EA8FF]"
          >
            去处理任务
          </Link>
          <Link
            href="/locations"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-[rgba(60,160,255,0.18)] px-4 text-sm font-medium text-[#C9D7E6] hover:border-[#2EA8FF]"
          >
            去协同地图
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.34)] p-3 lg:p-4">
      <div className="mb-4 flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-semibold text-[#EAF3FF]">今日时间线</h2>
          <p className="mt-1 text-xs text-[#8EA3B8]">按发生顺序记录项目变化</p>
        </div>
        <span className="rounded-full border border-[rgba(60,160,255,0.18)] px-2 py-0.5 text-xs tabular-nums text-[#8EA3B8]">
          {items.length} 条
        </span>
      </div>

      <div className="relative space-y-3 lg:space-y-4">
        <div className="pointer-events-none absolute bottom-0 left-[17px] top-0 hidden w-px bg-[rgba(60,160,255,0.16)] lg:block" />
        {items.map((item) => (
          <div key={item.id} className="relative lg:pl-9">
            <span className="absolute left-3 top-6 hidden size-2.5 rounded-full border border-[#2EA8FF] bg-[#07111F] lg:block" />
            <DailyReportLogCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
