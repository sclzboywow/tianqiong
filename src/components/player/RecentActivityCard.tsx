import Link from "next/link";
import type { GameLogSummary } from "@/game/logEngine";
import { sanitizePlayerLogContent } from "@/game/taskEffectPlayerDisplay";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "./playerTheme";

type RecentActivityCardProps = {
  logs: GameLogSummary[];
  maxItems?: number;
  title?: string;
};

function formatLogTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function RecentActivityCard({ logs, maxItems = 5, title = "最近动态" }: RecentActivityCardProps) {
  const displayLogs = logs.slice(0, maxItems);

  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <h3 className="text-base font-semibold text-[#EAF3FF]">{title}</h3>
      </div>

      <div className={playerCardBodyClass}>
        {displayLogs.length === 0 ? (
          <p className="text-[13px] text-[#8EA3B8] lg:text-sm">暂无行动、事件或任务记录。</p>
        ) : (
          <ul className="space-y-2.5 lg:space-y-3">
            {displayLogs.map((log) => (
              <li
                key={log.id}
                className="text-[13px] leading-relaxed text-[#EAF3FF]/90 lg:text-sm"
              >
                <span className="mr-2 tabular-nums text-[#8EA3B8]">
                  {formatLogTime(log.createdAt)}
                </span>
                {sanitizePlayerLogContent(log.content)}
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/daily-report"
          className="mt-4 inline-block text-xs text-[#2EA8FF] hover:underline"
        >
          查看全部动态 →
        </Link>
      </div>
    </section>
  );
}
