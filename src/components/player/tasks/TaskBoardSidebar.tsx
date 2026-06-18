import { AlertTriangle, ScrollText } from "lucide-react";
import type { TaskBoardHud, TaskBoardSummary } from "@/game/taskPresentationEngine";
import type { GameLogSummary } from "@/game/logEngine";
import { sanitizePlayerLogContent } from "@/game/taskEffectPlayerDisplay";
import { ChapterMilestoneCard } from "../ChapterMilestoneCard";
import type { ChapterGoalItem } from "@/game/playerGuidanceEngine";
import { taskHudPanel, taskHudPanelHeader } from "./taskBoardUi";

function formatLogTime(value: Date | string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function TaskBoardRecentLogs({ logs }: { logs: GameLogSummary[] }) {
  const visibleLogs = logs.slice(0, 3);

  return (
    <section className={taskHudPanel}>
      <div className={taskHudPanelHeader}>
        <h3 className="flex items-center gap-2 text-[12px] font-medium text-cyan-100">
          <ScrollText className="size-3.5 text-cyan-400" />
          近期结算
        </h3>
      </div>
      <div className="px-3 py-2.5">
        {visibleLogs.length === 0 ? (
          <p className="text-[11px] text-slate-600">暂无任务结算记录</p>
        ) : (
          <ul className="relative border-l border-cyan-400/15 pl-3">
            {visibleLogs.map((log) => (
              <li key={log.id} className="relative pb-3 last:pb-0">
                <span className="absolute -left-[13px] top-1.5 size-1.5 bg-cyan-400/60" />
                <p className="text-[10px] tabular-nums text-slate-600">{formatLogTime(log.createdAt)}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-slate-400">
                  {sanitizePlayerLogContent(log.content)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function TaskBoardRiskPanel({ hud, summary }: { hud: TaskBoardHud; summary: TaskBoardSummary }) {
  if (summary.emergencyCount === 0 && !hud.riskAlert) {
    return null;
  }

  return (
    <section className={taskHudPanel}>
      <div className={taskHudPanelHeader}>
        <h3 className="flex items-center gap-2 text-[12px] font-medium text-cyan-100">
          <AlertTriangle className="size-3.5 text-amber-400" />
          风险提示
          <span className="ml-auto text-[10px] tabular-nums text-amber-200">{summary.emergencyCount} 项</span>
        </h3>
      </div>
      <div className="p-3">
        {hud.riskAlert ? (
          <p className="border border-amber-400/20 bg-amber-950/20 p-2.5 text-[11px] leading-5 text-amber-100/90">
            {hud.riskAlert}
          </p>
        ) : (
          <p className="text-[11px] text-slate-500">有 {summary.emergencyCount} 项突发风险待处理。</p>
        )}
      </div>
    </section>
  );
}

type TaskBoardSidebarProps = {
  hud: TaskBoardHud;
  summary: TaskBoardSummary;
  chapterGoals: ChapterGoalItem[];
  recentTaskLogs: GameLogSummary[];
};

export function TaskBoardSidebar({
  hud,
  summary,
  chapterGoals,
  recentTaskLogs,
}: TaskBoardSidebarProps) {
  return (
    <aside className="hidden min-h-0 space-y-3 p-3 xl:block xl:sticky xl:top-4 xl:self-start">
      <ChapterMilestoneCard goals={chapterGoals} variant="hud" />
      <TaskBoardRecentLogs logs={recentTaskLogs} />
      <TaskBoardRiskPanel hud={hud} summary={summary} />
    </aside>
  );
}
