import { NextResponse } from "next/server";
import { validateContentPack } from "@/game/contentPackImport";
import { requireOpsAccess } from "@/lib/opsDebugAccess";

export async function POST(request: Request) {
  const access = await requireOpsAccess();
  if (access.error) return access.error;

  try {
    const body = await request.json();
    const report = await validateContentPack(body);
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        packId: "",
        name: "",
        version: "",
        counts: {},
        summary: {},
        errors: [error instanceof Error ? error.message : "校验请求解析失败"],
        warnings: [],
      },
      { status: 400 },
    );
  }
}
