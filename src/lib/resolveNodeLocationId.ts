import type { SandtableLocationNode } from "@/game/locationSandtablePresentationEngine";

/** 从沙盘节点解析可用于地点工作台的真实 locationId */
export function resolveNodeLocationId(node: SandtableLocationNode): string | undefined {
  if (node.href?.startsWith("/locations/")) {
    return node.href.replace("/locations/", "");
  }
  return node.id;
}
