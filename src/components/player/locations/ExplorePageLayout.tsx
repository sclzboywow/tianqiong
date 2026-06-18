import type { ExplorePageData } from "@/game/locationPresentationEngine";
import { ProjectMapSection } from "../map/ProjectMapSection";

type ExplorePageLayoutProps = {
  data: ExplorePageData;
};

export function ExplorePageLayout({ data }: ExplorePageLayoutProps) {
  return (
    <ProjectMapSection
      mapData={data.mapData}
      stageName={data.stageName}
      stageProgress={data.stageProgress}
      overallProgress={data.overallProgress}
      unlockedCount={data.unlockedCount}
      totalCount={data.totalCount}
      recommendedName={data.recommendedLocation?.name}
    />
  );
}
