import { cn } from "@/lib/utils";
import type { LogItem } from "@/game/dailyReportPresentationEngine";
import { taskDetailTag } from "../tasks/taskBoardUi";

const EFFECT_PREVIEW_LIMIT = 3;

type DailyReportLogCardProps = {
  item: LogItem;
};

function toneAccentClass(tone: LogItem["tone"]) {
  switch (tone) {
    case "positive":
      return "bg-emerald-400/70";
    case "negative":
      return "bg-rose-400/70";
    case "info":
      return "bg-cyan-400/60";
    default:
      return "bg-slate-600/50";
  }
}

function effectToneClass(tone: LogItem["effectLines"][number]["tone"]) {
  if (tone === "positive") return "text-emerald-400/85";
  if (tone === "negative") return "text-rose-400/85";
  return "text-slate-500";
}

export function DailyReportLogCard({ item }: DailyReportLogCardProps) {
  const visibleEffects = item.effectLines.slice(0, EFFECT_PREVIEW_LIMIT);
  const hiddenEffectCount = Math.max(0, item.effectLines.length - EFFECT_PREVIEW_LIMIT);

  return (
    <article className="relative flex min-h-[64px] max-h-[96px] gap-2 py-2 pl-2 pr-1">
      <span
        className={cn("mt-1.5 w-0.5 shrink-0 self-stretch max-h-10", toneAccentClass(item.tone))}
      />

      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[10px] tabular-nums text-slate-600">{item.timeLabel}</span>
          <span className={cn(taskDetailTag, "text-slate-400")}>{item.typeLabel}</span>
        </div>

        <h4 className="mt-0.5 truncate text-sm font-medium text-slate-200">{item.title}</h4>
        <p className="line-clamp-2 text-[13px] leading-[1.4] text-slate-500">{item.content}</p>

        {visibleEffects.length > 0 ? (
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            {visibleEffects.map((line) => (
              <span key={line.text} className={cn("text-[10px]", effectToneClass(line.tone))}>
                {line.text}
              </span>
            ))}
            {hiddenEffectCount > 0 ? (
              <span className="text-[11px] text-slate-500">+{hiddenEffectCount}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
