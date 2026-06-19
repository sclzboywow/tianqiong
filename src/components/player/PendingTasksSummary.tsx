import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import type { PendingTaskGroup } from "@/game/playerGuidanceEngine";
import {
  taskDetailDivider,
  taskDetailPanel,
  taskDetailPanelHeader,
  taskHudButtonCompactPrimary,
  taskHudButtonCompactSecondary,
} from "./tasks/taskBoardUi";

type PendingTasksSummaryProps = {
  groups: PendingTaskGroup;
  maxItems?: number;
  locationHrefByTaskId?: Record<string, string>;
};

type DisplayTask = {
  id: string;
  title: string;
  area: string;
  href: string;
  tag: string;
  tagTone: "mainline" | "emergency";
  urgency?: string;
  locationHref?: string;
};

function buildDisplayTasks(
  groups: PendingTaskGroup,
  maxItems: number,
  locationHrefByTaskId?: Record<string, string>,
): DisplayTask[] {
  const items: DisplayTask[] = [];

  for (const task of groups.mainline) {
    if (items.length >= maxItems) break;
    items.push({
      id: task.id,
      title: task.title,
      area: task.area,
      href: task.href,
      tag: "主线",
      tagTone: "mainline",
      locationHref: locationHrefByTaskId?.[task.id],
    });
  }

  for (const task of groups.emergency) {
    if (items.length >= maxItems) break;
    items.push({
      id: task.id,
      title: task.title,
      area: task.area,
      href: task.href,
      tag: "突发",
      tagTone: "emergency",
      urgency: task.urgency,
      locationHref: locationHrefByTaskId?.[task.id],
    });
  }

  return items;
}

function TaskCompactRow({ task }: { task: DisplayTask }) {
  const hasLocationHref = Boolean(task.locationHref);

  return (
    <li className="relative py-2.5 pl-2.5 transition hover:bg-slate-950/20">
      <span
        className={`absolute bottom-2 left-0 top-2 w-px ${
          task.tagTone === "mainline" ? "bg-cyan-400/35" : "bg-amber-400/35"
        }`}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
            <span
              className={
                task.tagTone === "mainline" ? "text-cyan-400/75" : "text-amber-200/80"
              }
            >
              {task.tag}
            </span>
            {task.urgency ? (
              <span className="text-rose-300/75">紧急度 {task.urgency}</span>
            ) : null}
            <span className="truncate text-slate-600">{task.area}</span>
          </div>
          <p className="truncate text-sm font-medium text-cyan-50">{task.title}</p>
        </div>

        <div className="flex shrink-0 gap-1.5">
          {hasLocationHref ? (
            <Link href={task.locationHref!} className={taskHudButtonCompactSecondary}>
              <MapPin className="size-3 shrink-0" />
              前往地点
            </Link>
          ) : null}
          <Link href={task.href} className={taskHudButtonCompactPrimary}>
            任务详情
            <ArrowRight className="size-3 shrink-0" />
          </Link>
        </div>
      </div>
    </li>
  );
}

export function PendingTasksSummary({
  groups,
  maxItems = 3,
  locationHrefByTaskId,
}: PendingTasksSummaryProps) {
  const total = groups.mainline.length + groups.emergency.length;
  const displayTasks = buildDisplayTasks(groups, maxItems, locationHrefByTaskId);

  return (
    <section className={taskDetailPanel}>
      <div className={`${taskDetailPanelHeader} flex items-center justify-between gap-2`}>
        <h3 className="text-sm font-medium text-cyan-100">待处理卡点</h3>
        {total > 0 ? <span className="text-[11px] text-slate-500">{total} 项</span> : null}
      </div>

      <div className="p-3">
        {total === 0 ? (
          <p className="text-xs text-slate-500">
            暂无待处理卡点，可跟随当前指令前往地点触发新任务。
          </p>
        ) : (
          <ul className={taskDetailDivider}>
            {displayTasks.map((task) => (
              <TaskCompactRow key={task.id} task={task} />
            ))}
          </ul>
        )}

        {total > 0 ? (
          <Link href="/tasks" className="mt-3 inline-block text-xs text-cyan-400/80 hover:text-cyan-300">
            查看全部任务 ({total}) →
          </Link>
        ) : null}
      </div>
    </section>
  );
}

/** @deprecated 命名对齐 PendingTaskCard，暂保留此导出 */
export const PendingTaskCard = PendingTasksSummary;
