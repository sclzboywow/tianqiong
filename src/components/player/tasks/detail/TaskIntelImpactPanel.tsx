import { cn } from "@/lib/utils";
import type { TaskDetailViewData } from "@/game/taskDetailPresentationEngine";
import type { PlayerEffectLine } from "@/game/taskEffectPlayerDisplay";
import { taskHudPanel, taskHudPanelHeader, taskHudTag } from "../taskBoardUi";

type TaskIntelImpactPanelProps = {
  data: TaskDetailViewData;
};

function EffectBlock({ title, lines }: { title: string; lines: PlayerEffectLine[] }) {
  if (lines.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-[10px] text-slate-500">{title}</p>
      <ul className="space-y-1">
        {lines.map((line) => (
          <li
            key={line.text}
            className={cn(
              "text-[11px] leading-5",
              line.tone === "positive" && "text-emerald-400",
              line.tone === "negative" && "text-red-400",
              line.tone === "neutral" && "text-slate-500",
            )}
          >
            · {line.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TaskIntelImpactPanel({ data }: TaskIntelImpactPanelProps) {
  const hasImpact =
    data.successEffectsSummary.length > 0 ||
    data.failEffectsSummary.length > 0 ||
    data.milestoneLabels.length > 0;

  return (
    <section className={taskHudPanel}>
      <div className={taskHudPanelHeader}>
        <h3 className="text-[12px] font-medium text-cyan-100">任务情报与影响</h3>
      </div>

      <div className="space-y-3 p-3">
        <p className="text-[11px] leading-5 text-slate-400">
          {data.description || "暂无任务说明。"}
        </p>

        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] text-slate-600">基础成功率</dt>
            <dd className="mt-0.5 text-[11px] font-medium text-cyan-100">
              {Math.round(data.baseSuccessRate)}%
            </dd>
          </div>
          <div>
            <dt className="text-[10px] text-slate-600">参与人数</dt>
            <dd className="mt-0.5 text-[11px] text-slate-300">
              {data.participantCount}/{data.requiredCount} 人
            </dd>
          </div>
          {data.minResolveCount > 1 && (
            <div>
              <dt className="text-[10px] text-slate-600">提交进度</dt>
              <dd className="mt-0.5 text-[11px] text-slate-300">
                {data.submittedCount}/{data.minResolveCount} 人已提交
              </dd>
            </div>
          )}
          <div>
            <dt className="text-[10px] text-slate-600">结算模式</dt>
            <dd className="mt-0.5 text-[11px] text-slate-300">{data.resolutionModeLabel}</dd>
          </div>
        </dl>

        {data.requiredJobLabels.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] text-slate-600">推荐岗位</p>
            <div className="flex flex-wrap gap-1.5">
              {data.requiredJobLabels.map((job) => (
                <span key={job} className={`${taskHudTag} border-cyan-400/20 text-slate-300`}>
                  {job}
                </span>
              ))}
            </div>
          </div>
        )}

        {hasImpact ? (
          <div className="space-y-3 border-t border-cyan-400/10 pt-3">
            <EffectBlock title="成功影响" lines={data.successEffectsSummary} />
            <EffectBlock title="失败风险" lines={data.failEffectsSummary} />
            {data.milestoneLabels.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] text-slate-600">关键节点</p>
                <ul className="space-y-1">
                  {data.milestoneLabels.map((label) => (
                    <li key={label} className="text-[11px] text-cyan-300">
                      · {label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-slate-600">暂无配置的项目影响摘要。</p>
        )}
      </div>
    </section>
  );
}
