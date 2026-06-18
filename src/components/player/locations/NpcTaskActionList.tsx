"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProjectState, Task } from "@prisma/client";
import { Handshake, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SandtableLocationNode } from "@/game/locationSandtablePresentationEngine";
import { getLocationDisplayNameById } from "@/game/locationDisplayName";
import { resolveNpcTaskActionsForLocation } from "@/game/npcTaskActionResolver";

type ActionLogEntry = {
  id: string;
  message: string;
  at: number;
};

type NpcTaskActionListProps = {
  node: SandtableLocationNode;
  project: ProjectState;
  tasks: Task[];
};

function buildStorageKey(locationId: string, taskSlug: string): string {
  return `${locationId}::${taskSlug}`;
}

export function NpcTaskActionList({ node, project, tasks }: NpcTaskActionListProps) {
  const [completedByTask, setCompletedByTask] = useState<Record<string, string[]>>({});
  const [logs, setLogs] = useState<ActionLogEntry[]>([]);

  const completedActionIds = useMemo(
    () => Object.values(completedByTask).flat(),
    [completedByTask],
  );

  const groups = resolveNpcTaskActionsForLocation({
    currentLocationId: node.id,
    taskSlugs: node.relatedTaskSlugs,
    project,
    tasks,
    completedActionIds,
  });

  if (groups.length === 0) {
    return null;
  }

  const handleAction = (params: {
    taskSlug: string;
    actionId: string;
    label: string;
    successLog?: string;
    targetLocationId?: string;
    enabled: boolean;
  }) => {
    if (!params.enabled) return;

    const storageKey = buildStorageKey(node.id, params.taskSlug);
    setCompletedByTask((current) => {
      const existing = current[storageKey] ?? [];
      if (existing.includes(params.actionId)) return current;
      return { ...current, [storageKey]: [...existing, params.actionId] };
    });

    const message =
      params.successLog ??
      (params.targetLocationId
        ? `已记录：${params.label} → ${getLocationDisplayNameById(params.targetLocationId)}`
        : `已记录：${params.label}`);

    setLogs((current) => [
      { id: `${params.actionId}-${Date.now()}`, message, at: Date.now() },
      ...current,
    ].slice(0, 8));
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
            <p className="mb-2 text-[12px] font-medium text-cyan-50">{group.taskTitle}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  disabled={!action.enabled && !action.completed}
                  title={action.reason}
                  onClick={() =>
                    handleAction({
                      taskSlug: group.taskSlug,
                      actionId: action.id,
                      label: action.label,
                      successLog: action.successLog,
                      targetLocationId: action.targetLocationId,
                      enabled: action.enabled,
                    })
                  }
                  className={cn(
                    "border px-2 py-1 text-[11px] transition",
                    action.completed &&
                      "border-emerald-400/30 bg-emerald-950/25 text-emerald-200",
                    action.enabled &&
                      !action.completed &&
                      "border-cyan-400/30 bg-cyan-950/20 text-cyan-100 hover:border-cyan-400/50",
                    !action.enabled &&
                      !action.completed &&
                      "cursor-not-allowed border-slate-700/40 bg-slate-900/40 text-slate-500",
                  )}
                >
                  {action.completed ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      {action.label}
                    </span>
                  ) : (
                    action.label
                  )}
                </button>
              ))}
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
        className="mt-3 inline-flex text-[11px] text-cyan-300/80 hover:text-cyan-200"
      >
        前往任务页继续推进 →
      </Link>
    </section>
  );
}
