import type { TaskStoryState } from "@/game/taskDetailPresentationEngine";
import { buildStorySegments } from "@/game/storySegmentParser";
import { ScrollText } from "lucide-react";
import { taskHudPanel, taskHudPanelHeader, taskHudTag } from "../taskBoardUi";

type TaskStoryPanelProps = {
  story: TaskStoryState | null;
  inkAvailable: boolean;
};

export function TaskStoryPanel({ story, inkAvailable }: TaskStoryPanelProps) {
  if (!inkAvailable) {
    return (
      <section className={taskHudPanel}>
        <div className={taskHudPanelHeader}>
          <h3 className="flex items-center gap-2 text-[12px] font-medium text-cyan-100">
            <ScrollText className="size-3.5 text-cyan-400" />
            现场记录
          </h3>
        </div>
        <div className="p-3">
          <p className="text-[11px] text-slate-600">暂无现场记录。</p>
        </div>
      </section>
    );
  }

  const lines = story?.lines?.length ? story.lines : ["暂无剧情文本。"];
  const storySegments = buildStorySegments(lines);

  return (
    <section className={taskHudPanel}>
      <div className={`${taskHudPanelHeader} flex items-center justify-between gap-2`}>
        <h3 className="flex items-center gap-2 text-[12px] font-medium text-cyan-100">
          <ScrollText className="size-3.5 text-cyan-400" />
          现场记录
        </h3>
        <span className={`${taskHudTag} border-slate-600/30 text-slate-500`}>
          {storySegments.length} 条
        </span>
      </div>

      <div className="divide-y divide-cyan-400/10">
        {storySegments.map((segment) =>
          segment.type === "dialogue" ? (
            <div key={segment.key} className="px-3 py-2">
              <div className="flex items-baseline gap-2">
                <span className="shrink-0 text-[10px] font-medium text-cyan-400/80">
                  {segment.speaker}
                </span>
                <span className="text-[10px] text-slate-600">发言</span>
              </div>
              <p className="mt-0.5 text-[11px] leading-5 text-slate-300">{segment.text}</p>
            </div>
          ) : (
            <div key={segment.key} className="px-3 py-2">
              <span className="text-[10px] text-slate-600">旁白</span>
              <p className="mt-0.5 whitespace-pre-wrap text-[11px] leading-5 text-slate-400">
                {segment.text}
              </p>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
