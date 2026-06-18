import { FileClock, Radio } from "lucide-react";

type DailyReportHeaderProps = {
  title?: string;
  subtitle?: string;
};

export function DailyReportHeader({
  title = "项目战报",
  subtitle = "按时间线复盘今日项目动态、任务结算、角色成长与风险变化。",
}: DailyReportHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-[rgba(60,160,255,0.16)] bg-[radial-gradient(circle_at_top_left,rgba(30,136,255,0.16),rgba(5,11,20,0.75)_42%,rgba(5,11,20,0.92))] p-4 lg:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[#2EA8FF]">
            <FileClock className="size-5" />
            <p className="text-xs font-medium">项目日志 / 当日复盘</p>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EAF3FF] lg:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8EA3B8]">
            {subtitle}
          </p>
        </div>

        <div className="rounded-xl border border-[rgba(60,160,255,0.16)] bg-[rgba(5,11,20,0.42)] px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-[#8EA3B8]">
            <Radio className="size-4 text-[#2EA8FF]" />
            今日同步
          </div>
          <p className="mt-1 text-sm font-semibold text-[#EAF3FF]">项目动态已归档</p>
        </div>
      </div>
    </header>
  );
}
