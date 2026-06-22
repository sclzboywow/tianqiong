import { NextResponse } from "next/server";
import { loadProjectFlowNode } from "@/game/projectFlowLoader";
import { requireOpsAccess } from "@/lib/opsDebugAccess";

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const access = await requireOpsAccess();
  if (access.error) return access.error;

  const { slug } = await params;
  const detail = await loadProjectFlowNode(slug);
  if (!detail) {
    return NextResponse.json({ error: "流程节点不存在" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
