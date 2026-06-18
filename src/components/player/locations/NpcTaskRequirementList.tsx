"use client";

import type { ProjectState, Task } from "@prisma/client";
import { UserSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SandtableLocationNode } from "@/game/locationSandtablePresentationEngine";
import { resolveNpcTaskRequirementsForLocation } from "@/game/npcTaskRequirementResolver";
import type { NpcPresenceStatus } from "@/game/npcPresenceResolver";

const PRESENCE_LABELS: Record<NpcPresenceStatus, string> = {
  present: "在场",
  reachable: "可联络",
  away: "不在场",
  locked: "未解锁",
};

type NpcTaskRequirementListProps = {
  node: SandtableLocationNode;
  project: ProjectState;
  tasks: Task[];
};

export function NpcTaskRequirementList({ node, project, tasks }: NpcTaskRequirementListProps) {
  const requirements = resolveNpcTaskRequirementsForLocation({
    currentLocationId: node.id,
    taskSlugs: node.relatedTaskSlugs,
    project,
    tasks,
  });

  if (requirements.length === 0) {
    return null;
  }

  return (
    <section className="mt-4">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-medium text-cyan-100">
        <UserSearch className="size-3.5 text-cyan-400" />
        任务推进条件
      </h3>
      <ul className="space-y-2">
        {requirements.map((item) => (
          <li
            key={item.taskSlug}
            className="border border-cyan-400/10 bg-slate-950/50 p-2.5 text-[11px] leading-5 text-slate-400"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-medium text-cyan-50">{item.taskTitle}</p>
              <span
                className={cn(
                  "shrink-0 border px-1.5 py-0.5 text-[10px]",
                  item.canProgress
                    ? "border-emerald-400/40 bg-emerald-950/30 text-emerald-100"
                    : "border-amber-400/35 bg-amber-950/25 text-amber-100",
                )}
              >
                {item.canProgress ? "可推进" : "先找 NPC"}
              </span>
            </div>
            <p className="mt-1.5">
              需要找：
              <span className="text-cyan-100">{item.primaryNpcName}</span>
              {item.primaryStatus ? (
                <span className="ml-1 text-slate-500">
                  状态：{PRESENCE_LABELS[item.primaryStatus]}
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-slate-500">{item.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
