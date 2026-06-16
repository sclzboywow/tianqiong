import { NextResponse } from "next/server";
import { initializeProjectForSeed } from "@/game/projectEngine";
import { spawnTasksFromTemplates, filterTemplatesForCurrentStage } from "@/game/taskEngine";
import { getTaskTemplates } from "@/game/contentLoader";
import { TASK_TEMPLATES } from "@/data/taskTemplates";
import { normalizeStageId } from "@/game/projectStages";
import { seedPayloadCollections } from "@/lib/payloadSeed";

function resolveSeedOverwrite(request: Request): boolean {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("overwrite") === "true") return true;
  return process.env.SEED_OVERWRITE === "true";
}

export async function POST(request: Request) {
  try {
    const overwrite = resolveSeedOverwrite(request);
    const project = await initializeProjectForSeed();

    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });

    const stats = await seedPayloadCollections(payload, TASK_TEMPLATES, { overwrite });

    const templates = await getTaskTemplates();
    const stageTemplates = filterTemplatesForCurrentStage(
      templates,
      normalizeStageId(project.currentStage),
    );
    await spawnTasksFromTemplates(stageTemplates);

    return NextResponse.json({
      ok: true,
      tasks: stageTemplates.length,
      overwrite,
      stats,
      currentStage: project.currentStage,
      message: overwrite
        ? "初始化完成（已覆盖已有内容）。请刷新 /admin 查看数据。"
        : "初始化完成（仅补全缺失内容，未覆盖已有配置）。请刷新 /admin 查看数据。",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Seed failed" },
      { status: 500 },
    );
  }
}
