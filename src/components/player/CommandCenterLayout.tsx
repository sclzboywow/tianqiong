import type { ReactNode } from "react";
import { taskHudShell } from "./tasks/taskBoardUi";

type CommandCenterLayoutProps = {
  header: ReactNode;
  recommendedAction: ReactNode;
  chapterMilestones: ReactNode;
  pendingTasks: ReactNode;
  projectStatus: ReactNode;
  recentActivity: ReactNode;
  quickLinks: ReactNode;
  /** 移动端资源摘要；桌面端由 CommandCenterHeader 内 compact 资源条承担 */
  resourceBar: ReactNode;
};

export function CommandCenterLayout({
  header,
  recommendedAction,
  chapterMilestones,
  pendingTasks,
  projectStatus,
  recentActivity,
  quickLinks,
  resourceBar,
}: CommandCenterLayoutProps) {
  return (
    <div className={taskHudShell}>
      {header}

      <div className="hidden xl:grid xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0 space-y-2.5 border-cyan-400/10 p-3 xl:border-r">
          {recommendedAction}
          {chapterMilestones}
          {pendingTasks}
        </main>

        <aside className="space-y-2.5 p-3 xl:sticky xl:top-4 xl:block xl:self-start">
          {projectStatus}
          {recentActivity}
          {quickLinks}
        </aside>
      </div>

      {/* 移动端 (<xl)：主内容区末尾展示资源摘要；桌面端资源已在 Header 内 */}
      <div className="space-y-2.5 p-3 xl:hidden">
        {recommendedAction}
        {projectStatus}
        {pendingTasks}
        {chapterMilestones}
        {recentActivity}
        {resourceBar}
      </div>
    </div>
  );
}
