import Link from "next/link";
import { ArrowRight, Crosshair } from "lucide-react";
import type { DailyReportNextSuggestion } from "@/game/dailyReportPresentationEngine";
import {
  taskDetailPanel,
  taskDetailPanelHeader,
  taskHudButtonDetailPrimary,
} from "../tasks/taskBoardUi";

type DailyReportNextSuggestionCardProps = {
  suggestion: DailyReportNextSuggestion;
};

function resolveButtonLabel(suggestion: DailyReportNextSuggestion): string {
  if (suggestion.href.startsWith("/tasks/")) return "前往任务处理";
  if (suggestion.href.startsWith("/locations")) return "前往地点处理";
  return suggestion.buttonLabel;
}

export function DailyReportNextSuggestionCard({ suggestion }: DailyReportNextSuggestionCardProps) {
  return (
    <section className={taskDetailPanel}>
      <div className={taskDetailPanelHeader}>
        <h3 className="flex items-center gap-2 text-sm font-medium text-cyan-100">
          <Crosshair className="size-3.5 text-cyan-400/80" />
          {suggestion.headline}
        </h3>
      </div>

      <div className="space-y-2 p-3">
        <p className="text-sm font-medium leading-[1.45] text-slate-200">{suggestion.title}</p>
        {suggestion.description ? (
          <p className="text-[13px] leading-[1.45] text-slate-400">{suggestion.description}</p>
        ) : null}
        <Link href={suggestion.href} className={`${taskHudButtonDetailPrimary} w-full`}>
          {resolveButtonLabel(suggestion)}
          <ArrowRight className="size-4 shrink-0" />
        </Link>
      </div>
    </section>
  );
}
