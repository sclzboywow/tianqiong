import { NextResponse } from "next/server";
import { bustContentOrchestrationCache } from "@/lib/contentOrchestrationCache";
import { bustOpsDataCache } from "@/lib/opsDataCache";
import { requireOpsAccess } from "@/lib/opsDebugAccess";

const ORCHESTRATION_API_TIMEOUT_MS = 15_000;

class OrchestrationTimeoutError extends Error {
  constructor() {
    super("项目编排数据源响应超时");
    this.name = "OrchestrationTimeoutError";
  }
}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new OrchestrationTimeoutError()),
      ORCHESTRATION_API_TIMEOUT_MS,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

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
    if (refresh) {
      bustContentOrchestrationCache();
      bustOpsDataCache();
    }
    const data = await withTimeout(loader(refresh));
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    const timedOut = error instanceof OrchestrationTimeoutError;
    return NextResponse.json(
      {
        error: timedOut
          ? "数据源响应超时，请重试；若持续发生，请检查 Payload 数据库状态"
          : error instanceof Error
            ? error.message
            : "加载失败",
      },
      { status: timedOut ? 504 : 500 },
    );
  }
}
