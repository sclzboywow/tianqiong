"use client";

import type { StorySegment } from "@/game/storySegmentParser";
import { taskDetailExpandButton } from "../taskBoardUi";

type TaskDetailExpandButtonProps = {
  expanded: boolean;
  onClick: () => void;
  expandLabel: string;
  collapseLabel?: string;
};

export function TaskDetailExpandButton({
  expanded,
  onClick,
  expandLabel,
  collapseLabel = "收起",
}: TaskDetailExpandButtonProps) {
  return (
    <button type="button" onClick={onClick} className={`${taskDetailExpandButton} mt-1.5 text-left`}>
      {expanded ? collapseLabel : expandLabel}
    </button>
  );
}

export function pickKeyStorySegments(segments: StorySegment[], limit = 3): StorySegment[] {
  const dialogues = segments.filter((segment) => segment.type === "dialogue");
  const narrations = segments.filter((segment) => segment.type === "narration");
  const selectedKeys = new Set<string>();

  for (const segment of dialogues) {
    if (selectedKeys.size >= limit) break;
    selectedKeys.add(segment.key);
  }
  for (const segment of narrations) {
    if (selectedKeys.size >= limit) break;
    selectedKeys.add(segment.key);
  }

  return segments.filter((segment) => selectedKeys.has(segment.key));
}

export function buildFieldSummary(segments: StorySegment[]): string {
  const firstNarration = segments.find((segment) => segment.type === "narration");
  if (firstNarration) {
    const text = firstNarration.text.trim();
    return text.length > 100 ? `${text.slice(0, 100)}…` : text;
  }

  const firstDialogue = segments.find((segment) => segment.type === "dialogue");
  if (firstDialogue && firstDialogue.type === "dialogue") {
    const preview = firstDialogue.text.trim();
    const clipped = preview.length > 72 ? `${preview.slice(0, 72)}…` : preview;
    return `${firstDialogue.speaker}：${clipped}`;
  }

  return segments.length > 0 ? `现场共 ${segments.length} 条记录，展开可查看完整纪要。` : "暂无现场摘要。";
}
