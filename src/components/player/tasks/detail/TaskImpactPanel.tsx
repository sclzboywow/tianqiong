import { cn } from "@/lib/utils";
import type { TaskDetailViewData } from "@/game/taskDetailPresentationEngine";
import type { PlayerEffectLine } from "@/game/taskEffectPlayerDisplay";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../../playerTheme";

type TaskImpactPanelProps = {
  data: TaskDetailViewData;
};

function EffectBlock({ title, lines }: { title: string; lines: PlayerEffectLine[] }) {
  if (lines.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs text-[#8EA3B8]">{title}</p>
      <ul className="space-y-1">
        {lines.map((line) => (
          <li
            key={line.text}
            className={cn(
              "text-sm",
              line.tone === "positive" && "text-[#22C55E]",
              line.tone === "negative" && "text-[#EF4444]",
              line.tone === "neutral" && "text-[#8EA3B8]",
            )}
          >
            · {line.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TaskImpactPanel({ data }: TaskImpactPanelProps) {
  const hasContent =
    data.successEffectsSummary.length > 0 ||
    data.failEffectsSummary.length > 0 ||
    data.milestoneLabels.length > 0;

  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <h3 className="text-base font-semibold text-[#EAF3FF]">项目影响</h3>
      </div>
      <div className={`${playerCardBodyClass} space-y-4`}>
        {!hasContent ? (
          <p className="text-sm text-[#8EA3B8]">暂无配置的项目影响摘要。</p>
        ) : (
          <>
            <EffectBlock title="成功影响" lines={data.successEffectsSummary} />
            <EffectBlock title="失败风险" lines={data.failEffectsSummary} />
            {data.milestoneLabels.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs text-[#8EA3B8]">关键节点</p>
                <ul className="space-y-1">
                  {data.milestoneLabels.map((label) => (
                    <li key={label} className="text-sm text-[#2EA8FF]">
                      · {label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
