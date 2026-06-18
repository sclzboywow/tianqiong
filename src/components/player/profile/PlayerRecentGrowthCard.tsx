import Link from "next/link";
import { History } from "lucide-react";
import type { ProfileViewData } from "@/game/profilePresentationEngine";
import {
  taskDetailExpandButton,
  taskDetailPanel,
  taskDetailPanelHeader,
} from "../tasks/taskBoardUi";

const GROWTH_PREVIEW_LIMIT = 3;

type PlayerRecentGrowthCardProps = {
  logs: ProfileViewData["recentGrowth"];
};

function formatLogTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function PlayerRecentGrowthCard({ logs }: PlayerRecentGrowthCardProps) {
  const displayLogs = logs.slice(0, GROWTH_PREVIEW_LIMIT);

  return (
    <section className={taskDetailPanel}>
      <div className={taskDetailPanelHeader}>
        <h3 className="flex items-center gap-2 text-sm font-medium text-cyan-100">
          <History className="size-3.5 text-cyan-400/80" />
          最近成长
        </h3>
      </div>

      <div className="px-3 py-2">
        {displayLogs.length === 0 ? (
          <p className="text-xs text-slate-500">
            暂无成长记录。完成任务结算后，奖励与升级动态会显示在这里。
          </p>
        ) : (
          <ul className="relative border-l border-cyan-400/8 pl-3">
            {displayLogs.map((log) => (
              <li key={log.id} className="relative pb-2.5 last:pb-0">
                <span className="absolute -left-[13px] top-1 size-1 bg-cyan-400/40" />
                <p className="text-[10px] tabular-nums text-slate-700">{formatLogTime(log.createdAt)}</p>
                <p className="mt-0.5 line-clamp-2 text-[13px] leading-[1.45] text-slate-400">
                  {log.content}
                </p>
              </li>
            ))}
          </ul>
        )}
        <Link href="/daily-report" className={`${taskDetailExpandButton} mt-2 inline-block`}>
          查看全部日志
        </Link>
      </div>
    </section>
  );
}
