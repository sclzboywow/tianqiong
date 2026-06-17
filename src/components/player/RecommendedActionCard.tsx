import Link from "next/link";
import { ArrowRight, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecommendedAction } from "@/game/playerGuidanceEngine";
import { playerCardClass } from "./playerTheme";

type RecommendedActionCardProps = {
  action: RecommendedAction;
};

export function RecommendedActionCard({ action }: RecommendedActionCardProps) {
  const locationName = action.locationName;
  const actionLabel = action.actionLabel || action.title;

  return (
    <section
      className={cn(
        playerCardClass,
        "relative min-h-[220px] max-h-[280px] overflow-hidden lg:min-h-[340px] lg:max-h-none",
      )}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(7,17,31,0.2) 0%, rgba(5,11,20,0.85) 100%), radial-gradient(ellipse at 70% 20%, rgba(30,136,255,0.28) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(14,165,233,0.12) 0%, transparent 45%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050B14] via-[#050B14]/94 to-[#050B14]/60" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-[#050B14]/40 to-transparent" />

      <div className="relative flex h-full min-h-[220px] flex-col justify-between p-4 lg:min-h-[340px] lg:p-8">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs text-[#8EA3B8] lg:mb-4 lg:text-sm">
            <Crosshair className="size-4 text-[#2EA8FF]" />
            <span className="lg:hidden">当前推荐</span>
            <span className="hidden lg:inline">{action.headline || "下一步推荐行动"}</span>
          </div>

          {locationName ? (
            <h2 className="line-clamp-3 text-[22px] font-semibold leading-snug text-[#EAF3FF] lg:text-2xl lg:line-clamp-none">
              前往 <span className="text-[#2EA8FF]">{locationName}</span>
              <span className="hidden lg:inline">
                <br />
              </span>
              <span className="lg:block">，{actionLabel}</span>
            </h2>
          ) : (
            <h2 className="line-clamp-2 text-[22px] font-semibold leading-snug text-[#EAF3FF] lg:text-2xl">
              {action.title}
            </h2>
          )}

          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#8EA3B8] lg:mt-3 lg:line-clamp-none lg:text-sm">
            {action.reason}
          </p>
        </div>

        <div className="mt-4 lg:mt-6">
          <Link
            href={action.href}
            className="flex h-12 w-[72%] min-w-[200px] max-w-full items-center justify-center gap-2 rounded-xl bg-[#1E88FF] text-[15px] font-medium text-white shadow-[0_0_20px_rgba(30,136,255,0.35)] transition-colors hover:bg-[#2EA8FF] lg:inline-flex lg:h-[52px] lg:w-auto lg:min-w-[240px] lg:rounded-lg lg:px-8 lg:text-base"
          >
            <span className="lg:hidden">立即前往</span>
            <span className="hidden lg:inline">前往处理</span>
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** @deprecated 使用 RecommendedActionCard */
export const NextActionCard = RecommendedActionCard;
