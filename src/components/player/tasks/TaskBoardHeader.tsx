import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import type { RecommendedTaskBoardItem } from "@/game/taskPresentationEngine";
import { playerCardClass } from "../playerTheme";

type TaskBoardRecommendedCardProps = {
  item: RecommendedTaskBoardItem;
};

export function TaskBoardRecommendedCard({ item }: TaskBoardRecommendedCardProps) {
  return (
    <section
      className={`${playerCardClass} border-[#2EA8FF] p-4 shadow-[0_0_16px_rgba(30,136,255,0.12)] lg:p-5`}
    >
      <p className="text-xs text-[#2EA8FF]">推荐处理</p>
      <h2 className="mt-1 text-lg font-semibold text-[#EAF3FF]">{item.task.title}</h2>
      <p className="mt-1 text-sm text-[#8EA3B8]">原因：{item.reason}</p>
      <Link
        href={item.task.href}
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[#1E88FF] px-5 text-sm font-medium text-white hover:bg-[#2EA8FF]"
      >
        {item.task.type === "emergency" ? "立即处理" : "处理任务"}
        <ArrowRight className="size-4" />
      </Link>
    </section>
  );
}

type TaskBoardHeaderProps = {
  stageName: string;
  totalActive: number;
};

export function TaskBoardHeader({ stageName, totalActive }: TaskBoardHeaderProps) {
  return (
    <header className="space-y-3">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[#2EA8FF]">
          <ClipboardList className="size-5" />
          <h1 className="text-xl font-semibold text-[#EAF3FF] lg:text-2xl">任务台</h1>
        </div>
        <p className="text-sm text-[#8EA3B8]">
          处理主线任务、突发事件与协作事项，推动项目阶段前进。
        </p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-[rgba(60,160,255,0.18)] bg-[rgba(5,11,20,0.5)] px-3 py-1.5 text-[#EAF3FF]">
          当前阶段：{stageName}
        </span>
        <span className="rounded-full border border-[rgba(60,160,255,0.18)] bg-[rgba(5,11,20,0.5)] px-3 py-1.5 text-[#8EA3B8]">
          待处理 {totalActive} 项
        </span>
      </div>
    </header>
  );
}
