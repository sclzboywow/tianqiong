"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { TaskDetailViewData, TaskStoryState } from "@/game/taskDetailPresentationEngine";
import { TaskDetailLayout } from "./TaskDetailLayout";
import { TaskDetailHeader } from "./TaskDetailHeader";
import { TaskIntelPanel } from "./TaskIntelPanel";
import { TaskImpactPanel } from "./TaskImpactPanel";
import { TaskStoryPanel } from "./TaskStoryPanel";
import { TaskResultPanel, type TaskResolveResult } from "./TaskResultPanel";

type TaskDetailClientProps = {
  initialData: TaskDetailViewData;
};

type ApiTaskPayload = {
  task: {
    status: string;
    currentCount: number;
    submittedCount?: number;
    minResolveCount?: number;
    finalChoiceId?: string | null;
    participants: Array<{
      id: string;
      userId: string;
      nickname: string;
      job: string;
      choiceId?: string | null;
    }>;
  };
  story: TaskStoryState | null;
};

export function TaskDetailClient({ initialData }: TaskDetailClientProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [story, setStory] = useState<TaskStoryState | null>(initialData.storyState);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<{
    message: string;
    submittedCount: number;
    requiredCount: number;
  } | null>(
    initialData.hasSubmitted && initialData.isActive
      ? {
          message: "你已提交选择，等待其他成员参与后统一结算",
          submittedCount: initialData.submittedCount,
          requiredCount: initialData.minResolveCount,
        }
      : null,
  );
  const [result, setResult] = useState<TaskResolveResult | null>(
    initialData.isCompleted
      ? {
          finalized: true,
          success: initialData.resolvedSuccess,
        }
      : null,
  );
  const [selectedChoiceText, setSelectedChoiceText] = useState<string | null>(null);

  const syncFromApi = useCallback((payload: ApiTaskPayload) => {
    const task = payload.task;
    const isActive = task.status === "PENDING" || task.status === "IN_PROGRESS";
    const isCompleted = task.status === "COMPLETED" || task.status === "FAILED";
    const submittedCount =
      task.submittedCount ?? task.participants.filter((participant) => participant.choiceId).length;
    const minResolveCount = task.minResolveCount || data.requiredCount || 1;
    const hasSubmitted = task.participants.some((participant) => participant.choiceId);

    setStory(payload.story);
    setData((prev) => ({
      ...prev,
      status: task.status,
      statusLabel:
        task.status === "PENDING"
          ? "待处理"
          : task.status === "IN_PROGRESS"
            ? "进行中"
            : task.status === "COMPLETED"
              ? "已完成"
              : task.status === "FAILED"
                ? "失败"
                : task.status,
      participantCount: task.currentCount,
      submittedCount,
      minResolveCount,
      isActive,
      isCompleted,
      isJoined: true,
      hasSubmitted,
      resolvedSuccess:
        task.status === "COMPLETED" ? true : task.status === "FAILED" ? false : prev.resolvedSuccess,
      canResolve: isActive && !hasSubmitted && prev.inkAvailable,
      participants: task.participants.map((participant) => ({
        id: participant.id,
        nickname: participant.nickname,
        jobLabel: participant.job,
        hasSubmitted: !!participant.choiceId,
      })),
    }));

    if (isCompleted) {
      setPending(null);
      setResult((prev) => prev ?? { finalized: true, success: task.status === "COMPLETED" });
    }
  }, [data.requiredCount]);

  async function refreshTask() {
    const res = await fetch(`/api/tasks/${data.id}`);
    if (!res.ok) return;
    const payload = (await res.json()) as ApiTaskPayload;
    syncFromApi(payload);
  }

  async function handleJoin() {
    setLoading(true);
    const res = await fetch(`/api/tasks/${data.id}/join`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      setData((prev) => ({ ...prev, isJoined: true }));
      await refreshTask();
    }
  }

  async function handleChoose(choiceId: string, choiceText: string) {
    setLoading(true);
    setSelectedChoiceText(choiceText);
    const res = await fetch(`/api/tasks/${data.id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choiceId }),
    });
    const payload = await res.json();
    setLoading(false);

    if (!res.ok) return;

    if (payload.finalized) {
      setPending(null);
      setResult(payload);
      await refreshTask();
      router.refresh();
      return;
    }

    setPending({
      message: payload.message,
      submittedCount: payload.submittedCount,
      requiredCount: payload.requiredCount,
    });
    await refreshTask();
  }

  const showChoices =
    data.isJoined && data.isActive && !data.hasSubmitted && !pending && !result?.finalized;

  return (
    <TaskDetailLayout
      header={<TaskDetailHeader data={data} />}
      intel={<TaskIntelPanel data={data} />}
      impact={<TaskImpactPanel data={data} />}
      story={
        <TaskStoryPanel
          story={story}
          inkAvailable={data.inkAvailable}
          isActive={data.isActive}
          isJoined={data.isJoined}
          hasSubmitted={data.hasSubmitted}
          loading={loading}
          onJoin={handleJoin}
          onChoose={handleChoose}
          pending={pending}
          showChoices={showChoices}
        />
      }
      result={
        <TaskResultPanel
          isCompleted={data.isCompleted}
          resolvedSuccess={data.resolvedSuccess}
          selectedChoiceText={selectedChoiceText}
          result={result}
          milestoneLabels={data.milestoneLabels}
          recentLogs={data.recentLogs}
        />
      }
    />
  );
}
