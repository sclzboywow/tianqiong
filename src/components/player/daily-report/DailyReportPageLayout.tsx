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
    <div className="flex flex-col gap-3 lg:gap-5">
      {header}

      <div className="lg:hidden">{summaryMobile}</div>

      <div className="lg:hidden">{categoryChips}</div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-5">
        <aside className="hidden lg:col-span-2 lg:block">
          <div className="sticky top-4 space-y-2">
            <p className="px-1 text-xs font-medium text-[#8EA3B8]">日志分类</p>
            {categorySidebar}
          </div>
        </aside>

        <main className="lg:col-span-7">{timeline}</main>

        <aside className="space-y-3 lg:col-span-3 lg:space-y-4">
          <div className="hidden lg:block">{summaryDesktop}</div>
          {keyChanges}
          {nextSuggestion}
        </aside>
      </div>

      <div className="space-y-3 lg:hidden">
        {keyChanges}
        {nextSuggestion}
      </div>
    </div>
  );
}
