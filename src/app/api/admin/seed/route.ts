import { NextResponse } from "next/server";
import { ensureProjectState } from "@/game/projectEngine";
import { spawnTasksFromTemplates } from "@/game/taskEngine";
import { getTaskTemplates } from "@/game/contentLoader";
import { seedPayloadCollections } from "@/lib/payloadSeed";

export async function POST() {
  try {
    await ensureProjectState();
    const templates = await getTaskTemplates();
    await spawnTasksFromTemplates(templates);

    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });

    const stats = await seedPayloadCollections(payload, templates);

    return NextResponse.json({
      ok: true,
      tasks: templates.length,
      stats,
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
