import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { ProjectState } from "@prisma/client";
import { getStageDisplayInfo } from "@/game/projectEngine";
import { getProjectRiskSummary } from "@/game/playerGuidanceEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "./playerTheme";

type ProjectStatusCardProps = {
  project: ProjectState;
};

function StatusChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "danger" | "success" | "info";
}) {
  const toneClass =
    tone === "danger"
      ? "text-[#EF4444]"
      : tone === "success"
        ? "text-[#22C55E]"
        : "text-[#2EA8FF]";

  return (
    <div className="rounded-lg border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.45)] px-2.5 py-2 text-center lg:px-3 lg:py-2.5">
      <p className="text-[10px] text-[#8EA3B8] lg:text-xs">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

export function ProjectStatusCard({ project }: ProjectStatusCardProps) {
  const stageInfo = getStageDisplayInfo(project);
  const summary = getProjectRiskSummary(project);

  return (
    <section className={playerCardClass}>
      <div className={`${playerCardHeaderClass} flex items-center justify-between gap-2`}>
        <h3 className="text-base font-semibold text-[#EAF3FF]">项目状态</h3>
        <span className="text-xs text-[#2EA8FF]">{stageInfo.stageConfig.name}</span>
      </div>

      <div className={`${playerCardBodyClass} space-y-3 lg:space-y-4`}>
        <p className="text-[13px] text-[#8EA3B8] lg:hidden">
          当前阶段：{stageInfo.stageConfig.name}
        </p>

        <div className="space-y-2.5 lg:space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-xs text-[#8EA3B8]">
              <span>阶段进度</span>
              <span className="tabular-nums text-[#EAF3FF]">{project.stageProgress}%</span>
            </div>
            <Progress
              value={project.stageProgress}
              className="h-1.5 bg-[rgba(255,255,255,0.06)] lg:h-2 [&>div]:bg-[#1E88FF]"
            />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-[#8EA3B8]">
              <span>总体进度</span>
              <span className="tabular-nums text-[#EAF3FF]">{project.overallProgress}%</span>
            </div>
            <Progress
              value={project.overallProgress}
              className="h-1.5 bg-[rgba(255,255,255,0.06)] lg:h-2 [&>div]:bg-[#2EA8FF]/70"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatusChip
            label="潜在风险"
            value={summary.latentRiskLabel}
            tone={summary.latentRiskLabel === "高" ? "danger" : "info"}
          />
          <StatusChip
            label="甲方信任"
            value={summary.ownerTrustLabel}
            tone="success"
          />
          <StatusChip
            label="资料完整度"
            value={`${summary.dataIntegrity}%`}
            tone="info"
          />
        </div>

        {summary.riskCount > 0 ? (
          <div className="hidden items-start justify-between gap-2 rounded-lg border border-[rgba(250,204,21,0.25)] bg-[rgba(250,204,21,0.08)] px-3 py-2.5 lg:flex">
            <p className="text-xs leading-relaxed text-[#FACC15]">{summary.riskHint}</p>
            <Link href="/tasks" className="shrink-0 text-xs text-[#2EA8FF] hover:underline">
              查看详情
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
