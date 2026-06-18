"use client";

import { useMemo, useState } from "react";
import type { ExploreCategory, LocationDisplayItem } from "@/game/locationPresentationEngine";
import { ExploreLocationCard } from "./ExploreLocationCard";
import { ExploreCategoryChips } from "./ExploreCategoryChips";
import { ExploreCategorySidebar } from "./ExploreCategorySidebar";

type ExploreLocationsBoardProps = {
  locations: LocationDisplayItem[];
  categories: ExploreCategory[];
  defaultCategory?: string;
};

export function ExploreLocationsBoard({
  locations,
  categories,
  defaultCategory = "all",
}: ExploreLocationsBoardProps) {
  const [activeCategory, setActiveCategory] = useState(defaultCategory);

  const filtered = useMemo(() => {
    if (activeCategory === "action_needed") {
      return locations.filter(
        (item) => item.status === "recommended" || item.relatedTaskCount > 0,
      );
    }
    if (activeCategory === "all") return locations;
    return locations.filter((item) => item.group === activeCategory);
  }, [activeCategory, locations]);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">
      <div className="hidden shrink-0 lg:block">
        <ExploreCategorySidebar
          categories={categories}
          activeId={activeCategory}
          onSelect={setActiveCategory}
        />
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <ExploreCategoryChips
          categories={categories}
          activeId={activeCategory}
          onSelect={setActiveCategory}
        />

        {filtered.length === 0 ? (
          <p className="rounded-lg border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.35)] px-4 py-6 text-center text-sm text-[#8EA3B8]">
            该分类下暂无地点。
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <ExploreLocationCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
