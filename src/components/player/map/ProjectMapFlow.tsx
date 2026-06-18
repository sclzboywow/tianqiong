"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import type { ProjectMapNodeData, ProjectMapViewData } from "@/game/projectMapPresentationEngine";
import { MAP_GROUP_HEADER_DEFS } from "@/game/projectMapLayout";
import { ProjectLocationNode } from "./ProjectLocationNode";
import { ProjectMapGroupHeaderNode } from "./ProjectMapGroupHeaderNode";
import type {
  ProjectLocationFlowNode,
  ProjectMapFlowNode,
  ProjectMapGroupHeaderFlowNode,
} from "./projectMapFlowTypes";

export type { ProjectLocationFlowNode } from "./projectMapFlowTypes";

const nodeTypes = {
  projectLocation: ProjectLocationNode,
  projectMapGroupHeader: ProjectMapGroupHeaderNode,
};

type ProjectMapFlowProps = {
  mapData: ProjectMapViewData;
  className?: string;
};

export function ProjectMapFlow({ mapData, className }: ProjectMapFlowProps) {
  const router = useRouter();

  const nodes: ProjectMapFlowNode[] = useMemo(() => {
    const groupHeaders: ProjectMapGroupHeaderFlowNode[] = MAP_GROUP_HEADER_DEFS.map((header) => ({
      id: header.id,
      type: "projectMapGroupHeader",
      position: header.position,
      data: { label: header.label },
      draggable: false,
      selectable: false,
    }));

    const locationNodes: ProjectLocationFlowNode[] = mapData.nodes.map((node) => ({
      id: node.id,
      type: "projectLocation",
      position: node.position,
      data: node,
      draggable: false,
      selectable: false,
    }));

    return [...groupHeaders, ...locationNodes];
  }, [mapData.nodes]);

  const edges: Edge[] = useMemo(
    () =>
      mapData.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type ?? "smoothstep",
        animated: false,
        style: { stroke: "rgba(60,160,255,0.22)", strokeWidth: 1.2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 10,
          height: 10,
          color: "rgba(60,160,255,0.22)",
        },
      })),
    [mapData.edges],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: ProjectMapFlowNode) => {
      if (node.type === "projectMapGroupHeader") return;
      router.push(`/locations/${node.id}`);
    },
    [router],
  );

  return (
    <div
      className={cn(
        "min-w-0 w-full overflow-hidden touch-pan-x touch-pan-y",
        className,
      )}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        minZoom={0.2}
        maxZoom={1.4}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        proOptions={{ hideAttribution: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <Background color="rgba(60,160,255,0.08)" gap={20} />
        <Controls
          showInteractive={false}
          className="!border-[rgba(60,160,255,0.22)] !bg-[rgba(10,24,40,0.9)] [&>button]:!border-[rgba(60,160,255,0.18)] [&>button]:!bg-[rgba(5,11,20,0.8)] [&>button]:!text-[#EAF3FF]"
        />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === "projectMapGroupHeader") return "rgba(60,160,255,0.15)";
            const data = node.data as ProjectMapNodeData;
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
