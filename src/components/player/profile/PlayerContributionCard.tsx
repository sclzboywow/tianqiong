import { Target } from "lucide-react";
import type { ProfileViewData } from "@/game/profilePresentationEngine";
import {
  taskDetailPanel,
  taskDetailPanelHeader,
} from "../tasks/taskBoardUi";

type PlayerContributionCardProps = {
  contribution: ProfileViewData["contribution"];
};

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-950/15 px-2 py-1.5">
      <p className="text-[9px] text-slate-600">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-slate-300">{value}</p>
    </div>
  );
}

export function PlayerContributionCard({ contribution }: PlayerContributionCardProps) {
  const contributionDisplay =
    contribution.totalContribution > 0 ? contribution.totalContribution : "—";

  return (
    <section className={`${taskDetailPanel} h-full`}>
      <div className={taskDetailPanelHeader}>
        <h3 className="flex items-center gap-2 text-sm font-medium text-cyan-100">
          <Target className="size-3.5 text-emerald-400/80" />
          项目贡献
        </h3>
      </div>

      <div className="space-y-2 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <div className="flex shrink-0 flex-col justify-center bg-slate-950/20 px-3 py-2 sm:w-[38%]">
            <p className="text-[11px] text-slate-500">累计贡献值</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums text-cyan-100">
              {contributionDisplay}
            </p>
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-2 gap-1">
            <MiniStat label="参与任务" value={contribution.participatedCount} />
            <MiniStat label="提交方案" value={contribution.submittedCount} />
            <MiniStat label="完成任务" value={contribution.completedCount} />
            <MiniStat label="主线贡献" value={contribution.mainlineCount} />
          </div>
        </div>

        {contribution.lastRewardSummary ? (
          <p className="line-clamp-2 text-xs leading-[1.45] text-slate-600">
            <span className="text-slate-700">最近奖励 </span>
            {contribution.lastRewardSummary}
          </p>
        ) : null}
      </div>
    </section>
  );
}
