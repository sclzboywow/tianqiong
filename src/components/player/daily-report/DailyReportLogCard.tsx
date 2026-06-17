import {
  AlertTriangle,
  ClipboardList,
  MapPin,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { LogItem } from "@/game/dailyReportPresentationEngine";
import { playerCardClass } from "../playerTheme";

type DailyReportLogCardProps = {
  item: LogItem;
};

function iconForType(iconType: LogItem["iconType"]) {
  switch (iconType) {
    case "map":
      return MapPin;
    case "event":
      return Zap;
    case "task":
      return ClipboardList;
    case "growth":
      return Sparkles;
    case "risk":
      return AlertTriangle;
    default:
      return TrendingUp;
  }
}

function toneBorderClass(tone: LogItem["tone"]) {
  if (tone === "positive") return "border-[rgba(34,197,94,0.25)]";
  if (tone === "negative") return "border-[rgba(239,68,68,0.25)]";
  if (tone === "info") return "border-[rgba(46,168,255,0.22)]";
  return "border-[rgba(60,160,255,0.12)]";
}

function effectToneClass(tone: LogItem["effectLines"][number]["tone"]) {
  if (tone === "positive") return "text-[#22C55E]";
  if (tone === "negative") return "text-[#EF4444]";
  return "text-[#8EA3B8]";
}

export function DailyReportLogCard({ item }: DailyReportLogCardProps) {
  const Icon = iconForType(item.iconType);

  return (
    <article className={`${playerCardClass} ${toneBorderClass(item.tone)} p-4`}>
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[rgba(60,160,255,0.18)] bg-[rgba(5,11,20,0.55)]">
          <Icon className="size-4 text-[#2EA8FF]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] tabular-nums text-[#8EA3B8]">{item.timeLabel}</span>
            <span className="rounded-md border border-[rgba(60,160,255,0.15)] bg-[rgba(5,11,20,0.45)] px-1.5 py-0.5 text-[10px] text-[#8EA3B8]">
              {item.typeLabel}
            </span>
          </div>
          <h4 className="mt-1 text-sm font-semibold text-[#EAF3FF]">{item.title}</h4>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#EAF3FF]/85">{item.content}</p>
          {item.effectLines.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.effectLines.map((line) => (
                <span
                  key={line.text}
                  className={`rounded-md border border-[rgba(60,160,255,0.1)] bg-[rgba(5,11,20,0.45)] px-2 py-0.5 text-[11px] font-medium ${effectToneClass(line.tone)}`}
                >
                  {line.text}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
