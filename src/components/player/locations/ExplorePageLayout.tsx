import type { ExplorePageData } from "@/game/locationPresentationEngine";
import { LocationIndexSection } from "./LocationIndexSection";
import { ProjectMapSection } from "../map/ProjectMapSection";

type ExplorePageLayoutProps = {
  data: ExplorePageData;
};

export function ExplorePageLayout({ data }: ExplorePageLayoutProps) {
  return (
    <div className="space-y-4 lg:space-y-6">
      <ProjectMapSection
        mapData={data.mapData}
        stageName={data.stageName}
        stageProgress={data.stageProgress}
        overallProgress={data.overallProgress}
        unlockedCount={data.unlockedCount}
        totalCount={data.totalCount}
        recommendedName={data.recommendedLocation?.name}
      />

      <LocationIndexSection locations={data.locations} categories={data.categories} />
    </div>
  );
}
