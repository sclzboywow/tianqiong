import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { StoryPreviewPanel } from "@/components/StoryPreviewPanel";
import { getStoryEntryBySlug } from "@/game/storyEntryLoader";
import { getCurrentUserId } from "@/lib/session";

type StoryPreviewPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function StoryPreviewPage({ params }: StoryPreviewPageProps) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/register");

  const { slug } = await params;
  const entry = await getStoryEntryBySlug(slug);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">
        {!entry ? (
          <div className="rounded-lg border border-rose-900/40 bg-rose-950/20 p-6 text-sm text-rose-300">
            剧情入口不存在：<span className="font-mono">{slug}</span>
          </div>
        ) : (
          <StoryPreviewPanel entry={entry} />
        )}
      </main>
    </div>
  );
}
