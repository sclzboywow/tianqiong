import type { LucideIcon } from "lucide-react";
import type { LocationNodeStatus } from "@/game/locationSandtablePresentationEngine";

export const SANDTABLE_STATUS_LABELS: Record<LocationNodeStatus, string> = {
  recommended: "推荐地点",
  has_task: "有任务",
  has_event: "有事件",
  locked: "锁定",
  completed: "已完成",
  normal: "普通地点",
};

export function SandtableDetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-medium text-cyan-100">
        <Icon className="size-3.5 text-cyan-400" />
        {title}
      </h3>
      {children}
    </section>
  );
}

export function SandtableTokenList({ items, empty }: { items?: string[]; empty: string }) {
  const normalized = (items || []).filter(Boolean);
  if (normalized.length === 0) {
    return <p className="text-[11px] text-slate-600">{empty}</p>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {normalized.map((item) => (
        <span
          key={item}
          className="max-w-full truncate whitespace-nowrap border border-cyan-400/15 bg-slate-950/60 px-2 py-0.5 text-[11px] text-slate-400"
          title={item}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
