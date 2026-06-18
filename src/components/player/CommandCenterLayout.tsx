import type { ReactNode } from "react";

type CommandCenterLayoutProps = {
  onboarding?: ReactNode;
  recommendedAction: ReactNode;
  resourceBar: ReactNode;
  projectStatus: ReactNode;
  chapterMilestones: ReactNode;
  pendingTasks: ReactNode;
  pendingTasksMobile: ReactNode;
  recentActivity: ReactNode;
  recentActivityMobile: ReactNode;
};

export function CommandCenterLayout({
  onboarding,
  recommendedAction,
  resourceBar,
  projectStatus,
  chapterMilestones,
  pendingTasks,
  pendingTasksMobile,
  recentActivity,
  recentActivityMobile,
}: CommandCenterLayoutProps) {
  return (
    <div className="space-y-4 lg:space-y-5">
      {/* PC：资源条是指挥中心仪表盘顶部状态栏 */}
      <div className="hidden lg:block">{resourceBar}</div>

      {onboarding && <div>{onboarding}</div>}

      {/* 移动端：先给玩家下一步，再给状态 */}
      <div className="space-y-4 lg:hidden">
        {recommendedAction}
        {projectStatus}
        {chapterMilestones}
        {pendingTasksMobile}
        {recentActivityMobile}
        {resourceBar}
      </div>

      {/* PC：主行动区 + 右侧战况栏 */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-5">
        <main className="min-w-0 space-y-5">
          {recommendedAction}

          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-4">{chapterMilestones}</div>
            <div className="col-span-8">{pendingTasks}</div>
          </div>
        </main>

        <aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          {projectStatus}
          {recentActivity}
        </aside>
      </div>
    </div>
  );
}
