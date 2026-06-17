import type { LocationDisplayItem } from "./locationPresentationEngine";
import {
  buildValidEdges,
  resolveNodePosition,
  type ProjectMapEdgeDef,
} from "./projectMapLayout";

export type ProjectMapNodeData = {
  id: string;
  name: string;
  group: string;
  typeLabel: string;
  unlocked: boolean;
  isRecommended: boolean;
  pendingTaskCount: number;
  riskTagLabels: string[];
  highRisk: boolean;
  npcCount: number;
  position: { x: number; y: number };
};

export type ProjectMapViewData = {
  nodes: ProjectMapNodeData[];
  edges: ProjectMapEdgeDef[];
  stageName: string;
  stageProgress: number;
  overallProgress: number;
};

export function buildProjectMapViewData(
  locations: LocationDisplayItem[],
  stageName: string,
  stageProgress: number,
  overallProgress: number,
): ProjectMapViewData {
  const groupCounters: Record<string, number> = {};

  const nodes: ProjectMapNodeData[] = locations.map((item) => {
    const groupIndex = groupCounters[item.group] ?? 0;
    groupCounters[item.group] = groupIndex + 1;

    return {
      id: item.id,
      name: item.name,
      group: item.group,
      typeLabel: item.typeLabel,
      unlocked: item.unlocked,
      isRecommended: item.status === "recommended",
      pendingTaskCount: item.relatedTaskCount,
      riskTagLabels: item.riskTagLabels.slice(0, 3),
      highRisk: item.highRisk,
      npcCount: item.npcCount,
      position: resolveNodePosition(item.id, item.group, groupIndex),
    };
  });

  const locationIds = new Set(locations.map((item) => item.id));

  return {
    nodes,
    edges: buildValidEdges(locationIds),
    stageName,
    stageProgress,
    overallProgress,
  };
}
