import Link from "next/link";
import { ArrowRight, ClipboardList, Radio, Target } from "lucide-react";
import type { RecommendedTaskBoardItem } from "@/game/taskPresentationEngine";
import { playerCardClass } from "../playerTheme";

type TaskBoardRecommendedCardProps = {
  item: RecommendedTaskBoardItem;
};

export function TaskBoardRecommendedCard({ item }: TaskBoardRecommendedCardProps) {
  const actionLabel = item.task.type === "emergency" ? "立即处理突发" : "进入任务处理";

  return (
    <section
      className={`${playerCardClass} relative overflow-hidden border-[#2EA8FF] shadow-[0_0_22px_rgba(30,136,255,0.14)]`}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-[#2EA8FF]" />
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:p-5">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-xs font-medium text-[#2EA8FF]">
            <Radio className="size-4" />
            当前优先处理
          </p>
          <h2 className="mt-2 text-xl font-semibold leading-tight text-[#EAF3FF]">
            {item.task.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#8EA3B8]">
            指挥建议：{item.reason}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[rgba(60,160,255,0.18)] bg-[rgba(5,11,20,0.45)] px-3 py-1 text-[#C9D7E6]">
              {item.task.typeLabel}
            </span>
            <span className="rounded-full border border-[rgba(60,160,255,0.18)] bg-[rgba(5,11,20,0.45)] px-3 py-1 text-[#C9D7E6]">
              成功率 {Math.round(item.task.baseSuccessRate)}%
            </span>
            {item.task.milestoneLabels.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(30,136,255,0.25)] bg-[rgba(30,136,255,0.1)] px-3 py-1 text-[#2EA8FF]">
                <Target className="size-3" />
                关联关键节点
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[rgba(60,160,255,0.14)] bg-[rgba(5,11,20,0.42)] p-4">
          <p className="text-xs text-[#8EA3B8]">下一步</p>
          <p className="mt-1 text-sm leading-relaxed text-[#EAF3FF]">
            进入任务详情，阅读现场情况并提交处理方案。
          </p>
          <Link
            href={item.task.href}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#1E88FF] px-5 text-sm font-medium text-white hover:bg-[#2EA8FF]"
          >
            {actionLabel}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

type TaskBoardHeaderProps = {
  stageName: string;
  totalActive: number;
};

export function TaskBoardHeader({ stageName, totalActive }: TaskBoardHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-[rgba(60,160,255,0.16)] bg-[radial-gradient(circle_at_top_left,rgba(30,136,255,0.16),rgba(5,11,20,0.72)_42%,rgba(5,11,20,0.9))] p-4 lg:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-[#2EA8FF]">
            <ClipboardList className="size-5" />
            <p className="text-xs font-medium">项目调度 / 任务队列</p>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EAF3FF] lg:text-3xl">
            任务调度台
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8EA3B8]">
            这里不是资料列表。先处理会卡阶段目标的主线任务，再处理突发风险和协作事项。
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <div className="rounded-xl border border-[rgba(60,160,255,0.16)] bg-[rgba(5,11,20,0.42)] px-4 py-3">
            <p className="text-xs text-[#8EA3B8]">当前阶段</p>
            <p className="mt-1 text-sm font-semibold text-[#EAF3FF]">{stageName}</p>
          </div>
          <div className="rounded-xl border border-[rgba(60,160,255,0.16)] bg-[rgba(5,11,20,0.42)] px-4 py-3">
            <p className="text-xs text-[#8EA3B8]">待处理</p>
            <p className="mt-1 text-sm font-semibold text-[#2EA8FF]">{totalActive} 项</p>
          </div>
        </div>
      </div>
    </header>
  );
}
