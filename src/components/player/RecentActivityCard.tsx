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

export function RecentActivityCard({ logs, maxItems = 5, title = "指挥记录" }: RecentActivityCardProps) {
  const displayLogs = logs.slice(0, maxItems);

  return (
    <section className={playerCardClass}>
      <div className={`${playerCardHeaderClass} flex items-center justify-between gap-3`}>
        <h3 className="text-base font-semibold text-[#EAF3FF]">{title}</h3>
        <span className="text-xs text-[#8EA3B8]">{displayLogs.length} 条</span>
      </div>

      <div className={playerCardBodyClass}>
        {displayLogs.length === 0 ? (
          <p className="text-[13px] text-[#8EA3B8] lg:text-sm">暂无行动、事件或任务记录。</p>
        ) : (
          <ol className="relative space-y-3 before:absolute before:left-[5px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-[rgba(60,160,255,0.16)]">
            {displayLogs.map((log) => (
              <li key={log.id} className="relative pl-5">
                <span className="absolute left-0 top-1.5 size-2.5 rounded-full border border-[#2EA8FF] bg-[#07111F]" />
                <p className="text-[11px] tabular-nums text-[#8EA3B8]">
                  {formatLogTime(log.createdAt)}
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-[#EAF3FF]/90 lg:text-sm">
                  {sanitizePlayerLogContent(log.content)}
                </p>
              </li>
            ))}
          </ol>
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
