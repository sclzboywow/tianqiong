import Link from "next/link";
import { CheckCircle2, ChevronRight, Circle, Lock, LoaderCircle, Target } from "lucide-react";
import type { ChapterGoalItem } from "@/game/playerGuidanceEngine";
import { cn } from "@/lib/utils";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "./playerTheme";
import { taskDetailPanel, taskDetailPanelHeader } from "./tasks/taskBoardUi";

type ChapterMilestoneCardProps = {
  goals: ChapterGoalItem[];
  variant?: "default" | "hud";
};

function GoalIcon({ status }: { status: ChapterGoalItem["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="size-4 text-[#22C55E]" />;
    case "in_progress":
      return <LoaderCircle className="size-4 text-[#2EA8FF]" />;
    case "pending":
      return <Circle className="size-4 text-[#FACC15]" />;
    case "locked":
      return <Lock className="size-4 text-[#8EA3B8]" />;
  }
}

function statusTextClass(status: ChapterGoalItem["status"]) {
  switch (status) {
    case "completed":
      return "text-[#22C55E]";
    case "in_progress":
      return "text-[#2EA8FF]";
    case "pending":
      return "text-[#FACC15]";
    case "locked":
      return "text-[#8EA3B8]";
  }
}

export function ChapterMilestoneCard({ goals, variant = "default" }: ChapterMilestoneCardProps) {
  const doneCount = goals.filter((g) => g.status === "completed").length;
  const isHud = variant === "hud";

  return (
    <section className={cn(isHud ? taskDetailPanel : playerCardClass)}>
      <div
        className={cn(
          isHud
            ? `${taskDetailPanelHeader} flex items-center justify-between`
            : `${playerCardHeaderClass} flex items-center justify-between`,
        )}
      >
        <h3 className={cn("font-semibold text-cyan-50", isHud ? "flex items-center gap-2 text-[12px]" : "text-base")}>
          {isHud ? <Target className="size-3.5 text-cyan-400" /> : null}
          <span className={isHud ? "" : "lg:hidden"}>{isHud ? "阶段目标" : "关键节点"}</span>
          {!isHud ? <span className="hidden lg:inline">章节目标</span> : null}
        </h3>
        <span className={cn("text-xs", isHud ? "text-slate-500" : "text-[#8EA3B8] lg:hidden")}>
          {doneCount}/{goals.length}
        </span>
        {!isHud ? (
          <Link href="/project" className="text-xs text-[#2EA8FF] lg:hidden">
            查看全部
          </Link>
        ) : null}
        {!isHud ? (
          <span className="hidden text-xs text-[#8EA3B8] lg:inline">
            完成进度 {doneCount}/{goals.length}
          </span>
        ) : null}
      </div>

      <div className={isHud ? "p-3" : playerCardBodyClass}>
        <ul
          className={cn(
            isHud ? "divide-y divide-cyan-400/5" : "divide-y divide-[rgba(60,160,255,0.08)]",
          )}
        >
          {goals.map((item) => (
            <li
              key={item.key}
              className={cn(
                "flex min-h-[40px] items-center justify-between",
                isHud
                  ? "px-0.5 py-2 transition hover:bg-slate-950/25"
                  : "min-h-[52px] py-3 lg:min-h-0 lg:rounded-lg lg:px-2 lg:py-2.5 lg:hover:bg-[rgba(255,255,255,0.02)]",
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <GoalIcon status={item.status} />
                <span className={cn("truncate text-cyan-50", isHud ? "text-[13px]" : "text-[13px] lg:text-sm")}>
                  {item.label}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className={`text-xs ${statusTextClass(item.status)}`}>{item.statusLabel}</span>
                {item.status === "pending" && !isHud ? (
                  <ChevronRight className="size-4 text-[#8EA3B8] lg:hidden" />
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/project"
          className={cn(
            "mt-3 text-xs text-cyan-400 hover:text-cyan-300",
            isHud ? "inline-block" : "hidden lg:inline-block hover:underline",
          )}
        >
          查看全部目标 →
        </Link>
      </div>
    </section>
  );
}

/** @deprecated 使用 ChapterMilestoneCard */
export const ChapterProgressCard = ChapterMilestoneCard;
