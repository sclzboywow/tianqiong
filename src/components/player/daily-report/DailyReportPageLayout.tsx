import type { ReactNode } from "react";

type DailyReportPageLayoutProps = {
  header: ReactNode;
  summaryMobile: ReactNode;
  categorySidebar: ReactNode;
  categoryChips: ReactNode;
  timeline: ReactNode;
  summaryDesktop: ReactNode;
  keyChanges: ReactNode;
  nextSuggestion: ReactNode;
};

export function DailyReportPageLayout({
  header,
  summaryMobile,
  categorySidebar,
  categoryChips,
  timeline,
  summaryDesktop,
  keyChanges,
  nextSuggestion,
}: DailyReportPageLayoutProps) {
  return (
    <div className="space-y-4 lg:space-y-5">
      {header}

      <div className="lg:hidden">{summaryMobile}</div>
      <div className="lg:hidden">{categoryChips}</div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-5">
        <main className="min-w-0 space-y-4">
          <div className="hidden lg:block">{categoryChips}</div>
          {timeline}
        </main>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="hidden lg:block">{summaryDesktop}</div>
          <div className="hidden lg:block">
            <div className="mb-2 px-1 text-xs font-medium text-[#8EA3B8]">日志分类</div>
            {categorySidebar}
          </div>
          {keyChanges}
          {nextSuggestion}
        </aside>
      </div>
    </div>
  );
}
