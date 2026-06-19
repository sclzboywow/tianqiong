"use client";

import { useMemo } from "react";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { DependencyGraphData } from "@/game/contentStudioLoader";

type ContentStudioDependencyFlowProps = {
  graph: DependencyGraphData;
  knownArtifactSlugs?: Set<string>;
  className?: string;
};

function layoutNodes(graph: DependencyGraphData, knownArtifactSlugs?: Set<string>): Node[] {
  const taskNodes = graph.nodes.filter((node) => node.type === "task");
  const artifactNodes = graph.nodes.filter((node) => node.type === "artifact");

  return graph.nodes.map((node) => {
    const taskIndex = taskNodes.findIndex((item) => item.id === node.id);
    const artifactIndex = artifactNodes.findIndex((item) => item.id === node.id);

    const x = node.type === "task" ? 40 : 420;
    const y =
      node.type === "task"
        ? 40 + taskIndex * 88
        : 40 + artifactIndex * 72;

    const artifactSlug = node.id.replace("artifact:", "");
    const isMissing = node.type === "artifact" && knownArtifactSlugs && !knownArtifactSlugs.has(artifactSlug);

    return {
      id: node.id,
      position: { x, y },
      data: {
        label: isMissing ? `${node.label} (未定义)` : node.label,
        nodeType: node.type,
        stage: node.stage,
        isMissing,
      },
      draggable: true,
      style: {
        borderRadius: 8,
        border: isMissing
          ? "1px solid rgba(248,113,113,0.8)"
          : node.type === "task"
            ? "1px solid rgba(96,165,250,0.45)"
            : "1px solid rgba(74,222,128,0.45)",
        background: isMissing
          ? "rgba(69,10,10,0.85)"
          : node.type === "task"
            ? "rgba(15,23,42,0.95)"
            : "rgba(20,30,20,0.95)",
        color: isMissing ? "#fecaca" : "#e4e4e7",
        fontSize: 12,
        padding: "8px 12px",
        minWidth: 140,
      },
    };
  });
}

export function ContentStudioDependencyFlow({
  graph,
  knownArtifactSlugs,
  className,
}: ContentStudioDependencyFlowProps) {
  const nodes = useMemo(() => layoutNodes(graph, knownArtifactSlugs), [graph, knownArtifactSlugs]);
  const edges: Edge[] = useMemo(
    () =>
      graph.edges.map((edge) => {
        const color =
          edge.kind === "input"
            ? "rgba(248,113,113,0.7)"
            : edge.kind === "output"
              ? "rgba(74,222,128,0.7)"
              : "rgba(161,161,170,0.7)";
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: "smoothstep",
          animated: edge.kind === "input",
          label: edge.kind === "input" ? "需要" : edge.kind === "output" ? "产出" : "前置",
          style: { stroke: color, strokeWidth: 1.4 },
          labelStyle: { fill: "#a1a1aa", fontSize: 10 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 10,
            height: 10,
            color,
          },
        };
      }),
    [graph.edges],
  );

  if (graph.nodes.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-8 text-center text-sm text-zinc-500">
        暂无依赖关系数据。请为任务模板配置 inputArtifacts / outputArtifacts。
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="h-[520px] rounded-lg border border-zinc-800 overflow-hidden">
        <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.4} maxZoom={1.4}>
          <Background gap={16} color="rgba(255,255,255,0.04)" />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as { nodeType?: string; isMissing?: boolean };
              if (data.isMissing) return "#ef4444";
              return data.nodeType === "task" ? "#3b82f6" : "#22c55e";
            }}
            maskColor="rgba(0,0,0,0.65)"
          />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
