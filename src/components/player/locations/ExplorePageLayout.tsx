import type { ExplorePageData } from "@/game/locationPresentationEngine";
import { ExplorePageHeader, ExploreRecommendedCard } from "./ExplorePageHeader";
import { ExploreLocationsBoard } from "./ExploreLocationsBoard";
import { ChapterMilestoneCard } from "../ChapterMilestoneCard";
import { RecentActivityCard } from "../RecentActivityCard";
import { ProjectMapSection } from "../map/ProjectMapSection";

type ExplorePageLayoutProps = {
  data: ExplorePageData;
};

function ExploreSidebar({ data }: { data: ExplorePageData }) {
  return (
    <aside className="hidden w-[280px] shrink-0 space-y-4 lg:block">
      {data.recommendedLocation && (
        <ExploreRecommendedCard item={data.recommendedLocation} />
      )}
      <ChapterMilestoneCard goals={data.chapterGoals} />
      <RecentActivityCard logs={data.recentLogs} maxItems={5} title="最近地点动态" />
    </aside>
  );
}

export function ExplorePageLayout({ data }: ExplorePageLayoutProps) {
  return (
    <div className="space-y-4 lg:space-y-5">
      <ExplorePageHeader
        stageName={data.stageName}
        unlockedCount={data.unlockedCount}
        totalCount={data.totalCount}
        recommendedName={data.recommendedLocation?.name}
        stageProgress={data.stageProgress}
        overallProgress={data.overallProgress}
      />

      <ProjectMapSection
        mapData={data.mapData}
        stageName={data.stageName}
        stageProgress={data.stageProgress}
        overallProgress={data.overallProgress}
      />

      {data.recommendedLocation && (
        <div className="lg:hidden">
          <ExploreRecommendedCard item={data.recommendedLocation} />
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#EAF3FF]">地点列表</h2>
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">
          <ExploreLocationsBoard locations={data.locations} categories={data.categories} />
          <ExploreSidebar data={data} />
        </div>
      </div>

      <div className="lg:hidden">
        <RecentActivityCard logs={data.recentLogs} maxItems={4} title="最近地点动态" />
      </div>
    </div>
  );
}
