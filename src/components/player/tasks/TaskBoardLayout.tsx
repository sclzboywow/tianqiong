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

      {data.recommendedTask && (
        <div className="lg:hidden">
          <TaskBoardRecommendedCard item={data.recommendedTask} />
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">
        <TaskBoardList taskItems={data.taskItems} categories={data.categories} />
        <TaskBoardSidebar
          summary={data.summary}
          recommendedTask={data.recommendedTask}
          chapterGoals={data.chapterGoals}
          recentTaskLogs={data.recentTaskLogs}
        />
      </div>

      <div className="lg:hidden">
        <TaskBoardRecentLogs logs={data.recentTaskLogs} />
      </div>
    </div>
  );
}
