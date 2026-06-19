import { cn } from "@/lib/utils";
import type { DailyReportKeyChange } from "@/game/dailyReportPresentationEngine";
import {
  taskDetailDivider,
  taskDetailPanel,
  taskDetailPanelHeader,
} from "../tasks/taskBoardUi";

type DailyReportKeyChangesCardProps = {
  changes: DailyReportKeyChange[];
};

const MAX_CHANGES = 6;

function toneClass(tone: DailyReportKeyChange["tone"]) {
  if (tone === "positive") return "text-emerald-400/90";
  if (tone === "negative") return "text-rose-400/85";
  return "text-slate-400";
}

export function DailyReportKeyChangesCard({ changes }: DailyReportKeyChangesCardProps) {
  if (changes.length === 0) return null;

  const visibleChanges = changes.slice(0, MAX_CHANGES);

  return (
    <section className={taskDetailPanel}>
      <div className={taskDetailPanelHeader}>
        <h3 className="text-sm font-medium text-cyan-100">关键变化</h3>
      </div>

      <div className="p-3">
        <ul className={`${taskDetailDivider} bg-slate-950/10`}>
          {visibleChanges.map((change) => (
            <li
              key={change.text}
              className={cn("px-1 py-1.5 text-[13px] leading-[1.4]", toneClass(change.tone))}
            >
              · {change.text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
