"use client";

import { useMemo, useState } from "react";
import type { ExploreCategory, LocationDisplayItem } from "@/game/locationPresentationEngine";
import { ExploreLocationCard } from "./ExploreLocationCard";
import { ExploreCategoryChips } from "./ExploreCategoryChips";
import { ExploreCategorySidebar } from "./ExploreCategorySidebar";

type ExploreLocationsBoardProps = {
  locations: LocationDisplayItem[];
  categories: ExploreCategory[];
};

export function ExploreLocationsBoard({ locations, categories }: ExploreLocationsBoardProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = useMemo(() => {
    if (activeCategory === "all") return locations;
    return locations.filter((item) => item.group === activeCategory);
  }, [activeCategory, locations]);

  return (
    <>
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
          <p className="rounded-xl border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.5)] px-4 py-8 text-center text-sm text-[#8EA3B8]">
            该分类下暂无地点。
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-2">
            {filtered.map((item) => (
              <ExploreLocationCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
