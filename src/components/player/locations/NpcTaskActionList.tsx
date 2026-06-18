"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { ProjectState, Task } from "@prisma/client";
import { Handshake, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SandtableLocationNode } from "@/game/locationSandtablePresentationEngine";
import { resolveNpcTaskActionsForLocation } from "@/game/npcTaskActionResolver";
import { completeNpcTaskActionAction } from "@/app/(frontend)/locations/actions";

type ActionLogEntry = {
  id: string;
  message: string;
};

type NpcTaskActionListProps = {
  node: SandtableLocationNode;
  project: ProjectState;
  tasks: Task[];
  completedActionIds?: string[];
};

export function NpcTaskActionList({
  node,
  project,
  tasks,
  completedActionIds = [],
}: NpcTaskActionListProps) {
  const [optimisticCompletedIds, setOptimisticCompletedIds] = useState<string[]>([]);
  const [logs, setLogs] = useState<ActionLogEntry[]>([]);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const mergedCompletedIds = useMemo(
    () => Array.from(new Set([...completedActionIds, ...optimisticCompletedIds])),
    [completedActionIds, optimisticCompletedIds],
  );

  const groups = resolveNpcTaskActionsForLocation({
    currentLocationId: node.id,
    taskSlugs: node.relatedTaskSlugs,
    project,
    tasks,
    completedActionIds: mergedCompletedIds,
  });

  if (groups.length === 0) {
    return null;
  }

  const handleAction = (params: {
    taskSlug: string;
    actionId: string;
    enabled: boolean;
    completed: boolean;
  }) => {
    if (!params.enabled || params.completed || pendingActionId) return;

    setPendingActionId(params.actionId);

    startTransition(async () => {
      try {
        const result = await completeNpcTaskActionAction({
          taskSlug: params.taskSlug,
          locationId: node.id,
          actionId: params.actionId,
        });

        if (result.ok) {
          setOptimisticCompletedIds((current) =>
            current.includes(params.actionId) ? current : [...current, params.actionId],
          );
          setLogs((current) => [
            { id: `${params.actionId}-${Date.now()}`, message: result.message },
            ...current,
          ].slice(0, 8));
        } else {
          setLogs((current) => [
            { id: `err-${params.actionId}-${Date.now()}`, message: result.message },
            ...current,
          ].slice(0, 8));
        }
      } finally {
        setPendingActionId(null);
      }
    });
  };

  return (
    <section className="mt-4">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-medium text-cyan-100">
        <Handshake className="size-3.5 text-cyan-400" />
        任务推进动作
      </h3>
      <div className="space-y-3">
        {groups.map((group) => (
          <div
            key={group.taskSlug}
            className="border border-cyan-400/10 bg-slate-950/50 p-2.5"
          >
            <p className="mb-2 text-sm font-medium text-cyan-50">{group.taskTitle}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.actions.map((action) => {
                const isPending = pendingActionId === action.id;
                return (
                  <button
                    key={action.id}
                    type="button"
                    disabled={isPending || (!action.enabled && !action.completed)}
                    title={action.reason}
                    onClick={() =>
                      handleAction({
                        taskSlug: group.taskSlug,
                        actionId: action.id,
                        enabled: action.enabled,
                        completed: action.completed,
                      })
                    }
                    className={cn(
                      "border px-2 py-1 text-[11px] transition",
                      action.completed &&
                        "border-emerald-400/30 bg-emerald-950/25 text-emerald-200",
                      action.enabled &&
                        !action.completed &&
                        !isPending &&
                        "border-cyan-400/30 bg-cyan-950/20 text-cyan-100 hover:border-cyan-400/50",
                      isPending &&
                        "border-cyan-400/20 bg-cyan-950/10 text-cyan-200",
                      !action.enabled &&
                        !action.completed &&
                        !isPending &&
                        "cursor-not-allowed border-slate-700/40 bg-slate-900/40 text-slate-500",
                    )}
                  >
                    {isPending ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="size-3 animate-spin" />
                        {action.label}
                      </span>
                    ) : action.completed ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        {action.label}
                      </span>
                    ) : (
                      action.label
                    )}
                  </button>
                );
              })}
            </div>
            {group.actions.some((action) => action.reason && !action.completed) ? (
              <p className="mt-2 text-[10px] leading-5 text-slate-500">
                {group.actions.find((action) => action.reason && !action.completed)?.reason}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {logs.length > 0 ? (
        <ul className="mt-3 space-y-1 border-t border-cyan-400/10 pt-2">
          {logs.map((entry) => (
            <li key={entry.id} className="text-[10px] leading-5 text-slate-500">
              · {entry.message}
            </li>
          ))}
        </ul>
      ) : null}

      <Link
        href="/tasks"
        className="mt-3 inline-flex text-xs text-cyan-300/80 hover:text-cyan-200"
      >
        前往任务页继续推进 →
      </Link>
    </section>
  );
}
