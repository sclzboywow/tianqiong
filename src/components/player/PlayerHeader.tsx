"use client";

import { Bell, Settings } from "lucide-react";

type PlayerHeaderProps = {
  chapterSubtitle?: string;
};

export function PlayerHeader({ chapterSubtitle }: PlayerHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(60,160,255,0.18)] bg-[#050B14]/95 backdrop-blur-md lg:hidden">
      <div className="flex h-[72px] items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[rgba(60,160,255,0.35)] bg-[rgba(10,24,40,0.9)] text-xs font-bold text-[#2EA8FF]">
            天
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#EAF3FF]">异界项目部</p>
            {chapterSubtitle ? (
              <p className="truncate text-xs text-[#8EA3B8]">{chapterSubtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="relative rounded-lg p-2 text-[#8EA3B8]"
            aria-label="消息"
          >
            <Bell className="size-5" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#EF4444]" />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-[#8EA3B8]"
            aria-label="设置"
          >
            <Settings className="size-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
