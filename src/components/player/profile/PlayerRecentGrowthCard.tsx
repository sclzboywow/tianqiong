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
          <h3 className="text-base font-semibold text-[#EAF3FF]">最近成长记录</h3>
        </div>
      </div>

      <div className={playerCardBodyClass}>
        {displayLogs.length === 0 ? (
          <p className="text-[13px] text-[#8EA3B8] lg:text-sm">
            暂无成长记录。完成任务结算后，奖励与升级动态会显示在这里。
          </p>
        ) : (
          <ul className="space-y-3">
            {displayLogs.map((log) => (
              <li
                key={log.id}
                className="rounded-lg border border-[rgba(60,160,255,0.1)] bg-[rgba(5,11,20,0.45)] px-3 py-2.5"
              >
                <p className="text-[11px] tabular-nums text-[#8EA3B8]">
                  {formatLogTime(log.createdAt)}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-[#EAF3FF]/90 lg:text-sm">
                  {log.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
