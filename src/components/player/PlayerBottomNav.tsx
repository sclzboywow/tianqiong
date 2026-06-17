"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, ClipboardList, Crosshair, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAYER_NAV_ITEMS } from "./playerNavConfig";

const NAV_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "/project": Crosshair,
  "/locations": Compass,
  "/tasks": ClipboardList,
  "/profile": UserRound,
};

type PlayerBottomNavProps = {
  pendingTaskCount?: number;
};

export function PlayerBottomNav({ pendingTaskCount = 0 }: PlayerBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[rgba(60,160,255,0.18)] bg-[#050B14]/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex h-[76px] max-w-lg items-stretch justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-2">
        {PLAYER_NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = NAV_ICONS[item.href];
          const showBadge = item.href === "/tasks" && pendingTaskCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors",
                active
                  ? "text-[#2EA8FF]"
                  : "text-[#8EA3B8]",
              )}
            >
              <span className="relative">
                {Icon ? (
                  <Icon
                    className={cn(
                      "size-5",
                      active && "text-[#2EA8FF] drop-shadow-[0_0_8px_rgba(46,168,255,0.45)]",
                    )}
                  />
                ) : null}
                {showBadge ? (
                  <span className="absolute -right-1.5 -top-1 flex size-4 items-center justify-center rounded-full bg-[#EF4444] text-[9px] font-medium text-white">
                    {pendingTaskCount > 9 ? "9+" : pendingTaskCount}
                  </span>
                ) : null}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** @deprecated 使用 PlayerBottomNav */
export const PlayerNav = PlayerBottomNav;
