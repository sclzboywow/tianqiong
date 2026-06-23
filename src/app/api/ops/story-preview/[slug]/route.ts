import { NextResponse } from "next/server";
import { replayInkStory } from "@/game/inkStoryReplay";
import { getStoryEntryBySlug } from "@/game/storyEntryLoader";
import { getCurrentUserId } from "@/lib/session";

type RouteContext = { params: Promise<{ slug: string }> };

async function requirePreviewAuth() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }
  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  const authError = await requirePreviewAuth();
  if (authError) return authError;

  const { slug } = await context.params;
  const entry = await getStoryEntryBySlug(slug);
  if (!entry) {
    return NextResponse.json({ ok: false, error: `剧情入口不存在: ${slug}` }, { status: 404 });
  }

  try {
    const story = replayInkStory(entry.inkFile, []);
    return NextResponse.json({ ok: true, entry: { slug: entry.slug, title: entry.title }, story });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "剧情文件无法加载",
        inkFile: entry.inkFile,
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const authError = await requirePreviewAuth();
  if (authError) return authError;

  const { slug } = await context.params;
  const entry = await getStoryEntryBySlug(slug);
  if (!entry) {
    return NextResponse.json({ ok: false, error: `剧情入口不存在: ${slug}` }, { status: 404 });
  }

  let choicePath: number[] = [];
  try {
    const body = (await request.json()) as { choicePath?: number[] };
    choicePath = Array.isArray(body.choicePath) ? body.choicePath : [];
  } catch {
    choicePath = [];
  }

  try {
    const story = replayInkStory(entry.inkFile, choicePath);
    return NextResponse.json({ ok: true, entry: { slug: entry.slug, title: entry.title }, story });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "剧情预览失败",
        inkFile: entry.inkFile,
      },
      { status: 400 },
    );
  }
}
