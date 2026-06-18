import { AlertTriangle, ScrollText } from "lucide-react";
import type { TaskBoardHud, TaskBoardSummary } from "@/game/taskPresentationEngine";
import type { GameLogSummary } from "@/game/logEngine";
import { sanitizePlayerLogContent } from "@/game/taskEffectPlayerDisplay";
import { ChapterMilestoneCard } from "../ChapterMilestoneCard";
import type { ChapterGoalItem } from "@/game/playerGuidanceEngine";
import { taskHudPanel, taskHudPanelHeader } from "./taskBoardUi";

export function TaskBoardRecentLogs({ logs }: { logs: GameLogSummary[] }) {
  return (
    <section className={taskHudPanel}>
      <div className={taskHudPanelHeader}>
        <h3 className="flex items-center gap-2 text-[12px] font-medium text-cyan-100">
          <ScrollText className="size-3.5 text-cyan-400" />
          近期结算 / 任务日志
        </h3>
      </div>
      <div className="p-3">
        {logs.length === 0 ? (
          <p className="text-[11px] text-slate-600">暂无任务结算记录</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li
                key={log.id}
                className="border border-cyan-400/10 bg-slate-950/50 p-2.5 text-[11px] leading-5 text-slate-400"
              >
                <p className="text-slate-300">{sanitizePlayerLogContent(log.content)}</p>
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
    return (
      <section className={taskHudPanel}>
        <div className={taskHudPanelHeader}>
          <h3 className="flex items-center gap-2 text-[12px] font-medium text-cyan-100">
            <AlertTriangle className="size-3.5 text-amber-400" />
            风险提示
          </h3>
        </div>
        <div className="p-3">
          <p className="text-[11px] text-slate-600">当前无突发风险待处理。</p>
        </div>
      </section>
    );
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
      <div className="space-y-2 p-3">
        {hud.riskAlert ? (
          <p className="border border-amber-400/20 bg-amber-950/20 p-2.5 text-[11px] leading-5 text-amber-100/90">
            {hud.riskAlert}
          </p>
        ) : (
          <p className="text-[11px] text-slate-500">有 {summary.emergencyCount} 项突发风险待处理，请优先在协同地图跟进。</p>
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
