import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskDetailViewData } from "@/game/taskDetailPresentationEngine";

type TaskDetailHeaderProps = {
  data: TaskDetailViewData;
};

function typeBadgeClass(type: TaskDetailViewData["type"]) {
  switch (type) {
    case "mainline":
      return "border-[rgba(30,136,255,0.35)] bg-[rgba(30,136,255,0.12)] text-[#2EA8FF]";
    case "emergency":
      return "border-[rgba(250,204,21,0.35)] bg-[rgba(250,204,21,0.1)] text-[#FACC15]";
    case "collaboration":
      return "border-[rgba(168,85,247,0.35)] bg-[rgba(168,85,247,0.1)] text-[#C084FC]";
    case "completed":
      return "border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.5)] text-[#8EA3B8]";
  }
}

export function TaskDetailHeader({ data }: TaskDetailHeaderProps) {
  return (
    <header className="space-y-3">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1 text-sm text-[#8EA3B8] hover:text-[#2EA8FF]"
      >
        <ChevronLeft className="size-4" />
        返回任务台
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs", typeBadgeClass(data.type))}>
            {data.typeLabel}
          </span>
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs",
              data.isCompleted
                ? "border-[rgba(60,160,255,0.18)] text-[#8EA3B8]"
                : "border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.1)] text-[#22C55E]",
            )}
          >
            {data.statusLabel}
          </span>
          <span className="rounded-full border border-[rgba(60,160,255,0.18)] px-2.5 py-0.5 text-xs text-[#8EA3B8]">
            任务等级 {data.rarity}
          </span>
        </div>
        <h1 className="mt-2 text-xl font-semibold text-[#EAF3FF] lg:text-2xl">{data.title}</h1>
        <p className="mt-1 text-sm text-[#8EA3B8]">
          来源：{data.sourceName} · 阶段：{data.stageName}
        </p>
      </div>
    </header>
  );
}
