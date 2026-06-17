import { Target } from "lucide-react";
import type { ProfileViewData } from "@/game/profilePresentationEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

type PlayerContributionCardProps = {
  contribution: ProfileViewData["contribution"];
};

function StatItem({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.5)] px-3 py-2.5">
      <p className="text-[11px] text-[#8EA3B8]">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-[#EAF3FF]">{value}</p>
    </div>
  );
}

export function PlayerContributionCard({ contribution }: PlayerContributionCardProps) {
  const contributionDisplay =
    contribution.totalContribution > 0
      ? contribution.totalContribution
      : "贡献记录待统计";

  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <div className="flex items-center gap-2">
          <Target className="size-4 text-[#22C55E]" />
          <h3 className="text-base font-semibold text-[#EAF3FF]">项目贡献</h3>
        </div>
      </div>

      <div className={playerCardBodyClass}>
        <div className="grid grid-cols-2 gap-2">
          <StatItem label="已参与任务" value={contribution.participatedCount} />
          <StatItem label="已提交方案" value={contribution.submittedCount} />
          <StatItem label="已完成任务" value={contribution.completedCount} />
          <StatItem label="主线任务贡献" value={contribution.mainlineCount} />
        </div>

        <div className="mt-3 rounded-lg border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.5)] px-3 py-2.5">
          <p className="text-[11px] text-[#8EA3B8]">累计贡献值</p>
          <p className="mt-0.5 text-base font-semibold text-[#EAF3FF]">{contributionDisplay}</p>
        </div>

        {contribution.lastRewardSummary ? (
          <div className="mt-3 rounded-lg border border-[rgba(250,204,21,0.2)] bg-[rgba(250,204,21,0.06)] px-3 py-2.5">
            <p className="text-[11px] text-[#FACC15]/80">最近一次结算奖励</p>
            <p className="mt-1 text-[13px] leading-relaxed text-[#EAF3FF]/90">
              {contribution.lastRewardSummary}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
