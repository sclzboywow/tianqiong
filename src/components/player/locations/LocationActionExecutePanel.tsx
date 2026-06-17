"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, LoaderCircle, Sparkles, Zap } from "lucide-react";
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

export function LocationActionExecutePanel({
  locationId,
  actions,
  user,
  unlocked,
}: LocationActionExecutePanelProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ExecuteFeedback | null>(null);
  const [showFirstActionHint, setShowFirstActionHint] = useState(false);

  useEffect(() => {
    if (
      feedback?.createdTasks &&
      feedback.createdTasks.length > 0 &&
      !isFirstActionHintSeen()
    ) {
      setShowFirstActionHint(true);
      markFirstActionHintSeen();
    }
  }, [feedback]);

  if (!unlocked) return null;

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
      router.refresh();
    } catch {
      setFeedback({ type: "error", message: "网络错误，请稍后重试" });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <h3 className="text-base font-semibold text-[#EAF3FF]">可执行行动</h3>
        <p className="mt-1 text-xs text-[#8EA3B8]">在此地点触发行动，生成任务或推进事件。</p>
      </div>

      <div className={`${playerCardBodyClass} space-y-3`}>
        {actions.length === 0 ? (
          <p className="text-sm text-[#8EA3B8]">当前暂无可用行动。</p>
        ) : (
          actions.map((action) => {
            const blockReason = canExecuteAction(action, user);
            const isPending = pendingId === action.id;
            const isRecommended = action.isRecommended;

            return (
              <article
                key={action.id}
                className={cn(
                  "rounded-lg border bg-[rgba(5,11,20,0.45)] p-4",
                  isRecommended
                    ? "border-[#2EA8FF] shadow-[0_0_12px_rgba(30,136,255,0.15)]"
                    : "border-[rgba(60,160,255,0.15)]",
                )}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    {isRecommended && (
                      <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-[rgba(30,136,255,0.15)] px-2 py-0.5 text-[11px] text-[#2EA8FF]">
                        <Sparkles className="size-3" />
                        推荐行动
                      </span>
                    )}
                    <h4 className="text-[15px] font-medium text-[#EAF3FF]">{action.label}</h4>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#8EA3B8]">
                      {action.description}
                    </p>

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
                      {action.triggerTaskCount > 0 && (
                        <span className="rounded-md border border-[rgba(60,160,255,0.12)] px-2 py-0.5 text-[#8EA3B8]">
                          触发 {action.triggerTaskCount} 项任务
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

                    {blockReason && (
                      <p className="mt-2 text-xs text-[#EF4444]">{blockReason}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isPending || !!blockReason}
                    onClick={() => handleExecute(action.id)}
                    className={cn(
                      "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      blockReason
                        ? "cursor-not-allowed border border-[rgba(60,160,255,0.12)] text-[#8EA3B8]"
                        : "bg-[#1E88FF] text-white hover:bg-[#2EA8FF] disabled:opacity-60",
                    )}
                  >
                    {isPending ? (
                      <span className="inline-flex items-center gap-1.5">
                        <LoaderCircle className="size-4 animate-spin" />
                        执行中
                      </span>
                    ) : (
                      "执行行动"
                    )}
                  </button>
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
                <p className="text-xs font-medium">已生成任务：</p>
                {showFirstActionHint && (
                  <p className="mt-2 text-xs leading-relaxed text-[#93C5FD]">
                    下一步请前往任务台处理任务，完成后会影响项目指标和章节目标。
                  </p>
                )}
                <ul className="mt-1 space-y-1.5 text-xs">
                  {feedback.createdTasks.map((task) => (
                    <li key={task.id}>
                      <Link
                        href={`/tasks/${task.id}`}
                        className="inline-flex items-center gap-2 hover:underline"
                      >
                        <span>· {task.title}</span>
                        <span className="text-[#2EA8FF]">前往处理</span>
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
