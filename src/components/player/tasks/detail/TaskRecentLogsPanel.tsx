"use client";

import Link from "next/link";
import type { GameLogSummary } from "@/game/logEngine";
import { sanitizePlayerLogContent } from "@/game/taskEffectPlayerDisplay";
import { ScrollText } from "lucide-react";
import { taskDetailExpandButton, taskDetailPanel, taskDetailPanelHeader } from "../taskBoardUi";

function formatLogTime(value: Date | string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

type TaskRecentLogsPanelProps = {
  logs: GameLogSummary[];
};

export function TaskRecentLogsPanel({ logs }: TaskRecentLogsPanelProps) {
  const visibleLogs = logs.slice(0, 3);
  if (visibleLogs.length === 0) return null;

  return (
    <section className={taskDetailPanel}>
      <div className={taskDetailPanelHeader}>
        <h3 className="flex items-center gap-2 text-[12px] font-medium text-cyan-100">
          <ScrollText className="size-3.5 text-cyan-400/80" />
          相关记录
        </h3>
      </div>
      <div className="px-3 py-2">
        <ul className="relative border-l border-cyan-400/8 pl-3">
          {visibleLogs.map((log) => (
            <li key={log.id} className="relative pb-2.5 last:pb-0">
              <span className="absolute -left-[13px] top-1 size-1 bg-cyan-400/40" />
              <p className="text-[10px] tabular-nums text-slate-700">{formatLogTime(log.createdAt)}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-[1.45] text-slate-400">
                {sanitizePlayerLogContent(log.content)}
              </p>
            </li>
          ))}
        </ul>
        <Link href="/tasks" className={`${taskDetailExpandButton} mt-2 inline-block`}>
          查看全部记录
        </Link>
      </div>
    </section>
  );
}
