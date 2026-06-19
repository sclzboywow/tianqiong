import { NextResponse } from "next/server";
import { requireOpsDebugAccess } from "@/lib/opsDebugAccess";
import { grantMainlineArtifact } from "@/game/mainlineDebugEngine";

export async function POST(request: Request) {
  const auth = await requireOpsDebugAccess();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const slug = body?.slug?.trim();
    const status = body?.status?.trim();
    if (!slug || !status) {
      return NextResponse.json({ error: "缺少 slug 或 status" }, { status: 400 });
    }

    const record = await grantMainlineArtifact(slug, status);
    return NextResponse.json({ ok: true, artifact: record });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "授予成果物失败" },
      { status: 400 },
    );
  }
}
