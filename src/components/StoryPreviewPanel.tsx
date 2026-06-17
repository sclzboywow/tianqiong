"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { InkStoryViewer } from "@/components/InkStoryViewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { StoryEntryData } from "@/game/types";

type StoryState = {
  lines: string[];
  choices: { index: number; text: string; choiceId: string }[];
  ended: boolean;
};

type StoryPreviewPanelProps = {
  entry: StoryEntryData;
};

export function StoryPreviewPanel({ entry }: StoryPreviewPanelProps) {
  const [story, setStory] = useState<StoryState | null>(null);
  const [choicePath, setChoicePath] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStory = useCallback(
    async (path: number[] = []) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/ops/story-preview/${entry.slug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ choicePath: path }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          story?: StoryState;
          error?: string;
        };
        if (!res.ok || !data.ok || !data.story) {
          throw new Error(data.error || "剧情加载失败");
        }
        setStory(data.story);
      } catch (err) {
        setError(err instanceof Error ? err.message : "剧情加载失败");
        setStory(null);
      } finally {
        setLoading(false);
      }
    },
    [entry.slug],
  );

  useEffect(() => {
    loadStory([]);
    setChoicePath([]);
  }, [loadStory]);

  async function handleChoose(_choiceId: string, index: number) {
    const nextPath = [...choicePath, index];
    setChoicePath(nextPath);
    await loadStory(nextPath);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">{entry.title}</h1>
          <p className="mt-1 font-mono text-sm text-zinc-500">{entry.slug}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => loadStory([])}>
            重新开始
          </Button>
          <Link href="/ops/content-studio">
            <Button variant="outline" size="sm">
              返回编排台
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardContent className="p-4 text-sm text-zinc-400 space-y-1">
          <p>类型：{entry.storyType} · 状态：{entry.status}</p>
          <p className="font-mono text-xs text-zinc-500">Ink：{entry.inkFile}</p>
          {entry.previewText && <p>{entry.previewText}</p>}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-rose-900/40 bg-rose-950/20">
          <CardContent className="p-4 text-sm text-rose-300">{error}</CardContent>
        </Card>
      )}

      {loading && !story && !error && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4 text-sm text-zinc-500">加载剧情中…</CardContent>
        </Card>
      )}

      {story && (
        <InkStoryViewer
          lines={story.lines}
          choices={story.choices}
          onChoose={handleChoose}
          loading={loading}
        />
      )}

      {story?.ended && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4 text-sm text-zinc-400">剧情已结束</CardContent>
        </Card>
      )}
    </div>
  );
}
