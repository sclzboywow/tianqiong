"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isFirstTaskResultHintSeen,
  markFirstTaskResultHintSeen,
} from "@/lib/onboardingStorage";
import {
  formatPlayerMetricEffectLinesFromRecord,
  sanitizePlayerLogContent,
  type PlayerEffectLine,
} from "@/game/taskEffectPlayerDisplay";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../../playerTheme";

export type TaskResolveResult = {
  finalized?: boolean;
  success?: boolean;
  finalChoiceId?: string;
  effects?: Record<string, number>;
  rewards?: { exp: number; gold: number; reputation: number; contribution: number };
};

type TaskResultPanelProps = {
  isCompleted: boolean;
  resolvedSuccess?: boolean;
  selectedChoiceText?: string | null;
  result: TaskResolveResult | null;
  milestoneLabels: string[];
  recentLogs: Array<{ id: string; content: string }>;
};

function EffectList({ lines }: { lines: PlayerEffectLine[] }) {
  if (lines.length === 0) return null;
  return (
    <ul className="space-y-1">
      {lines.map((line) => (
        <li
          key={line.text}
          className={cn(
            "text-sm",
            line.tone === "positive" && "text-[#22C55E]",
            line.tone === "negative" && "text-[#EF4444]",
            line.tone === "neutral" && "text-[#8EA3B8]",
          )}
        >
          · {line.text}
        </li>
      ))}
    </ul>
  );
}

export function TaskResultPanel({
  isCompleted,
  resolvedSuccess,
  selectedChoiceText,
  result,
  milestoneLabels,
  recentLogs,
}: TaskResultPanelProps) {
  const showResult = result?.finalized || isCompleted;
  const success = result?.success ?? resolvedSuccess;
  const effectLines = formatPlayerMetricEffectLinesFromRecord(result?.effects, 6);
  const [showFirstResultHint, setShowFirstResultHint] = useState(false);

  useEffect(() => {
    if (showResult && !isFirstTaskResultHintSeen()) {
      setShowFirstResultHint(true);
      markFirstTaskResultHintSeen();
    }
  }, [showResult]);

  return (
    <div className="space-y-4">
      <section className={playerCardClass}>
        <div className={playerCardHeaderClass}>
          <h3 className="text-base font-semibold text-[#EAF3FF]">结算摘要</h3>
        </div>
        <div className={playerCardBodyClass}>
          {!showResult ? (
            <p className="text-sm text-[#8EA3B8]">完成任务后将在此展示结果。</p>
          ) : (
            <div className="space-y-3">
              <p
                className={cn(
                  "text-base font-semibold",
                  success ? "text-[#22C55E]" : "text-[#EF4444]",
                )}
              >
                {success ? "处理成功" : "处理失败"}
              </p>

              {selectedChoiceText && (
                <p className="text-sm text-[#8EA3B8]">你的方案：{selectedChoiceText}</p>
              )}

              {result?.rewards && (
                <div className="rounded-lg border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.08)] px-3 py-2 text-sm text-[#86EFAC]">
                  经验 +{result.rewards.exp} · 金币 +{result.rewards.gold} · 声望 +
                  {result.rewards.reputation} · 贡献 +{result.rewards.contribution}
                </div>
              )}

              {effectLines.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs text-[#8EA3B8]">项目指标变化</p>
                  <EffectList lines={effectLines} />
                </div>
              )}

              {milestoneLabels.length > 0 && success && (
                <div>
                  <p className="mb-1.5 text-xs text-[#8EA3B8]">完成关键节点</p>
                  <ul className="space-y-1">
                    {milestoneLabels.map((label) => (
                      <li key={label} className="text-sm text-[#2EA8FF]">
                        · {label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {showFirstResultHint && (
                <p className="text-sm leading-relaxed text-[#93C5FD]">
                  项目指标和章节目标已更新，可返回指挥中心查看下一步行动。
                </p>
              )}

              {showResult && (
                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/project"
                    className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-[#1E88FF] px-4 text-sm font-medium text-white hover:bg-[#2EA8FF]"
                  >
                    <LayoutDashboard className="size-4" />
                    返回指挥中心
                  </Link>
                  <Link
                    href="/tasks"
                    className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-[rgba(60,160,255,0.25)] px-4 text-sm text-[#EAF3FF] hover:border-[#2EA8FF]"
                  >
                    返回任务台
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/locations"
                    className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-[rgba(60,160,255,0.25)] px-4 text-sm text-[#EAF3FF] hover:border-[#2EA8FF]"
                  >
                    <Compass className="size-4" />
                    前往协同地图
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {recentLogs.length > 0 && (
        <section className={playerCardClass}>
          <div className={playerCardHeaderClass}>
            <h3 className="text-base font-semibold text-[#EAF3FF]">相关记录</h3>
          </div>
          <div className={playerCardBodyClass}>
            <ul className="space-y-2 text-[13px] leading-relaxed text-[#EAF3FF]/90">
              {recentLogs.map((log) => (
                <li key={log.id}>{sanitizePlayerLogContent(log.content)}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
