import Link from "next/link";
import type { GameLogSummary } from "@/game/logEngine";
import { sanitizePlayerLogContent } from "@/game/taskEffectPlayerDisplay";
import {
  taskDetailDivider,
  taskDetailPanel,
  taskDetailPanelHeader,
} from "./tasks/taskBoardUi";

type RecentActivityCardProps = {
  logs: GameLogSummary[];
  maxItems?: number;
};

function formatLogTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function RecentActivityCard({ logs, maxItems = 3 }: RecentActivityCardProps) {
  const displayLogs = logs.slice(0, maxItems);

  return (
    <section className={taskDetailPanel}>
      <div className={`${taskDetailPanelHeader} flex items-center justify-between gap-2`}>
        <h3 className="text-[12px] font-medium text-cyan-100">最近记录</h3>
        {displayLogs.length > 0 ? (
          <span className="text-[10px] text-slate-600">{displayLogs.length} 条</span>
        ) : null}
      </div>

      <div className="p-3">
        {displayLogs.length === 0 ? (
          <p className="text-[11px] text-slate-600">暂无行动、事件或任务记录。</p>
        ) : (
          <ol className={`${taskDetailDivider} space-y-0`}>
            {displayLogs.map((log) => (
              <li key={log.id} className="relative py-2 pl-3">
                <span className="absolute left-0 top-[13px] size-1 bg-cyan-400/30" />
                <p className="text-[10px] tabular-nums text-slate-600">
                  {formatLogTime(log.createdAt)}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-300/90">
                  {sanitizePlayerLogContent(log.content)}
                </p>
              </li>
            ))}
          </ol>
        )}

        <Link
          href="/daily-report"
          className="mt-3 inline-block text-[11px] text-cyan-400/80 hover:text-cyan-300"
        >
          查看项目复盘台 →
        </Link>
      </div>
    </section>
  );
}
