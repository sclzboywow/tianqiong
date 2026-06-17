"use client";

import { useMemo, useState } from "react";
import type {
  DailyReportCategoryId,
  DailyReportViewData,
} from "@/game/dailyReportPresentationEngine";
import { filterLogItemsByCategory } from "@/game/dailyReportPresentationEngine";
import { DailyReportPageLayout } from "./DailyReportPageLayout";
import { DailyReportHeader } from "./DailyReportHeader";
import { DailyReportCategorySidebar } from "./DailyReportCategorySidebar";
import { DailyReportCategoryChips } from "./DailyReportCategoryChips";
import { DailyReportTimeline } from "./DailyReportTimeline";
import { DailyReportSummaryCard } from "./DailyReportSummaryCard";
import { DailyReportKeyChangesCard } from "./DailyReportKeyChangesCard";
import { DailyReportNextSuggestionCard } from "./DailyReportNextSuggestionCard";

type DailyReportClientProps = {
  data: DailyReportViewData;
};

export function DailyReportClient({ data }: DailyReportClientProps) {
  const [activeCategory, setActiveCategory] = useState<DailyReportCategoryId>("all");

  const filteredLogs = useMemo(
    () => filterLogItemsByCategory(data.logItems, activeCategory),
    [data.logItems, activeCategory],
  );

  const summaryCard = <DailyReportSummaryCard summary={data.summary} />;
  const keyChangesCard = <DailyReportKeyChangesCard changes={data.keyChanges} />;
  const nextSuggestionCard = (
    <DailyReportNextSuggestionCard suggestion={data.nextSuggestion} />
  );

  return (
    <DailyReportPageLayout
      header={<DailyReportHeader />}
      summaryMobile={summaryCard}
      categorySidebar={
        <DailyReportCategorySidebar
          categories={data.categories}
          activeId={activeCategory}
          onSelect={setActiveCategory}
        />
      }
      categoryChips={
        <DailyReportCategoryChips
          categories={data.categories}
          activeId={activeCategory}
          onSelect={setActiveCategory}
        />
      }
      timeline={<DailyReportTimeline items={filteredLogs} />}
      summaryDesktop={summaryCard}
      keyChanges={keyChangesCard}
      nextSuggestion={nextSuggestionCard}
    />
  );
}
