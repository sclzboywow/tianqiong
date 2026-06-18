import type { ReactNode } from "react";
import { taskHudShell } from "../tasks/taskBoardUi";

type ProfilePageLayoutProps = {
  identity: ReactNode;
  resources: ReactNode;
  roleAbility: ReactNode;
  contribution: ReactNode;
  growth: ReactNode;
  careerRank: ReactNode;
  recentGrowth: ReactNode;
};

export function ProfilePageLayout({
  identity,
  resources,
  roleAbility,
  contribution,
  growth,
  careerRank,
  recentGrowth,
}: ProfilePageLayoutProps) {
  return (
    <div className={taskHudShell}>
      {identity}

      <div className="grid grid-cols-1 gap-0 xl:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0 space-y-2.5 border-cyan-400/10 p-3 xl:border-r">
          <div className="xl:hidden">{growth}</div>
          {resources}
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
            {roleAbility}
            {contribution}
          </div>
          <div className="xl:hidden">{careerRank}</div>
          <div className="xl:hidden">{recentGrowth}</div>
        </main>

        <aside className="hidden space-y-2.5 p-3 xl:sticky xl:top-4 xl:block xl:self-start">
          {growth}
          {careerRank}
          {recentGrowth}
        </aside>
      </div>
    </div>
  );
}
