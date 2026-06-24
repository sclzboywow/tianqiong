import { NextResponse } from "next/server";
import { z } from "zod";
import { importContentPack } from "@/game/contentPackImport";
import { requireOpsAccess } from "@/lib/opsDebugAccess";

const schema = z.object({
  pack: z.unknown(),
  mode: z.literal("upsert").default("upsert"),
});

export async function POST(request: Request) {
  const access = await requireOpsAccess();
  if (access.error) return access.error;

  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          errors: parsed.error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      );
    }

    const report = await importContentPack(parsed.data.pack, parsed.data.mode);
    if (!report.ok) {
      return NextResponse.json(report, { status: 400 });
    }
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
        errors: [error instanceof Error ? error.message : "导入请求解析失败"],
        warnings: [],
      },
      { status: 500 },
    );
  }
}
