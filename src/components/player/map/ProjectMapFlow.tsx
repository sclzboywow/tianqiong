"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ProjectMapViewData } from "@/game/projectMapPresentationEngine";
import { ProjectLocationNode } from "./ProjectLocationNode";
import { playerCardClass } from "../playerTheme";

const nodeTypes = {
  projectLocation: ProjectLocationNode,
};

type ProjectMapFlowProps = {
  mapData: ProjectMapViewData;
};

export function ProjectMapFlow({ mapData }: ProjectMapFlowProps) {
  const router = useRouter();

  const nodes: Node[] = useMemo(
    () =>
      mapData.nodes.map((node) => ({
        id: node.id,
        type: "projectLocation",
        position: node.position,
        data: node,
        draggable: false,
        selectable: true,
      })),
    [mapData.nodes],
  );

  const edges: Edge[] = useMemo(
    () =>
      mapData.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: false,
        style: { stroke: "rgba(60,160,255,0.35)", strokeWidth: 1.5 },
      })),
    [mapData.edges],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      router.push(`/locations/${node.id}`);
    },
    [router],
  );

  return (
    <div className={`${playerCardClass} h-[680px] overflow-hidden`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll
        minZoom={0.35}
        maxZoom={1.4}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(60,160,255,0.08)" gap={20} />
        <Controls
          showInteractive={false}
          className="!border-[rgba(60,160,255,0.22)] !bg-[rgba(10,24,40,0.9)] [&>button]:!border-[rgba(60,160,255,0.18)] [&>button]:!bg-[rgba(5,11,20,0.8)] [&>button]:!text-[#EAF3FF]"
        />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as { unlocked?: boolean; isRecommended?: boolean };
            if (!data.unlocked) return "#3f3f46";
            if (data.isRecommended) return "#FACC15";
            return "#1E88FF";
          }}
          maskColor="rgba(5,11,20,0.75)"
          className="!border-[rgba(60,160,255,0.22)] !bg-[rgba(10,24,40,0.85)]"
        />
      </ReactFlow>
    </div>
  );
}
