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
    <div className="flex flex-col gap-3 lg:gap-5">
      {pageHeader}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-5">
        <div className="lg:col-span-4 lg:space-y-4">
          {identity}
          {growth}
          {careerRank}
        </div>

        <div className="lg:col-span-5 lg:space-y-4">
          {resources}
          {jobAbility}
          {careerTrack}
        </div>

        <div className="lg:col-span-3 lg:space-y-4">
          {contribution}
          {recentGrowth}
        </div>
      </div>
    </div>
  );
}
