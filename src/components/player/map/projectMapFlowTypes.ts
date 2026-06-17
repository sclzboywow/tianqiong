import type { Node } from "@xyflow/react";
import type { ProjectMapNodeData } from "@/game/projectMapPresentationEngine";

export type ProjectLocationFlowNode = Node<ProjectMapNodeData, "projectLocation">;

export type ProjectMapGroupHeaderData = {
  label: string;
};

export type ProjectMapGroupHeaderFlowNode = Node<ProjectMapGroupHeaderData, "projectMapGroupHeader">;

export type ProjectMapFlowNode = ProjectLocationFlowNode | ProjectMapGroupHeaderFlowNode;
