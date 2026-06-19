import { NextResponse } from "next/server";
import { getTaskTemplates } from "@/game/contentLoader";
import { buildDependencyContext, evaluateTaskTemplateDependencies } from "@/game/dependencyEngine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seasonId = searchParams.get("seasonId") || process.env.SEASON_ID || "season-1";
  const taskSlug = searchParams.get("taskSlug")?.trim();

  if (!taskSlug) {
    return NextResponse.json({ error: "缺少 taskSlug 参数" }, { status: 400 });
  }

  const templates = await getTaskTemplates();
  const template = templates.find((item) => item.slug === taskSlug);
  if (!template) {
    return NextResponse.json({ error: `任务模板不存在: ${taskSlug}` }, { status: 404 });
  }

  const context = await buildDependencyContext(seasonId);
  const result = await evaluateTaskTemplateDependencies(template, context);

  return NextResponse.json(result);
}
