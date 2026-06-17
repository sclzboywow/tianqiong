"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const PC_NAV_ITEMS = [
  { href: "/project", label: "指挥中心" },
  { href: "/locations", label: "探索" },
  { href: "/tasks", label: "任务" },
  { href: "/profile", label: "角色" },
  { href: "/daily-report", label: "日志" },
];

type PlayerTopNavProps = {
  chapterSubtitle?: string;
  userNickname?: string;
};

export function PlayerTopNav({ chapterSubtitle, userNickname }: PlayerTopNavProps) {
  const pathname = usePathname();
  const initial = userNickname?.slice(0, 1) || "玩";

  return (
    <header className="sticky top-0 z-50 hidden border-b border-[rgba(60,160,255,0.18)] bg-[#050B14]/95 backdrop-blur-md lg:block">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-4 px-8">
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-[rgba(60,160,255,0.35)] bg-[rgba(10,24,40,0.9)] text-sm font-bold text-[#2EA8FF]">
            天
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#EAF3FF]">异界项目部：天穹综合体</p>
            {chapterSubtitle ? (
              <p className="flex items-center gap-1 truncate text-xs text-[#8EA3B8]">
                {chapterSubtitle}
                <ChevronDown className="size-3 shrink-0 opacity-60" />
              </p>
            ) : null}
          </div>
        </div>

        <nav className="flex flex-1 items-center justify-center gap-1">
          {PC_NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/project" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-4 py-2 text-sm transition-colors",
                  active
                    ? "bg-[rgba(30,136,255,0.15)] text-[#2EA8FF] shadow-[0_0_12px_rgba(30,136,255,0.12)]"
                    : "text-[#8EA3B8] hover:text-[#EAF3FF]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="relative rounded-lg p-2 text-[#8EA3B8] hover:bg-[rgba(10,24,40,0.8)] hover:text-[#EAF3FF]"
            aria-label="消息"
          >
            <Bell className="size-5" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#EF4444]" />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-[#8EA3B8] hover:bg-[rgba(10,24,40,0.8)] hover:text-[#EAF3FF]"
            aria-label="设置"
          >
            <Settings className="size-5" />
          </button>
          <div className="flex size-9 items-center justify-center rounded-full border border-[rgba(60,160,255,0.35)] bg-[rgba(10,24,40,0.9)] text-sm font-medium text-[#EAF3FF]">
            {initial}
          </div>
        </div>
      </div>
    </header>
  );
}
