"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, LoaderCircle, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isFirstActionHintSeen,
  markFirstActionHintSeen,
} from "@/lib/onboardingStorage";
import type { LocationActionDisplayItem } from "@/game/locationPresentationEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

type UserResources = {
  stamina: number;
  spirit: number;
  level: number;
  reputation: number;
};

type LocationActionExecutePanelProps = {
  locationId: string;
  actions: LocationActionDisplayItem[];
  user: UserResources;
  unlocked: boolean;
  appearance?: "default" | "sandtable";
  layout?: "default" | "workspace-hero" | "workspace-compact";
  onExecuted?: () => void;
};

type ExecuteFeedback = {
  type: "success" | "skip" | "error";
  message: string;
  createdTasks?: { id: string; title: string }[];
};

function canExecuteAction(action: LocationActionDisplayItem, user: UserResources): string | null {
  if (action.minLevel && user.level < action.minLevel) {
    return `等级不足，需要 Lv.${action.minLevel}`;
  }
  if (action.minReputation && user.reputation < action.minReputation) {
    return `声望不足，需要 ${action.minReputation}`;
  }
  if (action.staminaCost && user.stamina < action.staminaCost) {
    return `体力不足，需要 ${action.staminaCost}（当前 ${user.stamina}）`;
  }
  if (action.spiritCost && user.spirit < action.spiritCost) {
    return `精神不足，需要 ${action.spiritCost}（当前 ${user.spirit}）`;
  }
  return null;
}

function allTriggerTasksResolved(action: LocationActionDisplayItem): boolean {
  if (action.triggerTaskSlugs.length === 0) return false;
  return action.triggerTaskSlugs.every((slug) =>
    action.existingTasks.some((task) => task.templateId === slug),
  );
}

function allTriggerTasksCompleted(action: LocationActionDisplayItem): boolean {
  if (action.triggerTaskSlugs.length === 0) return false;
  return action.triggerTaskSlugs.every((slug) =>
    action.existingTasks.some((task) => task.templateId === slug && task.status === "COMPLETED"),
  );
}

