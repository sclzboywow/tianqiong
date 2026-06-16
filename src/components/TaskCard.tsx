import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JOB_LABELS, formatDate } from "@/utils/formatter";
import type { Job } from "@/game/prisma-types";
import type { Task, TaskParticipant, User } from "@prisma/client";

type TaskWithParticipants = Task & {
  participants: (TaskParticipant & { user: Pick<User, "id" | "nickname" | "job"> })[];
};

export function TaskCard({ task }: { task: TaskWithParticipants }) {
  const requiredJobs = JSON.parse(task.requiredJobs || "[]") as string[];

  return (
    <Link href={`/tasks/${task.id}`}>
      <Card className="border-zinc-700 bg-zinc-900/80 transition hover:border-amber-700">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base text-amber-300">{task.title}</CardTitle>
            <Badge>{task.rarity}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          <p>来源：{task.sourceName || task.sourceType}</p>
          <p>区域：{task.area}</p>
          <p>
            人数：{task.currentCount}/{task.requiredCount}
          </p>
          <p>状态：{task.status}</p>
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
