import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLAYER_NAV_ITEMS, type PlayerNavItem } from "@/components/player/playerNavConfig";

const EXTRA_NAV = [{ href: "/daily-report", label: "日志" }];

type SiteHeaderProps = {
  extraNavItems?: PlayerNavItem[];
};

export function SiteHeader({ extraNavItems = [] }: SiteHeaderProps) {
  const navItems = [...PLAYER_NAV_ITEMS, ...EXTRA_NAV, ...extraNavItems];

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(60,160,255,0.18)] bg-[#050B14]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3 lg:px-8">
        <Link href="/project" className="text-sm font-bold text-[#2EA8FF]">
          天穹综合体
        </Link>
        <nav className="flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-[#8EA3B8]")}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
