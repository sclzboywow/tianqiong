import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JOB_LABELS, formatDate, RESOLUTION_MODE_LABELS } from "@/utils/formatter";
import type { Job } from "@/game/prisma-types";
import type { Task, TaskParticipant, User } from "@prisma/client";

type TaskWithParticipants = Task & {
  participants: (TaskParticipant & { user: Pick<User, "id" | "nickname" | "job"> })[];
};

export function TaskCard({ task }: { task: TaskWithParticipants }) {
  const requiredJobs = JSON.parse(task.requiredJobs || "[]") as string[];
  const resolutionMode = task.resolutionMode || "SOLO";
  const submittedCount = task.participants.filter((p) => p.choiceId).length;
  const minResolveCount = task.minResolveCount || task.requiredCount || 1;
  const isResolved = task.status === "COMPLETED" || task.status === "FAILED";

  return (
    <Link href={`/tasks/${task.id}`}>
      <Card className="border-zinc-700 bg-zinc-900/80 transition hover:border-amber-700">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base text-amber-300">{task.title}</CardTitle>
            <div className="flex flex-col items-end gap-1">
              <Badge>{task.rarity}</Badge>
              <Badge variant="outline" className="text-xs">
                {RESOLUTION_MODE_LABELS[resolutionMode] || resolutionMode}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          <p>来源：{task.sourceName || task.sourceType}</p>
          <p>区域：{task.area}</p>
          <p>
            参与：{task.currentCount}/{task.requiredCount}
          </p>
          {resolutionMode !== "SOLO" && !isResolved && (
            <p>
              已提交：{submittedCount}/{minResolveCount}
            </p>
          )}
          <p>状态：{task.status}</p>
          {isResolved && task.finalChoiceId && (
            <p className="text-amber-300">最终方案：{task.finalChoiceId}</p>
          )}
          {task.deadline && <p>截止：{formatDate(task.deadline)}</p>}
          <div className="flex flex-wrap gap-1">
            {requiredJobs.map((job) => (
              <Badge key={job} variant="outline" className="text-xs">
                {JOB_LABELS[job as Job] || job}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
