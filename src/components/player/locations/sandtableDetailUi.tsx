import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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
    return <p className="text-xs text-slate-500">{empty}</p>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {normalized.map((item) => (
        <span
          key={item}
          className="max-w-full truncate whitespace-nowrap border border-cyan-400/15 bg-slate-950/60 px-2 py-0.5 text-xs text-slate-400"
          title={item}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function WorkspaceColumn({
  icon: Icon,
  title,
  subtitle,
  children,
  className,
  bodyClassName,
  scrollBody = true,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  scrollBody?: boolean;
}) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col border-cyan-400/10 lg:border-r lg:last:border-r-0",
        className,
      )}
    >
      <header className="shrink-0 border-b border-cyan-400/10 bg-slate-950/40 px-3 py-2.5">
        <h3 className="flex items-center gap-2 text-sm font-medium text-cyan-100">
          <Icon className="size-3.5 shrink-0 text-cyan-400" />
          {title}
        </h3>
        {subtitle ? <p className="mt-1 pl-5 text-xs text-slate-500">{subtitle}</p> : null}
      </header>
      <div
        className={cn(
          "min-h-0 flex-1 p-3",
          scrollBody
            ? "overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "flex flex-col overflow-hidden",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function statusBadgeClass(status: LocationNodeStatus): string {
  return cn(
    "shrink-0 border px-2 py-0.5 text-[10px] whitespace-nowrap",
    status === "recommended" && "border-yellow-400/40 text-yellow-100",
    status === "has_task" && "border-amber-400/40 text-amber-100",
    status === "has_event" && "border-rose-400/40 text-rose-100",
    status === "completed" && "border-emerald-400/40 text-emerald-100",
    status === "locked" && "border-slate-600/30 text-slate-500",
    status === "normal" && "border-cyan-400/25 text-cyan-100",
  );
}
