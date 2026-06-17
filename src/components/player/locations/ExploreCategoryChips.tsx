"use client";

import { cn } from "@/lib/utils";
import type { ExploreCategory } from "@/game/locationPresentationEngine";

type ExploreCategoryChipsProps = {
  categories: ExploreCategory[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function ExploreCategoryChips({ categories, activeId, onSelect }: ExploreCategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((category) => {
        const active = category.id === activeId;
        const lockedOnly = category.unlockedCount === 0 && category.count > 0;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors",
              active
                ? "border-[#2EA8FF] bg-[rgba(30,136,255,0.15)] text-[#2EA8FF]"
                : lockedOnly
                  ? "border-[rgba(60,160,255,0.12)] text-[#8EA3B8]/60"
                  : "border-[rgba(60,160,255,0.18)] text-[#8EA3B8]",
            )}
          >
            {category.label} ({category.count})
          </button>
        );
      })}
    </div>
  );
}
