import { NextResponse } from "next/server";
import { initializeProjectForSeed } from "@/game/projectEngine";
import { spawnTasksFromTemplates, filterTemplatesForCurrentStage } from "@/game/taskEngine";
import { getTaskTemplates } from "@/game/contentLoader";
import { TASK_TEMPLATES } from "@/data/taskTemplates";
import { normalizeStageId } from "@/game/projectStages";
import { seedPayloadCollections } from "@/lib/payloadSeed";

export async function POST() {
  try {
    const project = await initializeProjectForSeed();

    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });

    const stats = await seedPayloadCollections(payload, TASK_TEMPLATES);

    const templates = await getTaskTemplates();
    const stageTemplates = filterTemplatesForCurrentStage(
      templates,
      normalizeStageId(project.currentStage),
    );
    await spawnTasksFromTemplates(stageTemplates);

    return NextResponse.json({
      ok: true,
      tasks: stageTemplates.length,
      stats,
      currentStage: project.currentStage,
      message: "初始化完成。请刷新 /admin 并在左侧 Collections 查看数据。",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Seed failed" },
      { status: 500 },
    );
  }
}
