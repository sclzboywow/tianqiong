"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExploreCategory, LocationDisplayItem } from "@/game/locationPresentationEngine";
import { ExploreLocationsBoard } from "./ExploreLocationsBoard";

type LocationIndexSectionProps = {
  locations: LocationDisplayItem[];
  categories: ExploreCategory[];
};

function resolveDefaultCategory(categories: ExploreCategory[]): string {
  const actionNeeded = categories.find((category) => category.id === "action_needed");
  if (actionNeeded && actionNeeded.count > 0) return "action_needed";
  return "all";
}

export function LocationIndexSection({ locations, categories }: LocationIndexSectionProps) {
  const [open, setOpen] = useState(false);
  const defaultCategory = useMemo(() => resolveDefaultCategory(categories), [categories]);

  return (
    <section className="border-t border-[rgba(60,160,255,0.12)] pt-4 lg:pt-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#EAF3FF]">地点索引</h2>
          <p className="mt-1 text-xs text-[#8EA3B8]">
            用于快速查找地点；主要推进请优先使用上方协同地图。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[rgba(60,160,255,0.18)] bg-[rgba(5,11,20,0.5)] px-3 py-1.5 text-xs text-[#8EA3B8] lg:hidden"
        >
          {open ? "收起地点索引" : "展开地点索引"}
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      <div className={cn(open ? "block" : "hidden", "lg:block")}>
        <ExploreLocationsBoard
          locations={locations}
          categories={categories}
          defaultCategory={defaultCategory}
        />
      </div>
    </section>
  );
}
