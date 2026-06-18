import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { ProjectState } from "@prisma/client";
import { getProjectRiskSummary } from "@/game/playerGuidanceEngine";
import { taskDetailPanel, taskDetailPanelHeader } from "./tasks/taskBoardUi";

type ProjectStatusCardProps = {
  project: ProjectState;
};

function metricTone(value: number, invert = false) {
  if (invert) {
    if (value >= 70) return "text-rose-300/90";
    if (value >= 45) return "text-amber-200/90";
    return "text-emerald-300/80";
  }
  if (value < 45) return "text-rose-300/90";
  if (value < 65) return "text-amber-200/90";
  return "text-emerald-300/80";
}

function CompactProgress({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px]">
        <span className="text-slate-600">{label}</span>
        <span className="tabular-nums text-cyan-100/90">{value}%</span>
      </div>
      <Progress value={value} className="h-1 bg-slate-950/40 [&>div]:bg-cyan-400/50" />
    </div>
  );
}

function MetricRow({
  label,
  value,
  toneClass,
}: {
  label: string;
  value: string;
  toneClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="text-slate-600">{label}</span>
      <span className={`font-medium tabular-nums ${toneClass ?? "text-slate-300"}`}>{value}</span>
    </div>
  );
}

export function ProjectStatusCard({ project }: ProjectStatusCardProps) {
  const summary = getProjectRiskSummary(project);

  return (
    <section className={taskDetailPanel}>
      <div className={taskDetailPanelHeader}>
        <h3 className="text-[12px] font-medium text-cyan-100">项目态势</h3>
      </div>

      <div className="space-y-3 p-3">
        <div className="space-y-2">
          <CompactProgress label="阶段推进" value={project.stageProgress} />
          <CompactProgress label="总体工程" value={project.overallProgress} />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          <MetricRow label="安全" value={`${project.safety}%`} toneClass={metricTone(project.safety)} />
          <MetricRow
            label="消防风险"
            value={`${project.fireRisk}%`}
            toneClass={metricTone(project.fireRisk, true)}
          />
          <MetricRow
            label="资料完整度"
            value={`${project.dataIntegrity}%`}
            toneClass={metricTone(project.dataIntegrity)}
          />
          <MetricRow label="甲方信任" value={summary.ownerTrustLabel} toneClass="text-cyan-200/90" />
        </div>

        {summary.riskCount > 0 ? (
          <div className="bg-amber-950/20 px-2 py-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-300/80" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-amber-200/85">风险提示</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-amber-100/65">
                  {summary.riskHint}
                </p>
                <Link href="/tasks" className="mt-1.5 inline-block text-[10px] text-cyan-400/75 hover:text-cyan-300">
                  查看任务处理 →
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
