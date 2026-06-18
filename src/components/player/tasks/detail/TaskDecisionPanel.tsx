"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, Compass, LayoutDashboard, LoaderCircle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskDetailViewData, TaskStoryChoice } from "@/game/taskDetailPresentationEngine";
import {
  formatPlayerMetricEffectLinesFromRecord,
  type PlayerEffectLine,
} from "@/game/taskEffectPlayerDisplay";
import {
  isFirstTaskResultHintSeen,
  markFirstTaskResultHintSeen,
} from "@/lib/onboardingStorage";
import {
  taskDetailDivider,
  taskDetailPanel,
  taskDetailPanelHeader,
  taskDetailTag,
  taskHudButtonAction,
  taskHudButtonActionCompact,
  taskHudButtonDetailPrimary,
  taskHudButtonDetailSecondary,
} from "../taskBoardUi";
import { TaskDetailExpandButton } from "./taskDetailExpand";

const CHOICE_PREVIEW_LIMIT = 3;
const PARTICIPANT_PREVIEW_LIMIT = 3;

export type TaskResolveResult = {
  finalized?: boolean;
  success?: boolean;
  finalChoiceId?: string;
  effects?: Record<string, number>;
  rewards?: { exp: number; gold: number; reputation: number; contribution: number };
};

type TaskDecisionPanelProps = {
  data: TaskDetailViewData;
  choices: TaskStoryChoice[];
  loading: boolean;
  error: string | null;
  onJoin: () => void;
  onChoose: (choiceId: string, choiceText: string) => void;
  pending: {
    message: string;
    submittedCount: number;
    requiredCount: number;
  } | null;
  showChoices: boolean;
  selectedChoiceText: string | null;
  result: TaskResolveResult | null;
};

function subscribeToResultHintStore() {
  return () => {};
}

function EffectList({ lines }: { lines: PlayerEffectLine[] }) {
  if (lines.length === 0) return null;
  return (
    <ul className="space-y-1">
      {lines.map((line) => (
        <li
          key={line.text}
          className={cn(
            "text-[13px] leading-5",
            line.tone === "positive" && "text-emerald-400",
            line.tone === "negative" && "text-red-400",
            line.tone === "neutral" && "text-slate-500",
          )}
        >
          · {line.text}
        </li>
      ))}
    </ul>
  );
}

function ParticipantProgress({ data }: { data: TaskDetailViewData }) {
  const [expanded, setExpanded] = useState(false);

  if (data.participants.length === 0) return null;

  const hiddenCount = Math.max(0, data.participants.length - PARTICIPANT_PREVIEW_LIMIT);
  const visibleParticipants = expanded
    ? data.participants
    : data.participants.slice(0, PARTICIPANT_PREVIEW_LIMIT);

  return (
    <div className="pt-2">
      <p className="mb-1.5 text-[11px] text-slate-500">参与进度</p>
      <ul className={`${taskDetailDivider} bg-slate-950/15`}>
        {visibleParticipants.map((participant) => (
          <li
            key={participant.id}
            className="flex items-center justify-between px-1 py-1.5 text-[11px]"
          >
            <span className="text-slate-400">
              {participant.nickname} · {participant.jobLabel}
            </span>
            <span
              className={cn(
                taskDetailTag,
                participant.hasSubmitted ? "text-emerald-300/90" : "text-slate-500",
              )}
            >
              {participant.hasSubmitted ? "已提交" : "未提交"}
            </span>
          </li>
        ))}
      </ul>
      {hiddenCount > 0 ? (
        <TaskDetailExpandButton
          expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          expandLabel={expanded ? "收起参与者" : `还有 ${hiddenCount} 人 · 展开全部`}
          collapseLabel="收起参与者"
        />
      ) : null}
    </div>
  );
}

