"use client";

import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskStoryChoice, TaskStoryState } from "@/game/taskDetailPresentationEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../../playerTheme";

type TaskStoryPanelProps = {
  story: TaskStoryState | null;
  inkAvailable: boolean;
  isActive: boolean;
  isJoined: boolean;
  hasSubmitted: boolean;
  loading: boolean;
  onJoin: () => void;
  onChoose: (choiceId: string, choiceText: string) => void;
  pending?: {
    message: string;
    submittedCount: number;
    requiredCount: number;
  } | null;
  showChoices: boolean;
};

export function TaskStoryPanel({
  story,
  inkAvailable,
  isActive,
  isJoined,
  hasSubmitted,
  loading,
  onJoin,
  onChoose,
  pending,
  showChoices,
}: TaskStoryPanelProps) {
  const lines = story?.lines?.length ? story.lines : ["暂无剧情文本。"];
  const choices = story?.choices || [];

  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <h3 className="text-base font-semibold text-[#EAF3FF]">剧情处理</h3>
        <p className="mt-1 text-xs text-[#8EA3B8]">阅读现场情况，选择处理方案并提交。</p>
      </div>

      <div className={`${playerCardBodyClass} space-y-4`}>
        {!inkAvailable && (
          <p className="rounded-lg border border-[rgba(250,204,21,0.35)] bg-[rgba(250,204,21,0.08)] px-4 py-3 text-sm text-[#FDE68A]">
            该任务尚未配置剧情，无法进入处理。
          </p>
        )}

        {inkAvailable && (
          <div className="rounded-lg border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.45)] px-4 py-4">
            <div className="space-y-3 text-[15px] leading-relaxed text-[#EAF3FF]/95">
              {lines.map((line, index) => (
                <p key={`${index}-${line.slice(0, 24)}`} className="whitespace-pre-wrap">
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {!isJoined && isActive && inkAvailable && (
          <button
            type="button"
            disabled={loading}
            onClick={onJoin}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-[#1E88FF] text-sm font-medium text-white hover:bg-[#2EA8FF] disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" />
                加入中
              </span>
            ) : (
              "加入任务并开始处理"
            )}
          </button>
        )}

        {showChoices && choices.length > 0 && (
          <div className="space-y-3">
            {choices.map((choice: TaskStoryChoice) => (
              <div
                key={choice.choiceId}
                className="rounded-lg border border-[rgba(60,160,255,0.22)] bg-[rgba(5,11,20,0.55)] px-4 py-3"
              >
                <p className="text-sm font-medium text-[#EAF3FF]">{choice.text}</p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onChoose(choice.choiceId, choice.text)}
                  className={cn(
                    "mt-3 flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors",
                    "bg-[#1E88FF] text-white hover:bg-[#2EA8FF]",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                >
                  选择该方案
                </button>
              </div>
            ))}
          </div>
        )}

        {pending && (
          <div className="rounded-lg border border-[rgba(30,136,255,0.35)] bg-[rgba(30,136,255,0.08)] px-4 py-3 text-sm text-[#93C5FD]">
            <p>{pending.message}</p>
            <p className="mt-1 text-xs text-[#8EA3B8]">
              当前提交：{pending.submittedCount}/{pending.requiredCount}
            </p>
          </div>
        )}

        {isJoined && isActive && hasSubmitted && !pending && choices.length === 0 && (
          <p className="text-sm text-[#8EA3B8]">你已提交方案，请等待结算或查看右侧结果。</p>
        )}

        {!isActive && !inkAvailable && (
          <p className="text-sm text-[#8EA3B8]">任务已结束，可在右侧查看结算摘要。</p>
        )}
      </div>
    </section>
  );
}
