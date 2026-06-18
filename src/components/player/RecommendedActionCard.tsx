import Link from "next/link";
import { ArrowRight, Compass, Crosshair, MapPin, RadioTower } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecommendedAction } from "@/game/playerGuidanceEngine";
import { CommandCenterCardBackground } from "./CommandCenterCardBackground";
import { playerCardClass } from "./playerTheme";

type RecommendedActionCardProps = {
  action: RecommendedAction;
};

export function RecommendedActionCard({ action }: RecommendedActionCardProps) {
  const isTaskHref = action.href.startsWith("/tasks/");
  const isLocationHref = action.href.startsWith("/locations");
  const locationName = action.locationName;
  const actionLabel = action.actionLabel || action.title;
  const primaryLabel = isTaskHref ? "进入任务处理" : isLocationHref ? "前往现场" : "立即前往";

  return (
    <section
      className={cn(
        playerCardClass,
        "relative overflow-hidden border-[#2EA8FF] shadow-[0_0_26px_rgba(30,136,255,0.16)]",
      )}
    >
      <CommandCenterCardBackground />

      <div className="relative grid min-h-[300px] gap-5 p-5 lg:min-h-[360px] lg:grid-cols-[minmax(0,1fr)_280px] lg:p-7">
        <div className="flex min-w-0 flex-col justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(46,168,255,0.22)] bg-[rgba(30,136,255,0.12)] px-3 py-1 text-xs text-[#93C5FD]">
              <Crosshair className="size-4 text-[#2EA8FF]" />
              {action.headline || "当前优先行动"}
            </div>

            <p className="text-xs font-medium text-[#8EA3B8]">指挥中心建议</p>

            {isTaskHref ? (
              <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-[#EAF3FF] lg:text-4xl">
                处理任务
                <span className="block text-[#2EA8FF]">{action.title}</span>
              </h2>
            ) : locationName ? (
              <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-[#EAF3FF] lg:text-4xl">
                前往
                <span className="block text-[#2EA8FF]">{locationName}</span>
              </h2>
            ) : (
              <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-[#EAF3FF] lg:text-4xl">
                {action.title}
              </h2>
            )}

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#C9D7E6] lg:text-base">
              {action.description || "这是推进当前章节目标的最短路径。"}
            </p>

            {action.reason && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8EA3B8]">
                原因：{action.reason}
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={action.href}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1E88FF] px-6 text-sm font-semibold text-white shadow-[0_0_20px_rgba(30,136,255,0.35)] transition-colors hover:bg-[#2EA8FF] lg:h-[52px] lg:px-8 lg:text-base"
            >
              {primaryLabel}
              <ArrowRight className="size-5" />
            </Link>

            {locationName && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#8EA3B8]">
                <MapPin className="size-4 text-[#2EA8FF]" />
                {locationName} · {actionLabel}
              </span>
            )}
          </div>
        </div>

        <div className="hidden rounded-2xl border border-[rgba(60,160,255,0.16)] bg-[rgba(5,11,20,0.48)] p-5 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex size-12 items-center justify-center rounded-xl border border-[rgba(46,168,255,0.28)] bg-[rgba(30,136,255,0.14)]">
              {isTaskHref ? (
                <RadioTower className="size-6 text-[#2EA8FF]" />
              ) : (
                <Compass className="size-6 text-[#2EA8FF]" />
              )}
            </div>
            <p className="mt-4 text-sm font-semibold text-[#EAF3FF]">
              {isTaskHref ? "任务已生成" : "现场行动"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#8EA3B8]">
              {isTaskHref
                ? "进入任务详情，阅读现场情况，选择处理方案并提交。"
                : "前往协同地图对应地点，执行行动并触发下一步任务。"}
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-[rgba(60,160,255,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
            <p className="text-xs text-[#8EA3B8]">当前策略</p>
            <p className="mt-1 text-sm font-medium text-[#EAF3FF]">先完成主线节点，再处理扩散风险。</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** @deprecated 使用 RecommendedActionCard */
export const NextActionCard = RecommendedActionCard;
