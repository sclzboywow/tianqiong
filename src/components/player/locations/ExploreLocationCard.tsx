import Link from "next/link";
import { AlertTriangle, ArrowRight, Lock, MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocationDisplayItem } from "@/game/locationPresentationEngine";
import { playerCardClass } from "../playerTheme";

type ExploreLocationCardProps = {
  item: LocationDisplayItem;
};

export function ExploreLocationCard({ item }: ExploreLocationCardProps) {
  const isRecommended = item.status === "recommended";
  const isLocked = !item.unlocked;

  const cardClass = cn(
    playerCardClass,
    "relative flex flex-col p-4 transition-colors",
    isRecommended &&
      "border-[#2EA8FF] shadow-[0_0_16px_rgba(30,136,255,0.18)]",
    isLocked && "opacity-55",
  );

  const inner = (
    <>
      {isRecommended && (
        <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-[rgba(30,136,255,0.15)] px-2 py-0.5 text-[11px] text-[#2EA8FF]">
          <Sparkles className="size-3" />
          当前推荐
        </span>
      )}

      {item.hasRisk && (
        <span
          className={cn(
            "absolute right-3 top-3 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px]",
            item.highRisk
              ? "bg-[rgba(239,68,68,0.15)] text-[#EF4444]"
              : "bg-[rgba(250,204,21,0.12)] text-[#FACC15]",
          )}
        >
          <AlertTriangle className="size-3" />
          风险
        </span>
      )}

      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 size-4 shrink-0 text-[#2EA8FF]" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-snug text-[#EAF3FF]">{item.name}</h3>
          <p className="mt-0.5 text-xs text-[#8EA3B8]">
            {item.typeLabel} · {item.group}
          </p>
        </div>
      </div>

      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#8EA3B8]">
        {item.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#8EA3B8]">
        <span className="rounded-md border border-[rgba(60,160,255,0.12)] px-2 py-0.5">
          {isLocked ? `${item.totalActionCount} 项行动` : `${item.actionCount} 项可执行`}
        </span>
        <span className="rounded-md border border-[rgba(60,160,255,0.12)] px-2 py-0.5">
          {item.relatedTaskCount} 项关联任务
        </span>
        <span className="rounded-md border border-[rgba(60,160,255,0.12)] px-2 py-0.5">
          {item.possibleEventsLabel}
        </span>
      </div>

      {item.recommendReason && isRecommended && (
        <p className="mt-2 text-xs leading-relaxed text-[#2EA8FF]/90">{item.recommendReason}</p>
      )}

      <div className="mt-4">
        {isLocked ? (
          <div className="flex items-center gap-2 text-xs text-[#8EA3B8]">
            <Lock className="size-3.5" />
            尚未解锁
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-[#2EA8FF]">
            进入地点
            <ArrowRight className="size-4" />
          </span>
        )}
      </div>
    </>
  );

  if (isLocked) {
    return <article className={cardClass}>{inner}</article>;
  }

  return (
    <Link href={item.href} className={cn(cardClass, "hover:border-[rgba(60,160,255,0.35)]")}>
      {inner}
    </Link>
  );
}
