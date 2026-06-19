import type { ReactNode } from "react";
import { taskHudShell } from "../tasks/taskBoardUi";

type DailyReportPageLayoutProps = {
  header: ReactNode;
  timeline: ReactNode;
  nextSuggestion: ReactNode;
  keyChanges: ReactNode | null;
  quickLinks: ReactNode;
};

export function DailyReportPageLayout({
  header,
  timeline,
  nextSuggestion,
  keyChanges,
  quickLinks,
}: DailyReportPageLayoutProps) {
  return (
    <div className={taskHudShell}>
      {header}

      <div className="grid grid-cols-1 gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0 border-cyan-400/10 p-3 xl:border-r">{timeline}</main>

        <aside className="hidden space-y-2.5 p-3 xl:sticky xl:top-4 xl:block xl:self-start">
          {nextSuggestion}
          {keyChanges}
          {quickLinks}
        </aside>
      </div>

      <div className="space-y-2.5 border-t border-cyan-400/10 p-3 xl:hidden">
        {nextSuggestion}
        {keyChanges}
        {quickLinks}
      </div>
    </div>
  );
}
