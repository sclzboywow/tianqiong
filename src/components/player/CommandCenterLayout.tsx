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
    <div className="flex flex-col gap-3 lg:gap-5">
      {/* 移动端：导览 → 主行动 → 资源 */}
      {onboarding && <div className="lg:hidden">{onboarding}</div>}
      <div className="lg:hidden">{recommendedAction}</div>
      <div className="lg:hidden">{resourceBar}</div>

      {/* PC 端：资源条 → 导览 → 主内容区 */}
      <div className="hidden lg:block">{resourceBar}</div>
      {onboarding && <div className="hidden lg:block">{onboarding}</div>}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-5">
        <div className="hidden lg:col-span-8 lg:block">{recommendedAction}</div>
        <div className="lg:col-span-4">{projectStatus}</div>
        <div className="lg:col-span-3">{chapterMilestones}</div>
        <div className="hidden lg:col-span-5 lg:block">{pendingTasks}</div>
        <div className="lg:hidden">{pendingTasksMobile}</div>
        <div className="hidden lg:col-span-4 lg:block">{recentActivity}</div>
        <div className="lg:hidden">{recentActivityMobile}</div>
      </div>
    </div>
  );
}
