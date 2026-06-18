import { ClipboardCheck, Target, Trophy } from "lucide-react";
import type { ProfileViewData } from "@/game/profilePresentationEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

type PlayerContributionCardProps = {
  contribution: ProfileViewData["contribution"];
};

function StatItem({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.5)] px-3 py-3">
      <p className="text-[11px] text-[#8EA3B8]">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-[#EAF3FF]">{value}</p>
    </div>
  );
}

export function PlayerContributionCard({ contribution }: PlayerContributionCardProps) {
  const contributionDisplay =
    contribution.totalContribution > 0
      ? contribution.totalContribution
      : "待统计";

  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <div className="flex items-center gap-2">
          <Target className="size-4 text-[#22C55E]" />
          <h3 className="text-base font-semibold text-[#EAF3FF]">项目贡献</h3>
        </div>
        <p className="mt-1 text-xs text-[#8EA3B8]">你的任务参与、方案提交和主线推进记录</p>
      </div>

      <div className={`${playerCardBodyClass} space-y-3`}>
        <div className="rounded-2xl border border-[rgba(34,197,94,0.22)] bg-[rgba(34,197,94,0.08)] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.12)]">
              <Trophy className="size-5 text-[#22C55E]" />
            </div>
            <div>
              <p className="text-xs text-[#8EA3B8]">累计贡献值</p>
              <p className="mt-0.5 text-2xl font-semibold text-[#22C55E]">{contributionDisplay}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatItem label="已参与任务" value={contribution.participatedCount} />
          <StatItem label="已提交方案" value={contribution.submittedCount} />
          <StatItem label="已完成任务" value={contribution.completedCount} />
          <StatItem label="主线贡献" value={contribution.mainlineCount} />
        </div>

        {contribution.lastRewardSummary ? (
          <div className="rounded-xl border border-[rgba(250,204,21,0.2)] bg-[rgba(250,204,21,0.06)] px-4 py-3">
            <div className="flex items-start gap-2">
              <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-[#FACC15]" />
              <div>
                <p className="text-xs text-[#FACC15]/80">最近一次结算奖励</p>
                <p className="mt-1 text-sm leading-relaxed text-[#EAF3FF]/90">
                  {contribution.lastRewardSummary}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
