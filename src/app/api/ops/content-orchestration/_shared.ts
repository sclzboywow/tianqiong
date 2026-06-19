import { NextResponse } from "next/server";
import { bustContentOrchestrationCache } from "@/lib/contentOrchestrationCache";
import { requireOpsAccess } from "@/lib/opsDebugAccess";

export function isRefreshRequest(request: Request): boolean {
  return new URL(request.url).searchParams.get("refresh") === "1";
}

export async function orchestrationApiHandler(
  request: Request,
  loader: (refresh: boolean) => Promise<unknown>,
) {
  const access = await requireOpsAccess();
  if (access.error) return access.error;

  try {
    const refresh = isRefreshRequest(request);
    if (refresh) bustContentOrchestrationCache();
    const data = await loader(refresh);
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "加载失败" },
      { status: 500 },
    );
  }
}
