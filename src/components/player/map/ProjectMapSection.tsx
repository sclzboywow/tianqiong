"use client";

import dynamic from "next/dynamic";
import type { ProjectMapViewData } from "@/game/projectMapPresentationEngine";
import { ProjectMapHud } from "./ProjectMapHud";
import { ProjectMapLegend } from "./ProjectMapLegend";
import { ProjectMapTips } from "./ProjectMapTips";

const ProjectMapFlow = dynamic(
  () => import("./ProjectMapFlow").then((mod) => mod.ProjectMapFlow),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[720px] items-center justify-center text-sm text-[#8EA3B8]">
        加载项目地图…
      </div>
    ),
  },
);

type ProjectMapSectionProps = {
  mapData: ProjectMapViewData;
  stageName: string;
  stageProgress: number;
  overallProgress: number;
  unlockedCount: number;
  totalCount: number;
  recommendedName?: string;
};

export function ProjectMapSection({
  mapData,
  stageName,
  stageProgress,
  overallProgress,
  unlockedCount,
  totalCount,
  recommendedName,
}: ProjectMapSectionProps) {
  return (
    <section className="relative h-[calc(100vh-120px)] min-h-[720px] overflow-hidden rounded-xl border border-[rgba(60,160,255,0.18)] bg-[#050B14]">
      <ProjectMapFlow mapData={mapData} className="absolute inset-0 h-full" />

      <div className="pointer-events-none absolute inset-0 z-10">
        <ProjectMapHud
          stageName={stageName}
          stageProgress={stageProgress}
          overallProgress={overallProgress}
          unlockedCount={unlockedCount}
          totalCount={totalCount}
          recommendedName={recommendedName}
          className="pointer-events-auto absolute left-3 top-3 sm:left-4 sm:top-4"
        />

        <ProjectMapLegend className="absolute right-3 top-3 sm:right-4 sm:top-4 lg:top-4" />

        <ProjectMapTips className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4" />
      </div>
    </section>
  );
}
