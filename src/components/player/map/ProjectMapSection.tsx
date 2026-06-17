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
        加载项目地图…
      </div>
    ),
  },
);

type ProjectMapSectionProps = {
  mapData: ProjectMapViewData;
};

export function ProjectMapSection({ mapData }: ProjectMapSectionProps) {
  return (
    <section className="space-y-3">
      <p className="text-sm text-[#8EA3B8]">
        点击地图节点进入地点，查看可执行行动、关联任务、NPC 与风险线索。
      </p>

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
