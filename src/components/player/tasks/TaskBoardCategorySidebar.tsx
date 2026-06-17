import { cn } from "@/lib/utils";
import type { TaskBoardCategory, TaskBoardCategoryId } from "@/game/taskPresentationEngine";
import { playerCardClass } from "../playerTheme";

type TaskBoardCategorySidebarProps = {
  categories: TaskBoardCategory[];
  activeId: TaskBoardCategoryId;
  onSelect: (id: TaskBoardCategoryId) => void;
};

export function TaskBoardCategorySidebar({
  categories,
  activeId,
  onSelect,
}: TaskBoardCategorySidebarProps) {
  return (
    <aside className={cn(playerCardClass, "w-[200px] shrink-0 self-start p-3")}>
      <p className="mb-2 px-2 text-xs font-medium text-[#8EA3B8]">任务分类</p>
      <ul className="space-y-1">
        {categories.map((category) => {
          const active = category.id === activeId;
          return (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => onSelect(category.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-[rgba(30,136,255,0.15)] text-[#2EA8FF]"
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
