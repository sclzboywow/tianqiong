import type { ReactNode } from "react";
import { PlayerHeader } from "./PlayerHeader";
import { PlayerTopNav } from "./PlayerTopNav";
import { PlayerBottomNav } from "./PlayerBottomNav";

type PlayerShellProps = {
  children: ReactNode;
  chapterSubtitle?: string;
  userNickname?: string;
  pendingTaskCount?: number;
};

export function PlayerShell({
  children,
  chapterSubtitle,
  userNickname,
  pendingTaskCount = 0,
}: PlayerShellProps) {
  return (
    <div className="min-h-screen bg-[#050B14] text-[#EAF3FF]">
      <PlayerHeader chapterSubtitle={chapterSubtitle} />
      <PlayerTopNav chapterSubtitle={chapterSubtitle} userNickname={userNickname} />

      <div className="mx-auto max-w-[1440px] px-4 py-3 pb-[92px] lg:px-8 lg:py-6 lg:pb-6">
        {children}
      </div>

      <PlayerBottomNav pendingTaskCount={pendingTaskCount} />
    </div>
  );
}