function ChoiceOptionRow({
  choice,
  loading,
  onChoose,
}: {
  choice: TaskStoryChoice;
  loading: boolean;
  onChoose: (choiceId: string, choiceText: string) => void;
}) {
  return (
    <div className="flex items-start gap-2 px-1 py-2">
      <span className="w-4 shrink-0 pt-0.5 text-center text-[10px] tabular-nums text-cyan-400/50">
        {choice.index + 1}
      </span>
      <p className="min-w-0 flex-1 text-[13px] leading-[1.45] text-slate-200">{choice.text}</p>
      <button
        type="button"
        disabled={loading}
        onClick={() => onChoose(choice.choiceId, choice.text)}
        className={taskHudButtonActionCompact}
      >
        {loading ? <LoaderCircle className="size-3.5 animate-spin" /> : "提交"}
      </button>
    </div>
  );
}

export function TaskDecisionPanel({
  data,
  choices,
  loading,
  error,
  onJoin,
  onChoose,
  pending,
  showChoices,
  selectedChoiceText,
  result,
}: TaskDecisionPanelProps) {
  const [choicesExpanded, setChoicesExpanded] = useState(false);
  const [replayExpanded, setReplayExpanded] = useState(false);

  const showResult = result?.finalized || data.isCompleted;
  const success = result?.success ?? data.resolvedSuccess;
  const effectLines = formatPlayerMetricEffectLinesFromRecord(result?.effects, 6);
  const shouldShowChoiceReplay =
    data.inkAvailable &&
    choices.length > 0 &&
    !showChoices &&
    (data.hasSubmitted || !data.isActive || showResult);

  const firstTaskResultHintSeen = useSyncExternalStore(
    subscribeToResultHintStore,
    isFirstTaskResultHintSeen,
    () => true,
  );
  const showFirstResultHint = showResult && !firstTaskResultHintSeen;

  useEffect(() => {
    if (showFirstResultHint) {
      markFirstTaskResultHintSeen();
    }
  }, [showFirstResultHint]);

  return (
    <section className={taskDetailPanel}>
      <div className={taskDetailPanelHeader}>
        <h3 className="text-sm font-medium text-cyan-100">
          {showResult ? "结算结果" : pending ? "等待协作" : showChoices ? "处理方案" : "任务处理"}
        </h3>
      </div>

      <div className="space-y-3 p-3">
        {error && (
          <p className="bg-red-950/25 px-3 py-2 text-[11px] text-red-300">{error}</p>
        )}

        {!data.inkAvailable && data.isActive && (
          <p className="bg-amber-950/20 px-3 py-2 text-[11px] text-amber-100/85">
            该任务尚未配置剧情，无法进入处理。
          </p>
        )}

        {showResult ? (
          <div className="space-y-3">
            <p
              className={cn(
                "text-sm font-semibold",
                success ? "text-emerald-400" : "text-red-400",
              )}
            >
              {success ? "处理成功" : "处理失败"}
            </p>

            {selectedChoiceText && (
              <p className="text-xs text-slate-500">你的方案：{selectedChoiceText}</p>
            )}

            {result?.rewards && (
              <div className="bg-emerald-950/15 px-3 py-2 text-[11px] text-emerald-300/90">
                经验 +{result.rewards.exp} · 金币 +{result.rewards.gold} · 声望 +
                {result.rewards.reputation} · 贡献 +{result.rewards.contribution}
              </div>
            )}

            {effectLines.length > 0 && (
              <div>
                <p className="mb-1 text-[11px] text-slate-500">项目指标变化</p>
                <EffectList lines={effectLines} />
              </div>
            )}

            {data.milestoneLabels.length > 0 && success && (
              <div>
                <p className="mb-1 text-[11px] text-slate-500">完成关键节点</p>
                <ul className="space-y-1">
                  {data.milestoneLabels.map((label) => (
                    <li key={label} className="text-xs text-cyan-300">
                      · {label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {showFirstResultHint && (
              <p className="text-[13px] leading-5 text-cyan-300/80">
                项目指标和章节目标已更新，可返回指挥中心查看下一步行动。
              </p>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <Link href="/tasks" className={`${taskHudButtonDetailPrimary} w-full`}>
                返回任务调度台
                <ArrowRight className="size-4 shrink-0" />
              </Link>
              {data.sourceLocationName && data.locationHref ? (
                <Link href={data.locationHref} className={`${taskHudButtonDetailSecondary} w-full`}>
                  <MapPin className="size-4 shrink-0" />
                  前往地点：{data.sourceLocationName}
                </Link>
              ) : (
                <Link href="/locations" className={`${taskHudButtonDetailSecondary} w-full`}>
                  <Compass className="size-4 shrink-0" />
                  前往协同地图
                </Link>
              )}
              <Link href="/project" className={`${taskHudButtonDetailSecondary} w-full`}>
                <LayoutDashboard className="size-4 shrink-0" />
                返回指挥中心
              </Link>
            </div>
          </div>
        ) : pending ? (
          <div className="space-y-3">
            <p className="text-[13px] text-cyan-100">{pending.message}</p>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">提交进度</span>
              <span className="tabular-nums text-cyan-200">
                {pending.submittedCount}/{pending.requiredCount}
              </span>
            </div>
            {selectedChoiceText && (
              <p className="text-xs text-slate-500">已选方案：{selectedChoiceText}</p>
            )}
            <ParticipantProgress data={data} />
          </div>
        ) : !data.isJoined && data.isActive && data.inkAvailable ? (
          <div className="space-y-3">
            <p className="text-[13px] text-cyan-50">加入任务并开始处理</p>
            <p className="text-[13px] leading-5 text-slate-500">
              加入后可代表项目组选择处理方案并提交结算。
            </p>
            <button type="button" disabled={loading} onClick={onJoin} className={taskHudButtonAction}>
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
        ) : showChoices && choices.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">选择方案并提交</p>
            <div className={`${taskDetailDivider} bg-slate-950/15`}>
              {(choicesExpanded ? choices : choices.slice(0, CHOICE_PREVIEW_LIMIT)).map((choice) => (
                <ChoiceOptionRow
                  key={choice.choiceId}
                  choice={choice}
                  loading={loading}
                  onChoose={onChoose}
                />
              ))}
            </div>
            {choices.length > CHOICE_PREVIEW_LIMIT ? (
              <TaskDetailExpandButton
                expanded={choicesExpanded}
                onClick={() => setChoicesExpanded((value) => !value)}
                expandLabel={`展开全部方案（${choices.length}个）`}
                collapseLabel="收起方案"
              />
            ) : null}
            <ParticipantProgress data={data} />
          </div>
        ) : data.isJoined && data.isActive && data.hasSubmitted ? (
          <div className="space-y-3">
            <p className="text-[13px] text-cyan-100">你已提交方案，等待协作结算。</p>
            <ParticipantProgress data={data} />
          </div>
        ) : data.isJoined && data.isActive && !data.inkAvailable ? (
          <p className="text-xs text-slate-500">任务进行中，暂无可用处理方案。</p>
        ) : !data.isActive ? (
          <p className="text-xs text-slate-500">任务已结束，可在上方查看结算结果。</p>
        ) : null}

        {shouldShowChoiceReplay && !showResult && (
          <div className="space-y-1 pt-2">
            <p className="text-[11px] text-slate-500">
              {data.isActive ? "方案回看" : "当时可选方案"}
            </p>
            <div className={`${taskDetailDivider} bg-slate-950/10`}>
              {(replayExpanded ? choices : choices.slice(0, CHOICE_PREVIEW_LIMIT)).map((choice) => (
                <div key={choice.choiceId} className="flex gap-2 px-1 py-2">
                  <span className="w-4 shrink-0 text-center text-[10px] tabular-nums text-slate-600">
                    {choice.index + 1}
                  </span>
                  <p className="min-w-0 flex-1 text-[13px] leading-[1.45] text-slate-400">
                    {choice.text}
                  </p>
                </div>
              ))}
            </div>
            {choices.length > CHOICE_PREVIEW_LIMIT ? (
              <TaskDetailExpandButton
                expanded={replayExpanded}
                onClick={() => setReplayExpanded((value) => !value)}
                expandLabel={`展开全部方案（${choices.length}个）`}
                collapseLabel="收起方案"
              />
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
