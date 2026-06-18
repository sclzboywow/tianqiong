import { History } from "lucide-react";
import type { ProfileViewData } from "@/game/profilePresentationEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

type PlayerRecentGrowthCardProps = {
  logs: ProfileViewData["recentGrowth"];
  maxItems?: number;
};

function formatLogTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function PlayerRecentGrowthCard({ logs, maxItems = 5 }: PlayerRecentGrowthCardProps) {
  const displayLogs = logs.slice(0, maxItems);

  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <div className="flex items-center gap-2">
          <History className="size-4 text-[#2EA8FF]" />
          <h3 className="text-base font-semibold text-[#EAF3FF]">成长履历</h3>
        </div>
      </div>

      <div className={playerCardBodyClass}>
        {displayLogs.length === 0 ? (
          <p className="text-[13px] text-[#8EA3B8] lg:text-sm">
            暂无成长记录。完成任务结算后，奖励与升级动态会显示在这里。
          </p>
        ) : (
          <ol className="relative space-y-3 before:absolute before:left-[5px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-[rgba(60,160,255,0.16)]">
            {displayLogs.map((log) => (
              <li key={log.id} className="relative pl-5">
                <span className="absolute left-0 top-1.5 size-2.5 rounded-full border border-[#2EA8FF] bg-[#07111F]" />
                <p className="text-[11px] tabular-nums text-[#8EA3B8]">
                  {formatLogTime(log.createdAt)}
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-[#EAF3FF]/90 lg:text-sm">
                  {log.content}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
