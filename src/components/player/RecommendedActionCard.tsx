import Link from "next/link";
import { ArrowRight, Crosshair, MapPin } from "lucide-react";
import type { RecommendedAction } from "@/game/playerGuidanceEngine";
import {
  taskDetailPanel,
  taskDetailPanelHeader,
  taskDetailTag,
  taskHudButtonDetailPrimary,
} from "./tasks/taskBoardUi";

type RecommendedActionCardProps = {
  action: RecommendedAction;
};

function resolvePrimaryLabel(href: string): string {
  if (href.startsWith("/tasks/")) return "前往任务处理";
  if (href.startsWith("/locations")) return "前往地点处理";
  return "立即前往";
}

export function RecommendedActionCard({ action }: RecommendedActionCardProps) {
  const locationName = action.locationName;

  return (
    <section className={taskDetailPanel}>
      <div className={taskDetailPanelHeader}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[12px] font-medium text-cyan-100">
            <Crosshair className="size-3.5 text-cyan-400/80" />
            {action.headline || "当前指令"}
          </h2>
          <span className={`${taskDetailTag} text-cyan-300/80`}>优先行动</span>
        </div>
      </div>

      <div className="flex min-h-[180px] max-h-[240px] flex-col justify-between gap-3 p-3">
        <div className="min-w-0 space-y-2">
          <p className="text-[13px] font-medium leading-snug text-cyan-50">{action.title}</p>
          <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">
            {action.description || "这是推进当前章节目标的最短路径。"}
          </p>
          {action.reason ? (
            <p className="line-clamp-1 text-[10px] text-slate-600">原因：{action.reason}</p>
          ) : null}
          {locationName ? (
            <p className="inline-flex items-center gap-1 text-[10px] text-slate-500">
              <MapPin className="size-3 text-cyan-400/60" />
              {locationName}
              {action.actionLabel ? ` · ${action.actionLabel}` : null}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link href={action.href} className={taskHudButtonDetailPrimary}>
            {resolvePrimaryLabel(action.href)}
            <ArrowRight className="size-4 shrink-0" />
          </Link>
          <p className="hidden text-[10px] text-slate-600 sm:block">先完成主线节点，再处理扩散风险。</p>
        </div>
      </div>
    </section>
  );
}

/** @deprecated 使用 RecommendedActionCard */
export const NextActionCard = RecommendedActionCard;
