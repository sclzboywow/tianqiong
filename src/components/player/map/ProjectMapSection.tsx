"use client";

import dynamic from "next/dynamic";
import type { ProjectMapViewData } from "@/game/projectMapPresentationEngine";
import { ProjectMapLegend } from "./ProjectMapLegend";
import { playerCardClass } from "../playerTheme";

const ProjectMapFlow = dynamic(
  () => import("./ProjectMapFlow").then((mod) => mod.ProjectMapFlow),
  {
    ssr: false,
    loading: () => (
      <div
        className={`${playerCardClass} flex h-[680px] items-center justify-center text-sm text-[#8EA3B8]`}
      >
        加载协同地图…
      </div>
    ),
  },
);

type ProjectMapSectionProps = {
  mapData: ProjectMapViewData;
  stageName: string;
  stageProgress: number;
  overallProgress: number;
};

export function ProjectMapSection({
  mapData,
  stageName,
  stageProgress,
  overallProgress,
}: ProjectMapSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-[rgba(60,160,255,0.18)] bg-[rgba(5,11,20,0.5)] px-3 py-1.5 text-[#EAF3FF]">
          当前阶段：{stageName}
        </span>
        <span className="rounded-full border border-[rgba(60,160,255,0.18)] bg-[rgba(5,11,20,0.5)] px-3 py-1.5 text-[#8EA3B8]">
          阶段进度 {stageProgress}%
        </span>
        <span className="rounded-full border border-[rgba(60,160,255,0.18)] bg-[rgba(5,11,20,0.5)] px-3 py-1.5 text-[#8EA3B8]">
          总体进度 {overallProgress}%
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_240px]">
        <ProjectMapFlow mapData={mapData} />
        <div className="hidden xl:block">
          <ProjectMapLegend />
        </div>
      </div>

      <div className="xl:hidden">
        <ProjectMapLegend />
      </div>
    </section>
  );
}
