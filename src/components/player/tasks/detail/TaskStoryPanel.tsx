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
  error?: string | null;
};

type StorySegment =
  | {
      type: "narration";
      key: string;
      text: string;
    }
  | {
      type: "dialogue";
      key: string;
      speaker: string;
      text: string;
    };

function detectSpeaker(context: string, quote: string): string | null {
  const text = `${context} ${quote}`;
  const rules: Array<[string, string[]]> = [
    ["甲方代表", ["甲方代表", "甲方", "领导", "汇报"]],
    ["资料员", ["资料员", "资料室", "名单今晚", "台账", "原件"]],
    ["监理", ["监理", "整改", "签字", "规范"]],
    ["总包", ["总包", "班组", "现场负责人", "先动"]],
    ["设计院", ["设计院", "设计", "出图", "图纸", "方案"]],
    ["造价咨询", ["造价", "控制价", "成本"]],
    ["物业", ["物业", "钥匙", "移交"]],
    ["消防专家", ["消防", "通道", "泵房"]],
  ];

  for (const [speaker, keywords] of rules) {
    if (keywords.some((keyword) => text.includes(keyword))) return speaker;
  }

  return null;
}

function buildStorySegments(lines: string[]): StorySegment[] {
  const segments: StorySegment[] = [];
  let lastSpeaker = "项目现场";

  lines.forEach((rawLine, lineIndex) => {
    const line = rawLine.trim();
    if (!line) return;

    const matches = [...line.matchAll(/「([^」]+)」/g)];
    if (matches.length === 0) {
      segments.push({
        type: "narration",
        key: `narration-${lineIndex}`,
        text: line,
      });
      return;
    }

    let cursor = 0;
    matches.forEach((match, matchIndex) => {
      const quoteStart = match.index ?? 0;
      const quoteText = match[1].trim();
      const before = line.slice(cursor, quoteStart).trim();

      if (before) {
        segments.push({
          type: "narration",
          key: `narration-${lineIndex}-${matchIndex}`,
          text: before,
        });
      }

      const contextBefore = line.slice(Math.max(0, quoteStart - 36), quoteStart);
      const contextAfter = line.slice(quoteStart + match[0].length, quoteStart + match[0].length + 36);
      const speaker = detectSpeaker(`${contextBefore}${contextAfter}`, quoteText) || lastSpeaker;
      lastSpeaker = speaker;

      segments.push({
        type: "dialogue",
        key: `dialogue-${lineIndex}-${matchIndex}`,
        speaker,
        text: quoteText,
      });

      cursor = quoteStart + match[0].length;
    });

    const rest = line.slice(cursor).trim();
    if (rest) {
      segments.push({
        type: "narration",
        key: `narration-${lineIndex}-tail`,
        text: rest,
      });
    }
  });

  return segments;
}

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
  error,
}: TaskStoryPanelProps) {
  const lines = story?.lines?.length ? story.lines : ["暂无剧情文本。"];
  const choices = story?.choices || [];
  const storySegments = buildStorySegments(lines);
  const shouldShowChoiceReplay = !showChoices && choices.length > 0 && inkAvailable;

  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <h3 className="text-base font-semibold text-[#EAF3FF]">现场对话与处理方案</h3>
        <p className="mt-1 text-xs text-[#8EA3B8]">先看现场冲突，再选择你的处理口径。</p>
      </div>

      <div className={`${playerCardBodyClass} space-y-4`}>
        {error && (
          <p className="rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[#FCA5A5]">
            {error}
          </p>
        )}

        {!inkAvailable && (
          <p className="rounded-lg border border-[rgba(250,204,21,0.35)] bg-[rgba(250,204,21,0.08)] px-4 py-3 text-sm text-[#FDE68A]">
            该任务尚未配置剧情，无法进入处理。
          </p>
        )}

        {inkAvailable && (
          <div className="rounded-xl border border-[rgba(60,160,255,0.16)] bg-[rgba(5,11,20,0.45)] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#2EA8FF]">现场记录</p>
                <p className="mt-0.5 text-xs text-[#8EA3B8]">已按发言和旁白整理，便于快速判断。</p>
              </div>
              <span className="rounded-full border border-[rgba(60,160,255,0.2)] px-2 py-0.5 text-xs text-[#8EA3B8]">
                {storySegments.length} 条
              </span>
            </div>

            <div className="space-y-3">
              {storySegments.map((segment) =>
                segment.type === "dialogue" ? (
                  <div key={segment.key} className="flex gap-3">
                    <div className="mt-5 flex size-8 shrink-0 items-center justify-center rounded-full border border-[rgba(60,160,255,0.28)] bg-[rgba(30,136,255,0.12)] text-xs font-semibold text-[#93C5FD]">
                      {segment.speaker.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="px-1 text-xs text-[#8EA3B8]">{segment.speaker}</p>
                      <p className="mt-1 rounded-2xl rounded-tl-sm border border-[rgba(60,160,255,0.18)] bg-[rgba(10,24,40,0.86)] px-4 py-3 text-[15px] leading-relaxed text-[#EAF3FF]">
                        {segment.text}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    key={segment.key}
                    className="rounded-xl border border-[rgba(142,163,184,0.14)] bg-[rgba(255,255,255,0.03)] px-4 py-3"
                  >
                    <p className="mb-1 text-xs text-[#8EA3B8]">现场旁白</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#C9D7E6]">
                      {segment.text}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {!isJoined && isActive && inkAvailable && (
          <div className="rounded-xl border border-[rgba(30,136,255,0.22)] bg-[rgba(30,136,255,0.08)] p-4">
            <p className="text-sm font-medium text-[#EAF3FF]">你还未加入该任务</p>
            <p className="mt-1 text-sm leading-relaxed text-[#8EA3B8]">
              加入后才能代表项目组提交处理方案。
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={onJoin}
              className="mt-3 flex h-11 w-full items-center justify-center rounded-lg bg-[#1E88FF] text-sm font-medium text-white hover:bg-[#2EA8FF] disabled:opacity-60"
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
          </div>
        )}

        {showChoices && choices.length > 0 && (
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-[#EAF3FF]">选择处理方案</h4>
              <p className="mt-1 text-xs text-[#8EA3B8]">不同方案会影响进度、风险、信任和关键节点。</p>
            </div>
            {choices.map((choice: TaskStoryChoice) => (
              <div
                key={choice.choiceId}
                className="rounded-xl border border-[rgba(60,160,255,0.22)] bg-[rgba(5,11,20,0.55)] px-4 py-3"
              >
                <div className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[rgba(30,136,255,0.16)] text-xs font-semibold text-[#93C5FD]">
                    {choice.index + 1}
                  </span>
                  <p className="min-w-0 flex-1 text-sm font-medium leading-relaxed text-[#EAF3FF]">
                    {choice.text}
                  </p>
                </div>
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

        {shouldShowChoiceReplay && (
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-[#EAF3FF]">当时可选方案</h4>
              <p className="mt-1 text-xs text-[#8EA3B8]">
                {isActive ? "你已提交或暂不可选择，以下为方案回看。" : "任务已结算，以下为当时的处理选项。"}
              </p>
            </div>
            <div className="grid gap-2">
              {choices.map((choice: TaskStoryChoice) => (
                <div
                  key={choice.choiceId}
                  className="flex gap-3 rounded-xl border border-[rgba(60,160,255,0.14)] bg-[rgba(5,11,20,0.36)] px-4 py-3"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[rgba(60,160,255,0.2)] text-xs text-[#8EA3B8]">
                    {choice.index + 1}
                  </span>
                  <p className="min-w-0 flex-1 text-sm leading-relaxed text-[#C9D7E6]">{choice.text}</p>
                </div>
              ))}
            </div>
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
