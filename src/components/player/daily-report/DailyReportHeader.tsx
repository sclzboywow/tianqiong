import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

type DailyReportHeaderProps = {
  title?: string;
  subtitle?: string;
};

export function DailyReportHeader({
  title = "项目日志",
  subtitle = "查看今日项目动态、任务结算、角色成长与风险变化。",
}: DailyReportHeaderProps) {
  return (
    <header>
      <h1 className="text-xl font-semibold text-[#EAF3FF] lg:text-2xl">{title}</h1>
      <p className="mt-1 text-sm text-[#8EA3B8]">{subtitle}</p>
    </header>
  );
}
