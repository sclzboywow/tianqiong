import Link from "next/link";
import { AlertTriangle, ArrowRight, Lock, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocationDisplayItem } from "@/game/locationPresentationEngine";
import { playerCardClass } from "../playerTheme";

type ExploreLocationCardProps = {
  item: LocationDisplayItem;
};

export function ExploreLocationCard({ item }: ExploreLocationCardProps) {
  const isRecommended = item.status === "recommended";
  const isLocked = !item.unlocked;

  return (
    <article
      className={cn(
        playerCardClass,
        "flex items-center justify-between gap-3 p-3 transition-colors",
        isRecommended && "border-[rgba(46,168,255,0.35)]",
        isLocked && "opacity-60",
        !isLocked && "hover:border-[rgba(60,160,255,0.3)]",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {isRecommended ? (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-[rgba(30,136,255,0.12)] px-1.5 py-0.5 text-[10px] text-[#2EA8FF]">
              <Sparkles className="size-3" />
              推荐
            </span>
          ) : null}
          {isLocked ? (
            <span className="inline-flex items-center gap-0.5 rounded-md border border-[rgba(60,160,255,0.12)] px-1.5 py-0.5 text-[10px] text-[#8EA3B8]">
              <Lock className="size-3" />
              未解锁
            </span>
          ) : (
            <span className="rounded-md border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.08)] px-1.5 py-0.5 text-[10px] text-[#22C55E]">
              已解锁
            </span>
          )}
          {item.relatedTaskCount > 0 ? (
            <span className="rounded-md border border-[rgba(250,204,21,0.3)] bg-[rgba(250,204,21,0.08)] px-1.5 py-0.5 text-[10px] text-[#FACC15]">
              待办 {item.relatedTaskCount}
            </span>
          ) : null}
          {item.hasRisk ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px]",
                item.highRisk
                  ? "bg-[rgba(239,68,68,0.12)] text-[#EF4444]"
                  : "bg-[rgba(250,204,21,0.1)] text-[#FACC15]",
              )}
            >
              <AlertTriangle className="size-3" />
              风险
            </span>
          ) : null}
          {item.npcCount > 0 ? (
            <span className="inline-flex items-center gap-0.5 rounded-md border border-[rgba(60,160,255,0.15)] px-1.5 py-0.5 text-[10px] text-[#8EA3B8]">
              <Users className="size-3" />
              NPC
            </span>
          ) : null}
        </div>

        <h3 className="mt-1.5 truncate text-sm font-medium text-[#EAF3FF]">{item.name}</h3>
        <p className="mt-0.5 text-xs text-[#8EA3B8]">
          {item.typeLabel} · {item.group}
          {!isLocked ? ` · ${item.actionCount} 项行动` : ` · ${item.totalActionCount} 项行动`}
        </p>
      </div>

      <Link
        href={item.href}
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[rgba(60,160,255,0.22)] px-2.5 py-1.5 text-xs text-[#2EA8FF] hover:border-[#2EA8FF]"
      >
        进入地点
        <ArrowRight className="size-3.5" />
      </Link>
    </article>
  );
}
