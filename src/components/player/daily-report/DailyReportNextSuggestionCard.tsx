import Link from "next/link";
import { ArrowRight, Crosshair } from "lucide-react";
import type { DailyReportNextSuggestion } from "@/game/dailyReportPresentationEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

type DailyReportNextSuggestionCardProps = {
  suggestion: DailyReportNextSuggestion;
};

export function DailyReportNextSuggestionCard({ suggestion }: DailyReportNextSuggestionCardProps) {
  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <div className="flex items-center gap-2">
          <Crosshair className="size-4 text-[#2EA8FF]" />
          <h3 className="text-base font-semibold text-[#EAF3FF]">{suggestion.headline}</h3>
        </div>
      </div>
      <div className={playerCardBodyClass}>
        <p className="text-[13px] font-medium leading-relaxed text-[#EAF3FF] lg:text-sm">
          {suggestion.title}
        </p>
        {suggestion.description ? (
          <p className="mt-2 text-xs leading-relaxed text-[#8EA3B8]">{suggestion.description}</p>
        ) : null}
        <Link
          href={suggestion.href}
          className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1E88FF] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2EA8FF]"
        >
          {suggestion.buttonLabel}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
