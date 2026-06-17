import Link from "next/link";
import { ArrowRight, Compass, Sparkles } from "lucide-react";
import type { LocationDisplayItem } from "@/game/locationPresentationEngine";
import { playerCardClass } from "../playerTheme";

type ExploreRecommendedCardProps = {
  item: LocationDisplayItem;
};

export function ExploreRecommendedCard({ item }: ExploreRecommendedCardProps) {
  return (
    <section
      className={`${playerCardClass} border-[#2EA8FF] p-4 shadow-[0_0_20px_rgba(30,136,255,0.15)] lg:p-5`}
    >
      <div className="flex items-center gap-2 text-xs text-[#2EA8FF]">
        <Sparkles className="size-4" />
        当前推荐地点
      </div>
      <h2 className="mt-2 text-lg font-semibold text-[#EAF3FF]">{item.name}</h2>
      <p className="mt-1 text-sm text-[#8EA3B8]">
        {item.typeLabel} · {item.actionCount} 项可执行行动
      </p>
      {item.recommendReason && (
        <p className="mt-2 text-[13px] leading-relaxed text-[#8EA3B8]">{item.recommendReason}</p>
      )}
      <Link
        href={item.href}
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[#1E88FF] px-5 text-sm font-medium text-white shadow-[0_0_16px_rgba(30,136,255,0.3)] hover:bg-[#2EA8FF]"
      >
        前往 {item.name.split("·").pop()?.trim() || "地点"}
        <ArrowRight className="size-4" />
      </Link>
    </section>
  );
}

type ExplorePageHeaderProps = {
  stageName: string;
  unlockedCount: number;
  totalCount: number;
  recommendedName?: string;
};

export function ExplorePageHeader({
  stageName,
  unlockedCount,
  totalCount,
  recommendedName,
}: ExplorePageHeaderProps) {
  return (
    <header className="space-y-3">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[#2EA8FF]">
          <Compass className="size-5" />
          <h1 className="text-xl font-semibold text-[#EAF3FF] lg:text-2xl">探索</h1>
        </div>
        <p className="text-sm text-[#8EA3B8]">前往不同地点，触发行动、事件与任务。</p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-[rgba(60,160,255,0.18)] bg-[rgba(5,11,20,0.5)] px-3 py-1.5 text-[#EAF3FF]">
          当前阶段：{stageName}
        </span>
        <span className="rounded-full border border-[rgba(60,160,255,0.18)] bg-[rgba(5,11,20,0.5)] px-3 py-1.5 text-[#8EA3B8]">
          已解锁 {unlockedCount}/{totalCount}
        </span>
        {recommendedName && (
          <span className="rounded-full border border-[rgba(30,136,255,0.35)] bg-[rgba(30,136,255,0.1)] px-3 py-1.5 text-[#2EA8FF]">
            推荐：{recommendedName}
          </span>
        )}
      </div>
    </header>
  );
}
