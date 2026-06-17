import type { TaskBoardSummary, RecommendedTaskBoardItem } from "@/game/taskPresentationEngine";
import type { GameLogSummary } from "@/game/logEngine";
import { sanitizeTaskLogContent } from "@/game/taskEffectPlayerDisplay";
import { ChapterMilestoneCard } from "../ChapterMilestoneCard";
import type { ChapterGoalItem } from "@/game/playerGuidanceEngine";
import { TaskBoardRecommendedCard } from "./TaskBoardHeader";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

function TaskBoardStatsCard({ summary }: { summary: TaskBoardSummary }) {
  const rows = [
    { label: "待处理", value: summary.totalActive },
    { label: "主线", value: summary.mainlineCount },
    { label: "突发", value: summary.emergencyCount },
    { label: "协作", value: summary.collaborationCount },
    { label: "已完成", value: summary.completedCount },
  ];

  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <h3 className="text-base font-semibold text-[#EAF3FF]">任务统计</h3>
      </div>
      <div className={playerCardBodyClass}>
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-[#8EA3B8]">{row.label}</span>
              <span className="font-medium tabular-nums text-[#EAF3FF]">{row.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function TaskBoardRecentLogs({ logs }: { logs: GameLogSummary[] }) {
  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <h3 className="text-base font-semibold text-[#EAF3FF]">最近结算</h3>
      </div>
      <div className={playerCardBodyClass}>
        {logs.length === 0 ? (
          <p className="text-sm text-[#8EA3B8]">暂无任务结算记录</p>
        ) : (
          <ul className="space-y-2.5">
            {logs.map((log) => (
              <li
                key={log.id}
                className="rounded-lg border border-[rgba(60,160,255,0.1)] bg-[rgba(5,11,20,0.35)] px-3 py-2 text-[13px] leading-relaxed text-[#EAF3FF]/90"
              >
                {sanitizeTaskLogContent(log.content)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

type TaskBoardSidebarProps = {
  summary: TaskBoardSummary;
  recommendedTask: RecommendedTaskBoardItem | null;
  chapterGoals: ChapterGoalItem[];
  recentTaskLogs: GameLogSummary[];
};

export function TaskBoardSidebar({
  summary,
  recommendedTask,
  chapterGoals,
  recentTaskLogs,
}: TaskBoardSidebarProps) {
  return (
    <aside className="hidden w-[280px] shrink-0 space-y-4 lg:block">
      {recommendedTask && <TaskBoardRecommendedCard item={recommendedTask} />}
      <TaskBoardStatsCard summary={summary} />
      <ChapterMilestoneCard goals={chapterGoals} />
      <TaskBoardRecentLogs logs={recentTaskLogs} />
    </aside>
  );
}
