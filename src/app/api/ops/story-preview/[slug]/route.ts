import { NextResponse } from "next/server";
import { getStoryEntryBySlug } from "@/game/storyEntryLoader";
import { createStory, getStoryState, makeChoice } from "@/ink/inkRunner";

type RouteContext = { params: Promise<{ slug: string }> };

function replayStory(inkFile: string, choicePath: number[]) {
  const story = createStory(inkFile);
  let state = getStoryState(story);
  for (const index of choicePath) {
    if (state.ended || state.choices.length === 0) break;
    if (index < 0 || index >= state.choices.length) {
      throw new Error(`无效选项索引: ${index}`);
    }
    const next = makeChoice(story, index);
    state = { ...next, ended: next.ended };
  }
  return state;
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const entry = await getStoryEntryBySlug(slug);
  if (!entry) {
    return NextResponse.json({ ok: false, error: `剧情入口不存在: ${slug}` }, { status: 404 });
  }

  try {
    const story = replayStory(entry.inkFile, []);
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
    const story = replayStory(entry.inkFile, choicePath);
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
