import type { TaskBoardData } from "@/game/taskPresentationEngine";
import { TaskBoardHeader } from "./TaskBoardHeader";
import { TaskBoardRecommendedCard } from "./TaskBoardHeader";
import { TaskBoardList } from "./TaskBoardList";
import { TaskBoardSidebar, TaskBoardRecentLogs } from "./TaskBoardSidebar";

type TaskBoardLayoutProps = {
  data: TaskBoardData;
};

export function TaskBoardLayout({ data }: TaskBoardLayoutProps) {
  return (
    <div className="space-y-4 lg:space-y-5">
      <TaskBoardHeader stageName={data.stageName} totalActive={data.summary.totalActive} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-5">
        <main className="min-w-0 space-y-4 lg:space-y-5">
          {data.recommendedTask && <TaskBoardRecommendedCard item={data.recommendedTask} />}

          <TaskBoardList taskItems={data.taskItems} categories={data.categories} />
        </main>

        <TaskBoardSidebar
          summary={data.summary}
          chapterGoals={data.chapterGoals}
          recentTaskLogs={data.recentTaskLogs}
        />
      </div>

      <div className="xl:hidden">
        <TaskBoardRecentLogs logs={data.recentTaskLogs} />
      </div>
    </div>
  );
}
