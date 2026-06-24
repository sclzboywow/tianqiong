import { NextResponse } from "next/server";
import { z } from "zod";
import { replayInkStory } from "@/game/inkStoryReplay";
import {
  getInkFileRuntimeStatus,
  inkCompiledRelativePath,
  inkSourceRelativePath,
} from "@/game/inkFileStatus";
import { requireOpsAccess } from "@/lib/opsDebugAccess";

const postSchema = z.object({
  inkFile: z.string().trim().min(1, "请提供 inkFile"),
  choicePath: z.array(z.number().int().min(0)).optional().default([]),
});

function buildInkPreviewResponse(inkFile: string, choicePath: number[]) {
  const status = getInkFileRuntimeStatus(inkFile);
  const paths = {
    sourcePath: inkSourceRelativePath(inkFile),
    compiledPath: inkCompiledRelativePath(inkFile),
  };

  if (status === "missing") {
    return {
      ok: false as const,
      error: `未找到 Ink 编译文件：${paths.compiledPath}`,
      inkFile,
      status,
      choicePath,
      ...paths,
    };
  }

  try {
    const story = replayInkStory(inkFile, choicePath);
    return {
      ok: true as const,
      inkFile,
      status: status === "available" ? ("available" as const) : ("load_failed" as const),
      choicePath,
      lines: story.lines,
      choices: story.choices,
      ended: story.ended,
      ...paths,
    };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Ink 脚本存在但无法加载，请检查编译产物",
      inkFile,
      status: "load_failed" as const,
      choicePath,
      ...paths,
    };
  }
}

export async function GET(request: Request) {
  const access = await requireOpsAccess();
  if (access.error) return access.error;

  const params = new URL(request.url).searchParams;
  const inkFile = params.get("inkFile")?.trim() || "";
  if (!inkFile) {
    return NextResponse.json(
      { ok: false, error: "请提供 inkFile 参数", inkFile: "" },
      { status: 400 },
    );
  }

  const choicePath = (params.get("choicePath") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 0);

  const result = buildInkPreviewResponse(inkFile, choicePath);
  if (!result.ok) {
    return NextResponse.json(result, { status: result.status === "missing" ? 404 : 400 });
  }
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const access = await requireOpsAccess();
  if (access.error) return access.error;

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "请求参数无效",
        issues: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const result = buildInkPreviewResponse(
    parsed.data.inkFile,
    parsed.data.choicePath,
  );
  if (!result.ok) {
    return NextResponse.json(result, { status: result.status === "missing" ? 404 : 400 });
  }
  return NextResponse.json(result);
}
