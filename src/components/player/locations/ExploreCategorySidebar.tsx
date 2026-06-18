import { cn } from "@/lib/utils";
import type { ExploreCategory } from "@/game/locationPresentationEngine";
import { playerCardClass } from "../playerTheme";

type ExploreCategorySidebarProps = {
  categories: ExploreCategory[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function ExploreCategorySidebar({
  categories,
  activeId,
  onSelect,
}: ExploreCategorySidebarProps) {
  return (
    <aside className={cn(playerCardClass, "w-[180px] shrink-0 self-start p-2.5")}>
      <p className="mb-2 px-2 text-xs font-medium text-[#8EA3B8]">筛选</p>
      <ul className="space-y-1">
        {categories.map((category) => {
          const active = category.id === activeId;
          const lockedOnly = category.unlockedCount === 0 && category.count > 0;
          return (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => onSelect(category.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-[rgba(30,136,255,0.15)] text-[#2EA8FF]"
                    : lockedOnly
                      ? "text-[#8EA3B8]/60 hover:bg-[rgba(255,255,255,0.03)]"
                      : "text-[#EAF3FF]/90 hover:bg-[rgba(255,255,255,0.03)]",
                )}
              >
                <span>{category.label}</span>
                <span className="tabular-nums text-xs text-[#8EA3B8]">{category.count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
