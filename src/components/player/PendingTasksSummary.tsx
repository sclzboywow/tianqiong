import Link from "next/link";
import type { PendingTaskGroup } from "@/game/playerGuidanceEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "./playerTheme";

type PendingTasksSummaryProps = {
  groups: PendingTaskGroup;
  maxItems?: number;
};

function TaskRow({
  title,
  area,
  href,
  tag,
  tagClass,
  buttonLabel,
  buttonClass,
  urgency,
  compact,
}: {
  title: string;
  area: string;
  href: string;
  tag: string;
  tagClass: string;
  buttonLabel: string;
  buttonClass: string;
  urgency?: string;
  compact?: boolean;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.45)] px-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${tagClass}`}>{tag}</span>
          {urgency ? (
            <span className="text-[10px] text-[#EF4444]">紧急度 {urgency}</span>
          ) : null}
        </div>
        <p className="truncate text-[13px] font-medium text-[#EAF3FF] lg:text-sm">{title}</p>
        {!compact ? (
          <>
            <p className="mt-0.5 truncate text-xs text-[#8EA3B8]">{area}</p>
            <p className="mt-1 hidden text-[10px] text-[#8EA3B8] lg:block">推荐等级 Lv.1</p>
          </>
        ) : null}
      </div>
      <Link
        href={href}
        className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${buttonClass}`}
      >
        {buttonLabel}
      </Link>
    </li>
  );
}

export function PendingTasksSummary({ groups, maxItems }: PendingTasksSummaryProps) {
  const total = groups.mainline.length + groups.emergency.length;
  const mobileLimit = maxItems ?? 3;

  const mainlineSlice = maxItems ? groups.mainline.slice(0, mobileLimit) : groups.mainline;
  const emergencySlice = maxItems
    ? groups.emergency.slice(0, Math.max(0, mobileLimit - mainlineSlice.length))
    : groups.emergency;

  const displayMainline = maxItems ? mainlineSlice : groups.mainline;
  const displayEmergency = maxItems ? emergencySlice : groups.emergency;

  return (
    <section className={playerCardClass}>
      <div className={`${playerCardHeaderClass} flex items-center justify-between`}>
        <h3 className="text-base font-semibold text-[#EAF3FF]">待处理任务</h3>
        {total > 0 ? (
          <span className="text-xs text-[#8EA3B8]">
            <span className="lg:hidden">
              主线 {groups.mainline.length}
              {groups.emergency.length > 0 ? ` · 突发 ${groups.emergency.length}` : ""}
            </span>
            <span className="hidden lg:inline">{total} 项</span>
          </span>
        ) : null}
      </div>

      <div className={`${playerCardBodyClass} space-y-4`}>
        {total === 0 ? (
          <p className="text-[13px] text-[#8EA3B8] lg:text-sm">
            暂无待处理任务，可跟随推荐行动前往地点触发新任务。
          </p>
        ) : (
          <>
            {displayMainline.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium text-[#8EA3B8]">主线任务</p>
                <ul className="space-y-2">
                  {displayMainline.map((task) => (
                    <TaskRow
                      key={task.id}
                      title={task.title}
                      area={task.area}
                      href={task.href}
                      tag="主线任务"
                      tagClass="bg-[rgba(30,136,255,0.15)] text-[#2EA8FF]"
                      buttonLabel="前往"
                      buttonClass="bg-[#1E88FF] text-white hover:bg-[#2EA8FF]"
                      compact={Boolean(maxItems)}
                    />
                  ))}
                </ul>
              </div>
            ) : null}

            {displayEmergency.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium text-[#EF4444]">突发事件</p>
                <ul className="space-y-2">
                  {displayEmergency.map((task) => (
                    <TaskRow
                      key={task.id}
                      title={task.title}
                      area={task.area}
                      href={task.href}
                      tag="突发事件"
                      tagClass="bg-[rgba(239,68,68,0.15)] text-[#EF4444]"
                      buttonLabel="处理"
                      buttonClass="border border-[rgba(239,68,68,0.45)] bg-[rgba(239,68,68,0.12)] text-[#EF4444]"
                      urgency={task.urgency}
                      compact={Boolean(maxItems)}
                    />
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}

        {total > 0 ? (
          <Link href="/tasks" className="inline-block text-xs text-[#2EA8FF] hover:underline">
            查看全部任务{total > 0 ? ` (${total})` : ""} →
          </Link>
        ) : null}
      </div>
    </section>
  );
}

/** @deprecated 命名对齐 PendingTaskCard，暂保留此导出 */
export const PendingTaskCard = PendingTasksSummary;
