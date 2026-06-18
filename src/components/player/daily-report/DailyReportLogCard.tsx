import {
  AlertTriangle,
  ClipboardList,
  MapPin,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LogItem } from "@/game/dailyReportPresentationEngine";

type DailyReportLogCardProps = {
  item: LogItem;
};

function LogTypeIcon({
  iconType,
  className,
}: {
  iconType: LogItem["iconType"];
  className?: string;
}) {
  switch (iconType) {
    case "map":
      return <MapPin className={className} />;
    case "event":
      return <Zap className={className} />;
    case "task":
      return <ClipboardList className={className} />;
    case "growth":
      return <Sparkles className={className} />;
    case "risk":
      return <AlertTriangle className={className} />;
    default:
      return <TrendingUp className={className} />;
  }
}

function toneClasses(tone: LogItem["tone"]) {
  if (tone === "positive") {
    return {
      border: "border-[rgba(34,197,94,0.25)]",
      accent: "bg-[#22C55E]",
      icon: "text-[#22C55E]",
      chip: "border-[rgba(34,197,94,0.18)] bg-[rgba(34,197,94,0.08)] text-[#86EFAC]",
    };
  }
  if (tone === "negative") {
    return {
      border: "border-[rgba(239,68,68,0.28)]",
      accent: "bg-[#EF4444]",
      icon: "text-[#EF4444]",
      chip: "border-[rgba(239,68,68,0.18)] bg-[rgba(239,68,68,0.08)] text-[#FCA5A5]",
    };
  }
  if (tone === "info") {
    return {
      border: "border-[rgba(46,168,255,0.22)]",
      accent: "bg-[#2EA8FF]",
      icon: "text-[#2EA8FF]",
      chip: "border-[rgba(46,168,255,0.18)] bg-[rgba(30,136,255,0.08)] text-[#93C5FD]",
    };
  }
  return {
    border: "border-[rgba(60,160,255,0.12)]",
    accent: "bg-[#8EA3B8]",
    icon: "text-[#8EA3B8]",
    chip: "border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.45)] text-[#8EA3B8]",
  };
}

function effectToneClass(tone: LogItem["effectLines"][number]["tone"]) {
  if (tone === "positive") return "text-[#22C55E]";
  if (tone === "negative") return "text-[#EF4444]";
  return "text-[#8EA3B8]";
}

export function DailyReportLogCard({ item }: DailyReportLogCardProps) {
  const tone = toneClasses(item.tone);

  return (
    <article className={cn("relative overflow-hidden rounded-xl border bg-[rgba(10,24,40,0.78)] p-4", tone.border)}>
      <div className={cn("absolute inset-y-0 left-0 w-1", tone.accent)} />

      <div className="flex items-start gap-3 pl-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(60,160,255,0.18)] bg-[rgba(5,11,20,0.55)]">
          <LogTypeIcon iconType={item.iconType} className={cn("size-4", tone.icon)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] tabular-nums text-[#8EA3B8]">{item.timeLabel}</span>
            <span className={cn("rounded-md border px-1.5 py-0.5 text-[10px]", tone.chip)}>
              {item.typeLabel}
            </span>
          </div>

          <h4 className="mt-1.5 text-sm font-semibold text-[#EAF3FF]">{item.title}</h4>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#EAF3FF]/85">{item.content}</p>

          {item.effectLines.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.effectLines.map((line) => (
                <span
                  key={line.text}
                  className={cn(
                    "rounded-md border border-[rgba(60,160,255,0.1)] bg-[rgba(5,11,20,0.45)] px-2 py-0.5 text-[11px] font-medium",
                    effectToneClass(line.tone),
                  )}
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
