"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { ProjectMapGroupHeaderFlowNode } from "./projectMapFlowTypes";

function ProjectMapGroupHeaderNodeComponent({ data }: NodeProps<ProjectMapGroupHeaderFlowNode>) {
  return (
    <div className="pointer-events-none select-none">
      <p className="text-[13px] font-semibold tracking-wide text-[#8EA3B8]">{data.label}</p>
      <div className="mt-1 h-px w-[220px] bg-gradient-to-r from-[rgba(60,160,255,0.45)] to-transparent" />
    </div>
  );
}

export const ProjectMapGroupHeaderNode = memo(ProjectMapGroupHeaderNodeComponent);
