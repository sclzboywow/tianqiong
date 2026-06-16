"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InkStoryViewer } from "@/components/InkStoryViewer";
import { JOB_LABELS } from "@/utils/formatter";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Record<string, unknown> | null>(null);
  const [story, setStory] = useState<{ lines: string[]; choices: { index: number; text: string; choiceId: string }[] } | null>(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    effects: Record<string, number>;
    rewards: { exp: number; gold: number; reputation: number; contribution: number };
  } | null>(null);

  useEffect(() => {
    fetch(`/api/tasks/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setTask(data.task);
        setStory(data.story);
      });
  }, [params.id]);

  async function handleJoin() {
    setLoading(true);
    const res = await fetch(`/api/tasks/${params.id}/join`, { method: "POST" });
    setLoading(false);
    if (res.ok) setJoined(true);
  }

  async function handleChoose(choiceId: string) {
    setLoading(true);
    const res = await fetch(`/api/tasks/${params.id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choiceId }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setResult(data.result);
  }

  if (!task) return <main className="p-4 text-zinc-400">加载中...</main>;

  const requiredJobs = JSON.parse((task.requiredJobs as string) || "[]") as string[];
  const participants = (task.participants as { user: { nickname: string; job: string } }[]) || [];

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <Card className="border-zinc-700 bg-zinc-900/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-amber-400">{task.title as string}</CardTitle>
            <Badge>{task.rarity as string}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          <p>区域：{task.area as string}</p>
          <p>来源：{(task.sourceName as string) || (task.sourceType as string)}</p>
          <p>
            参与：{task.currentCount as number}/{task.requiredCount as number}
          </p>
          <div className="flex flex-wrap gap-1">
            {requiredJobs.map((job) => (
              <Badge key={job} variant="outline">
                {JOB_LABELS[job as keyof typeof JOB_LABELS] || job}
              </Badge>
            ))}
          </div>
          {participants.length > 0 && (
            <p>已参与：{participants.map((p) => p.user.nickname).join("、")}</p>
          )}
        </CardContent>
      </Card>

      {!joined && (task.status === "PENDING" || task.status === "IN_PROGRESS") && (
        <Button className="w-full" onClick={handleJoin} disabled={loading}>
          加入任务
        </Button>
      )}

      {joined && story && (
        <InkStoryViewer
          lines={story.lines}
          choices={story.choices}
          onChoose={handleChoose}
          loading={loading}
          result={result}
        />
      )}

      {result && (
        <Button variant="outline" className="w-full" onClick={() => router.push("/tasks")}>
          返回任务大厅
        </Button>
      )}
    </main>
  );
}
