import Link from "next/link";
import { CheckCircle2, ChevronRight, Circle, Lock, LoaderCircle } from "lucide-react";
import type { ChapterGoalItem } from "@/game/playerGuidanceEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "./playerTheme";

type ChapterMilestoneCardProps = {
  goals: ChapterGoalItem[];
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

export function ChapterMilestoneCard({ goals }: ChapterMilestoneCardProps) {
  const doneCount = goals.filter((g) => g.status === "completed").length;

  return (
    <section className={playerCardClass}>
      <div className={`${playerCardHeaderClass} flex items-center justify-between`}>
        <h3 className="text-base font-semibold text-[#EAF3FF]">
          <span className="lg:hidden">关键节点</span>
          <span className="hidden lg:inline">章节目标</span>
        </h3>
        <span className="text-xs text-[#8EA3B8] lg:hidden">
          {doneCount}/{goals.length}
        </span>
        <Link href="/project" className="text-xs text-[#2EA8FF] lg:hidden">
          查看全部
        </Link>
        <span className="hidden text-xs text-[#8EA3B8] lg:inline">
          完成进度 {doneCount}/{goals.length}
        </span>
      </div>

      <div className={playerCardBodyClass}>
        <ul className="divide-y divide-[rgba(60,160,255,0.08)]">
          {goals.map((item) => (
            <li
              key={item.key}
              className="flex min-h-[52px] items-center justify-between py-3 lg:min-h-0 lg:rounded-lg lg:px-2 lg:py-2.5 lg:hover:bg-[rgba(255,255,255,0.02)]"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <GoalIcon status={item.status} />
                <span className="truncate text-[13px] text-[#EAF3FF] lg:text-sm">{item.label}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className={`text-xs ${statusTextClass(item.status)}`}>
                  {item.statusLabel}
                </span>
                {item.status === "pending" ? (
                  <ChevronRight className="size-4 text-[#8EA3B8] lg:hidden" />
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/project"
          className="mt-3 hidden text-xs text-[#2EA8FF] hover:underline lg:inline-block"
        >
          查看全部目标 →
        </Link>
      </div>
    </section>
  );
}

/** @deprecated 使用 ChapterMilestoneCard */
export const ChapterProgressCard = ChapterMilestoneCard;
