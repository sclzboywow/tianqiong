import type { ReactNode } from "react";

type ProfilePageLayoutProps = {
  pageHeader: ReactNode;
  identity: ReactNode;
  growth: ReactNode;
  careerRank: ReactNode;
  resources: ReactNode;
  jobAbility: ReactNode;
  careerTrack: ReactNode;
  contribution: ReactNode;
  recentGrowth: ReactNode;
};

export function ProfilePageLayout({
  pageHeader,
  identity,
  growth,
  careerRank,
  resources,
  jobAbility,
  careerTrack,
  contribution,
  recentGrowth,
}: ProfilePageLayoutProps) {
  return (
    <div className="space-y-4 lg:space-y-5">
      {pageHeader}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-5">
        <main className="min-w-0 space-y-4 lg:space-y-5">
          {identity}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
            {resources}
            {jobAbility}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
            {careerTrack}
            {contribution}
          </div>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          {growth}
          {careerRank}
          {recentGrowth}
        </aside>
      </div>
    </div>
  );
}