function ActionTaskLinks({ action }: { action: LocationActionDisplayItem }) {
  const allCompleted = allTriggerTasksCompleted(action);
  const single = action.existingTasks.length === 1;
  const linkLabel = (status: string) => (status === "COMPLETED" ? "查看结果" : "前往处理");

  if (single) {
    const task = action.existingTasks[0];
    return (
      <div className="shrink-0 space-y-2 text-right">
        <p className="text-xs text-[#8EA3B8]">{allCompleted ? "任务已完成" : "任务已生成"}</p>
        <Link
          href={`/tasks/${task.id}`}
          className="inline-flex items-center gap-1 rounded-lg border border-[rgba(60,160,255,0.35)] bg-[rgba(30,136,255,0.12)] px-4 py-2 text-sm font-medium text-[#2EA8FF] hover:border-[#2EA8FF]"
        >
          {linkLabel(task.status)}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="shrink-0 space-y-2 lg:min-w-[200px]">
      <p className="text-xs text-[#8EA3B8]">
        {allCompleted ? "任务已完成" : `已生成 ${action.existingTasks.length} 项任务`}
      </p>
      <ul className="space-y-1.5">
        {action.existingTasks.map((task) => (
          <li key={task.id}>
            <Link
              href={`/tasks/${task.id}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-[rgba(60,160,255,0.2)] bg-[rgba(5,11,20,0.45)] px-3 py-2 text-xs text-[#EAF3FF] hover:border-[rgba(60,160,255,0.4)]"
            >
              <span className="truncate">{task.title}</span>
              <span className="shrink-0 text-[#2EA8FF]">{linkLabel(task.status)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LocationActionExecutePanel({
  locationId,
  actions,
  user,
  unlocked,
  appearance = "default",
  layout = "default",
  onExecuted,
}: LocationActionExecutePanelProps) {
  const router = useRouter();
  const isSandtable = appearance === "sandtable";
  const isHero = layout === "workspace-hero";
  const isCompact = layout === "workspace-compact";
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ExecuteFeedback | null>(null);
  const [showFirstActionHint, setShowFirstActionHint] = useState(false);

  if (!unlocked) return null;

  const visibleActions = actions.filter((action) => {
    if (isHero) return action.isRecommended;
    if (isCompact) return !action.isRecommended;
    return true;
  });

  if (visibleActions.length === 0) {
    if (isHero) {
      return (
        <p className="border border-cyan-400/10 bg-slate-950/40 p-3 text-[11px] text-slate-500">
          当前暂无推荐行动。
        </p>
      );
    }
    if (isCompact) return null;
  }

  async function handleExecute(actionId: string) {
    setPendingId(actionId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/locations/${locationId}/actions/${actionId}`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: "error", message: data.error || "行动执行失败" });
        return;
      }

      const createdTasks = (data.createdTasks || []).map((task: { id: string; title: string }) => ({
        id: task.id,
        title: task.title,
      }));

      const type =
        createdTasks.length > 0 ? "success" : data.skippedTasks?.length > 0 ? "skip" : "success";

      setFeedback({
        type,
        message: data.message || "行动已执行",
        createdTasks,
      });
      if (createdTasks.length > 0 && !isFirstActionHintSeen()) {
        setShowFirstActionHint(true);
        markFirstActionHintSeen();
      }
      onExecuted?.();
      if (!isSandtable) {
        router.refresh();
      }
    } catch {
      setFeedback({ type: "error", message: "网络错误，请稍后重试" });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section
      className={cn(
        isHero && "border border-cyan-400/40 bg-cyan-950/30",
        isCompact && "border-0 bg-transparent",
        !isHero && !isCompact && (isSandtable ? "border border-cyan-400/15 bg-slate-950/50" : playerCardClass),
      )}
    >
      {!isCompact ? (
        <div className={isHero ? "px-4 py-3" : isSandtable ? "border-b border-cyan-400/10 px-3 py-2.5" : playerCardHeaderClass}>
          <h3
            className={cn(
              isHero ? "text-sm font-semibold text-cyan-50" : isSandtable ? "text-xs font-medium text-cyan-100" : "text-base font-semibold text-[#EAF3FF]",
            )}
          >
            {isHero ? "当前推荐动作" : "地点行动"}
          </h3>
          {!isHero ? (
            <p className={isSandtable ? "mt-1 text-[10px] text-slate-500" : "mt-1 text-xs text-[#8EA3B8]"}>
              在此地点发起行动，可能生成任务、推进事件或记录动态。
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={cn(isHero ? "space-y-3 px-4 pb-4" : isCompact ? "space-y-1.5" : isSandtable ? "space-y-2 p-3" : `${playerCardBodyClass} space-y-3`)}>
        {visibleActions.length === 0 ? (
          <p className={isSandtable ? "text-[11px] text-slate-600" : "text-sm text-[#8EA3B8]"}>
            当前暂无可用行动。
          </p>
        ) : (
          visibleActions.map((action) => {
            const blockReason = canExecuteAction(action, user);
            const isPending = pendingId === action.id;
            const isRecommended = action.isRecommended;
            const hasExistingTasks = action.existingTasks.length > 0;
            const hideExecute = hasExistingTasks && allTriggerTasksResolved(action);

            if (isCompact) {
              return (
                <article
                  key={action.id}
                  className="flex items-center justify-between gap-2 border border-cyan-400/10 bg-slate-950/40 px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-slate-200">{action.label}</p>
                    {blockReason ? (
                      <p className="truncate text-[10px] text-rose-300/90">{blockReason}</p>
                    ) : null}
                  </div>
                  {!hideExecute ? (
                    <button
                      type="button"
                      disabled={isPending || !!blockReason}
                      onClick={() => handleExecute(action.id)}
                      className="shrink-0 border border-cyan-400/25 px-2.5 py-1 text-[10px] text-cyan-100 hover:border-cyan-400/45 disabled:opacity-50"
                    >
                      {isPending ? "执行中" : "执行"}
                    </button>
                  ) : (
                    <span className="shrink-0 text-[10px] text-slate-500">已生成</span>
                  )}
                </article>
              );
            }

            return (
              <article
                key={action.id}
                className={cn(
                  isHero ? "space-y-3" : "border p-3",
                  !isHero &&
                    (isSandtable
                      ? isRecommended
                        ? "border-cyan-400/40 bg-cyan-950/25"
                        : "border-cyan-400/10 bg-slate-950/40"
                      : cn(
                          "rounded-lg bg-[rgba(5,11,20,0.45)] p-4",
                          isRecommended
                            ? "border-[#2EA8FF] shadow-[0_0_12px_rgba(30,136,255,0.15)]"
                            : "border-[rgba(60,160,255,0.15)]",
                        )),
                )}
              >
                <div className={cn("flex flex-col gap-3", !isHero && "lg:flex-row lg:items-start lg:justify-between")}>
                  <div className="min-w-0 flex-1">
                    {isRecommended && !isHero && (
                      <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-[rgba(30,136,255,0.15)] px-2 py-0.5 text-[11px] text-[#2EA8FF]">
                        <Sparkles className="size-3" />
                        推荐行动
                      </span>
                    )}
                    <h4 className={cn(isHero ? "text-base font-semibold text-cyan-50" : "text-[15px] font-medium text-[#EAF3FF]")}>
                      {action.label}
                    </h4>
                    <p className={cn("mt-1 leading-relaxed text-slate-400", isHero ? "text-[12px]" : "text-[13px] text-[#8EA3B8]")}>
                      {action.description}
                    </p>

                    {!isHero ? (
                      <>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                          {(action.staminaCost > 0 || action.spiritCost > 0) && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.08)] px-2 py-0.5 text-[#22C55E]">
                              <Zap className="size-3" />
                              {action.staminaCost > 0 && `体力 ${action.staminaCost}`}
                              {action.staminaCost > 0 && action.spiritCost > 0 && " / "}
                              {action.spiritCost > 0 && `精神 ${action.spiritCost}`}
                            </span>
                          )}
                          {action.minLevel > 0 && (
                            <span className="rounded-md border border-[rgba(60,160,255,0.12)] px-2 py-0.5 text-[#8EA3B8]">
                              Lv.{action.minLevel}
                            </span>
                          )}
                          {action.minReputation > 0 && (
                            <span className="rounded-md border border-[rgba(60,160,255,0.12)] px-2 py-0.5 text-[#8EA3B8]">
                              声望 {action.minReputation}
                            </span>
                          )}
                        </div>

                        {action.relatedNpcNames.length > 0 && (
                          <p className="mt-2 text-xs text-[#8EA3B8]">
                            关联 NPC：{action.relatedNpcNames.join("、")}
                          </p>
                        )}

                        {action.riskTagLabels.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {action.riskTagLabels.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 rounded-md bg-[rgba(250,204,21,0.1)] px-1.5 py-0.5 text-[10px] text-[#FACC15]"
                              >
                                <AlertTriangle className="size-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500">
                        {action.staminaCost > 0 ? <span>体力 {action.staminaCost}</span> : null}
                        {action.spiritCost > 0 ? <span>精神 {action.spiritCost}</span> : null}
                        {action.relatedNpcNames.length > 0 ? (
                          <span>关联：{action.relatedNpcNames.join("、")}</span>
                        ) : null}
                      </div>
                    )}

                    {blockReason && (
                      <p className={cn("mt-2 text-xs text-[#EF4444]", isHero && "text-[11px]")}>{blockReason}</p>
                    )}
                  </div>

                  <div className={cn("flex flex-col gap-2", !isHero && "items-stretch lg:items-end")}>
                    {hasExistingTasks && !isHero ? <ActionTaskLinks action={action} /> : null}
                    {!hideExecute ? (
                      <button
                        type="button"
                        disabled={isPending || !!blockReason}
                        onClick={() => handleExecute(action.id)}
                        className={cn(
                          "shrink-0 font-medium transition-colors",
                          isHero
                            ? "flex h-11 w-full items-center justify-center gap-2 bg-cyan-400 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
                            : cn(
                                "rounded-lg px-4 py-2 text-sm",
                                blockReason
                                  ? "cursor-not-allowed border border-[rgba(60,160,255,0.12)] text-[#8EA3B8]"
                                  : hasExistingTasks
                                    ? "border border-[rgba(60,160,255,0.25)] text-[#EAF3FF] hover:border-[#2EA8FF]"
                                    : "bg-[#1E88FF] text-white hover:bg-[#2EA8FF] disabled:opacity-60",
                              ),
                        )}
                      >
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5">
                            <LoaderCircle className="size-4 animate-spin" />
                            执行中
                          </span>
                        ) : isHero ? (
                          <>
                            <Sparkles className="size-4" />
                            执行推荐动作
                          </>
                        ) : (
                          "执行行动"
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        )}

        {feedback && (
          <div
            className={cn(
              "rounded-lg border px-4 py-3 text-sm",
              feedback.type === "error" &&
                "border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] text-[#FCA5A5]",
              feedback.type === "skip" &&
                "border-[rgba(250,204,21,0.35)] bg-[rgba(250,204,21,0.08)] text-[#FDE68A]",
              feedback.type === "success" &&
                "border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.08)] text-[#86EFAC]",
            )}
          >
            <p>{feedback.message}</p>
            {feedback.createdTasks && feedback.createdTasks.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium">任务已生成，可在工作台继续跟进：</p>
                {showFirstActionHint && !isSandtable && (
                  <p className="mt-2 text-xs leading-relaxed text-[#93C5FD]">
                    任务处理、方案选择与结算请在任务台完成。
                  </p>
                )}
                <ul className="mt-1 space-y-1.5 text-xs">
                  {feedback.createdTasks.map((task) => (
                    <li key={task.id}>
                      <Link
                        href={`/tasks/${task.id}`}
                        className={cn(
                          "inline-flex items-center gap-2",
                          isSandtable ? "text-cyan-300/90 hover:text-cyan-200" : "hover:underline",
                        )}
                      >
                        <span>· {task.title}</span>
                        {isSandtable ? (
                          <span className="text-[10px] text-slate-500">次级入口</span>
                        ) : (
                          <span className="text-[#2EA8FF]">前往处理</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
