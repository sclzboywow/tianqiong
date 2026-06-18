import type { TaskBoardData } from "@/game/taskPresentationEngine";
import { TaskBoardHeader } from "./TaskBoardHeader";
import { TaskBoardRecommendedCard } from "./TaskBoardHeader";
import { TaskBoardList } from "./TaskBoardList";
import { TaskBoardSidebar, TaskBoardRecentLogs } from "./TaskBoardSidebar";
import { taskHudShell } from "./taskBoardUi";

type TaskBoardLayoutProps = {
  data: TaskBoardData;
};

export function TaskBoardLayout({ data }: TaskBoardLayoutProps) {
  return (
    <div className={taskHudShell}>
      <TaskBoardHeader data={data} />

      <div className="grid grid-cols-1 gap-0 xl:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0 space-y-3 border-cyan-400/10 p-3 xl:border-r">
          {data.recommendedTask ? <TaskBoardRecommendedCard item={data.recommendedTask} /> : null}
          <TaskBoardList
            taskItems={data.taskItems}
            categories={data.categories}
            excludeTaskId={data.recommendedTask?.task.id}
          />
        </main>

        <TaskBoardSidebar
          hud={data.hud}
          summary={data.summary}
          chapterGoals={data.chapterGoals}
          recentTaskLogs={data.recentTaskLogs}
        />
      </div>

      <div className="border-t border-cyan-400/10 p-3 xl:hidden">
        <TaskBoardRecentLogs logs={data.recentTaskLogs} />
      </div>
    </div>
  );
}
