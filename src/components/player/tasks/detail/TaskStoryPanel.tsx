"use client";

import { useState } from "react";
import type { TaskStoryState } from "@/game/taskDetailPresentationEngine";
import { buildStorySegments, type StorySegment } from "@/game/storySegmentParser";
import { ScrollText } from "lucide-react";
import {
  taskDetailDivider,
  taskDetailPanel,
  taskDetailPanelHeader,
  taskDetailTagMuted,
} from "../taskBoardUi";
import {
  TaskDetailExpandButton,
  buildFieldSummary,
  pickKeyStorySegments,
} from "./taskDetailExpand";

type TaskStoryPanelProps = {
  story: TaskStoryState | null;
  inkAvailable: boolean;
};

function StorySegmentRow({ segment }: { segment: StorySegment }) {
  if (segment.type === "dialogue") {
    return (
      <div className="px-3 py-2.5">
        <span className="text-[9px] text-slate-600">{segment.speaker}</span>
        <p className="mt-0.5 text-[12px] leading-[1.5] text-slate-200">{segment.text}</p>
      </div>
    );
  }

  return (
    <div className="px-3 py-2.5">
      <span className="text-[9px] text-slate-700">旁白</span>
      <p className="mt-0.5 whitespace-pre-wrap text-[12px] leading-[1.5] text-slate-300">
        {segment.text}
      </p>
    </div>
  );
}

export function TaskStoryPanel({ story, inkAvailable }: TaskStoryPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!inkAvailable) {
    return (
      <section className={taskDetailPanel}>
        <div className={taskDetailPanelHeader}>
          <h3 className="flex items-center gap-2 text-[12px] font-medium text-cyan-100">
            <ScrollText className="size-3.5 text-cyan-400/80" />
            现场记录
          </h3>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[11px] text-slate-600">暂无现场记录。</p>
        </div>
      </section>
    );
  }

  const lines = story?.lines?.length ? story.lines : ["暂无剧情文本。"];
  const storySegments = buildStorySegments(lines);
  const keySegments = pickKeyStorySegments(storySegments, 3);
  const visibleSegments = expanded ? storySegments : keySegments;
  const hasMore = storySegments.length > keySegments.length;

  return (
    <section className={taskDetailPanel}>
      <div className={`${taskDetailPanelHeader} flex items-center justify-between gap-2`}>
        <h3 className="flex items-center gap-2 text-[12px] font-medium text-cyan-100">
          <ScrollText className="size-3.5 text-cyan-400/80" />
          现场记录
        </h3>
        <span className={taskDetailTagMuted}>{storySegments.length} 条</span>
      </div>

      <div className="space-y-2 px-3 py-2.5">
        <div>
          <p className="mb-0.5 text-[10px] font-medium text-slate-600">现场摘要</p>
          <p className="text-[11px] leading-[1.5] text-slate-400">{buildFieldSummary(storySegments)}</p>
        </div>

        {!expanded && keySegments.length > 0 ? (
          <div>
            <p className="mb-1 text-[10px] font-medium text-slate-600">关键记录</p>
            <div className={`${taskDetailDivider} bg-slate-950/10`}>
              {keySegments.map((segment) => (
                <StorySegmentRow key={segment.key} segment={segment} />
              ))}
            </div>
          </div>
        ) : null}

        {expanded ? (
          <div className={`${taskDetailDivider} bg-slate-950/10`}>
            {visibleSegments.map((segment) => (
              <StorySegmentRow key={segment.key} segment={segment} />
            ))}
          </div>
        ) : null}

        {hasMore ? (
          <TaskDetailExpandButton
            expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            expandLabel={`展开完整现场记录（${storySegments.length}条）`}
          />
        ) : null}
      </div>
    </section>
  );
}
