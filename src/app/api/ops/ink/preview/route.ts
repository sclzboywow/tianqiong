import { NextResponse } from "next/server";
import { replayInkStory } from "@/game/inkStoryReplay";
import {
  getInkFileRuntimeStatus,
  inkCompiledRelativePath,
  inkSourceRelativePath,
} from "@/game/inkFileStatus";
import { requireOpsAccess } from "@/lib/opsDebugAccess";

export async function GET(request: Request) {
  const access = await requireOpsAccess();
  if (access.error) return access.error;

  const inkFile = new URL(request.url).searchParams.get("inkFile")?.trim() || "";
  if (!inkFile) {
    return NextResponse.json(
      { ok: false, error: "请提供 inkFile 参数", inkFile: "" },
      { status: 400 },
    );
  }

  const status = getInkFileRuntimeStatus(inkFile);
  if (status === "missing") {
    return NextResponse.json({
      ok: false,
      error: `未找到 Ink 编译文件：${inkCompiledRelativePath(inkFile)}`,
      inkFile,
      status,
      sourcePath: inkSourceRelativePath(inkFile),
      compiledPath: inkCompiledRelativePath(inkFile),
    });
  }

  try {
    const story = replayInkStory(inkFile, []);
    return NextResponse.json({
      ok: true,
      inkFile,
      status: status === "available" ? "available" : "load_failed",
      lines: story.lines,
      choices: story.choices,
      ended: story.ended,
      sourcePath: inkSourceRelativePath(inkFile),
      compiledPath: inkCompiledRelativePath(inkFile),
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Ink 脚本存在但无法加载，请检查编译产物",
      inkFile,
      status: "load_failed" as const,
      sourcePath: inkSourceRelativePath(inkFile),
      compiledPath: inkCompiledRelativePath(inkFile),
    });
  }
}
