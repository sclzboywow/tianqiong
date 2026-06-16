"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InkStoryViewer } from "@/components/InkStoryViewer";
import { JOB_LABELS, RESOLUTION_MODE_LABELS } from "@/utils/formatter";

type Participant = {
  id: string;
  userId: string;
  nickname: string;
  job: string;
  status: string;
  choiceId?: string | null;
  choiceSubmittedAt?: string | null;
  contribution: number;
};

type TaskData = {
  id: string;
  title: string;
  rarity: string;
  area: string;
  sourceName?: string | null;
  sourceType: string;
  status: string;
  currentCount: number;
  requiredCount: number;
  requiredJobs: string;
  resolutionMode?: string;
  minResolveCount?: number;
  submittedCount?: number;
  finalChoiceId?: string | null;
  resolvedAt?: string | null;
  participants: Participant[];
};

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<TaskData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [story, setStory] = useState<{ lines: string[]; choices: { index: number; text: string; choiceId: string }[] } | null>(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<{
    message: string;
    submittedCount: number;
    requiredCount: number;
  } | null>(null);
  const [result, setResult] = useState<{
    finalized?: boolean;
    success?: boolean;
    finalChoiceId?: string;
    effects?: Record<string, number>;
    rewards?: { exp: number; gold: number; reputation: number; contribution: number };
  } | null>(null);

  async function loadTask() {
    const [taskRes, meRes] = await Promise.all([
      fetch(`/api/tasks/${params.id}`),
      fetch("/api/auth/me"),
    ]);
    const data = await taskRes.json();
    const me = await meRes.json();
    const taskData = data.task as TaskData;
    setTask(taskData);
    setStory(data.story);
    setCurrentUserId(me.user?.id || null);

    const isParticipant = taskData.participants.some((p) => p.userId === me.user?.id);
    setJoined(isParticipant);

    const myParticipant = taskData.participants.find((p) => p.userId === me.user?.id);
    if (myParticipant?.choiceId && taskData.status === "IN_PROGRESS") {
      setPending({
        message: "你已提交选择，等待其他成员参与后统一结算",
        submittedCount: taskData.submittedCount || 0,
        requiredCount: taskData.minResolveCount || taskData.requiredCount || 1,
      });
    }
  }

  useEffect(() => {
    loadTask();
  }, [params.id]);

  async function handleJoin() {
    setLoading(true);
    const res = await fetch(`/api/tasks/${params.id}/join`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      setJoined(true);
      await loadTask();
    }
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

    if (!res.ok) return;

    if (data.finalized) {
      setPending(null);
      setResult(data);
      await loadTask();
      return;
    }

    setPending({
      message: data.message,
      submittedCount: data.submittedCount,
      requiredCount: data.requiredCount,
    });
    await loadTask();
  }

  if (!task) return <main className="p-4 text-zinc-400">加载中...</main>;

  const requiredJobs = JSON.parse(task.requiredJobs || "[]") as string[];
  const resolutionMode = task.resolutionMode || "SOLO";
  const minResolveCount = task.minResolveCount || task.requiredCount || 1;
  const submittedCount = task.submittedCount ?? task.participants.filter((p) => p.choiceId).length;
  const isActive = task.status === "PENDING" || task.status === "IN_PROGRESS";
  const myParticipant = task.participants.find((p) => p.userId === currentUserId);
  const hasSubmitted = !!myParticipant?.choiceId;

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <Card className="border-zinc-700 bg-zinc-900/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-amber-400">{task.title}</CardTitle>
            <div className="flex gap-2">
              <Badge>{task.rarity}</Badge>
              <Badge variant="outline">{RESOLUTION_MODE_LABELS[resolutionMode] || resolutionMode}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          <p>区域：{task.area}</p>
          <p>来源：{task.sourceName || task.sourceType}</p>
          <p>
            参与：{task.currentCount}/{task.requiredCount}
          </p>
          {resolutionMode !== "SOLO" && (
            <p>
              已提交：{submittedCount}/{minResolveCount}
            </p>
          )}
          <p>状态：{task.status}</p>
          {task.finalChoiceId && <p className="text-amber-300">最终方案：{task.finalChoiceId}</p>}
          <div className="flex flex-wrap gap-1">
            {requiredJobs.map((job) => (
              <Badge key={job} variant="outline">
                {JOB_LABELS[job as keyof typeof JOB_LABELS] || job}
              </Badge>
            ))}
          </div>
          {task.participants.length > 0 && (
            <div className="space-y-1 pt-2">
              <p className="font-medium text-zinc-200">协作成员</p>
              {task.participants.map((p) => (
                <p key={p.id} className="text-xs text-zinc-400">
                  {p.nickname} · {JOB_LABELS[p.job as keyof typeof JOB_LABELS] || p.job}
                  {p.choiceId ? ` · 已提交(${p.choiceId})` : " · 未提交"}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!joined && isActive && (
        <Button className="w-full" onClick={handleJoin} disabled={loading}>
          加入任务
        </Button>
      )}

      {joined && story && isActive && !hasSubmitted && !result && (
        <InkStoryViewer
          lines={story.lines}
          choices={story.choices}
          onChoose={handleChoose}
          loading={loading}
          pending={pending}
          result={result}
        />
      )}

      {joined && (pending || result || (!isActive && task.finalChoiceId)) && (
        <InkStoryViewer
          lines={story?.lines || [task.title]}
          choices={[]}
          onChoose={async () => {}}
          loading={loading}
          pending={pending}
          result={
            result ||
            (task.status === "COMPLETED" || task.status === "FAILED"
              ? {
                  finalized: true,
                  success: task.status === "COMPLETED",
                  finalChoiceId: task.finalChoiceId || undefined,
                }
              : null)
          }
        />
      )}

      {(result || task.status === "COMPLETED" || task.status === "FAILED") && (
        <Button variant="outline" className="w-full" onClick={() => router.push("/tasks")}>
          返回任务大厅
        </Button>
      )}
    </main>
  );
}
