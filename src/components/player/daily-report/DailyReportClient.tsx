"use client";

import { useMemo, useState } from "react";
import type {
  DailyReportCategoryId,
  DailyReportViewData,
} from "@/game/dailyReportPresentationEngine";
import { filterLogItemsByCategory } from "@/game/dailyReportPresentationEngine";
import { DailyReportPageLayout } from "./DailyReportPageLayout";
import { DailyReportHeader } from "./DailyReportHeader";
import { DailyReportCategoryChips } from "./DailyReportCategoryChips";
import { DailyReportTimeline } from "./DailyReportTimeline";
import { DailyReportKeyChangesCard } from "./DailyReportKeyChangesCard";
import { DailyReportNextSuggestionCard } from "./DailyReportNextSuggestionCard";
import { DailyReportQuickLinks } from "./DailyReportQuickLinks";

type DailyReportClientProps = {
  data: DailyReportViewData;
};

export function DailyReportClient({ data }: DailyReportClientProps) {
  const [activeCategory, setActiveCategory] = useState<DailyReportCategoryId>("all");
  const isArchiveEmpty = data.summary.totalLogs === 0;

  const filteredLogs = useMemo(
    () => filterLogItemsByCategory(data.logItems, activeCategory),
    [data.logItems, activeCategory],
  );

  const keyChangesCard =
    data.keyChanges.length > 0 ? (
      <DailyReportKeyChangesCard changes={data.keyChanges} />
    ) : null;

  return (
    <DailyReportPageLayout
      header={<DailyReportHeader summary={data.summary} />}
      nextSuggestion={<DailyReportNextSuggestionCard suggestion={data.nextSuggestion} />}
      keyChanges={keyChangesCard}
      quickLinks={<DailyReportQuickLinks />}
      timeline={
        <DailyReportTimeline
          items={filteredLogs}
          isArchiveEmpty={isArchiveEmpty}
          primaryAction={
            isArchiveEmpty
              ? { href: data.nextSuggestion.href, label: data.nextSuggestion.buttonLabel }
              : undefined
          }
          categoryChips={
            isArchiveEmpty ? null : (
              <DailyReportCategoryChips
                categories={data.categories}
                activeId={activeCategory}
                onSelect={setActiveCategory}
              />
            )
          }
        />
      }
    />
  );
}
