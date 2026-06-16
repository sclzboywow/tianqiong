import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/project", label: "项目" },
  { href: "/locations", label: "协同地图" },
  { href: "/ops/project-overview", label: "总控" },
  { href: "/tasks", label: "任务" },
  { href: "/profile", label: "角色" },
  { href: "/ranking", label: "排行" },
  { href: "/daily-report", label: "日报" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-amber-900/30 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-bold text-amber-400">
          天穹综合体
        </Link>
        <nav className="flex gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-zinc-300")}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
