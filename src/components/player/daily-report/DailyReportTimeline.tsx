import Link from "next/link";
import type { ReactNode } from "react";
import type { LogItem } from "@/game/dailyReportPresentationEngine";
import {
  taskDetailDivider,
  taskDetailPanel,
  taskDetailPanelHeader,
  taskDetailTagMuted,
  taskHudButtonDetailPrimary,
  taskHudButtonDetailSecondary,
} from "../tasks/taskBoardUi";
import { DailyReportLogCard } from "./DailyReportLogCard";

type DailyReportTimelineProps = {
  items: LogItem[];
  categoryChips: ReactNode | null;
  isArchiveEmpty: boolean;
  primaryAction?: { href: string; label: string };
};

export function DailyReportTimeline({
  items,
  categoryChips,
  isArchiveEmpty,
  primaryAction,
}: DailyReportTimelineProps) {
  const isFilteredEmpty = !isArchiveEmpty && items.length === 0;

  return (
    <section className={taskDetailPanel}>
      <div className={`${taskDetailPanelHeader} space-y-2`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[12px] font-medium text-cyan-100">今日时间线</h2>
            <p className="mt-0.5 text-[10px] text-slate-600">
              {isArchiveEmpty ? "完成行动后将自动归档至此" : "按发生顺序归档项目变化"}
            </p>
          </div>
          {!isArchiveEmpty ? (
            <span className={taskDetailTagMuted}>{items.length} 条</span>
          ) : null}
        </div>
        {categoryChips}
      </div>

      {isArchiveEmpty ? (
        <div className="px-3 py-4">
          <p className="text-[11px] text-slate-500">今日暂无新归档。</p>
          <p className="mt-0.5 text-[10px] text-slate-600">
            处理任务或在协同地图行动后，动态会出现在这里。
          </p>
          {primaryAction ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Link href={primaryAction.href} className={taskHudButtonDetailPrimary}>
                {primaryAction.label}
              </Link>
              <Link href="/locations" className={taskHudButtonDetailSecondary}>
                前往协同地图
              </Link>
            </div>
          ) : null}
        </div>
      ) : isFilteredEmpty ? (
        <div className="px-3 py-4">
          <p className="text-[11px] text-slate-500">该分类下暂无记录。</p>
          <p className="mt-0.5 text-[10px] text-slate-600">切换其他分类或查看全部日志。</p>
        </div>
      ) : (
        <div className="relative px-3 pb-2">
          <div className={`${taskDetailDivider} relative ml-0.5 border-l border-cyan-400/8 pl-3`}>
            {items.map((item) => (
              <div key={item.id} className="relative">
                <span className="absolute -left-[15px] top-3 size-1 bg-cyan-400/35" />
                <DailyReportLogCard item={item} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
