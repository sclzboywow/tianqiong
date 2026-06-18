import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, FileText, ShieldCheck, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { ProjectState } from "@prisma/client";
import { getStageDisplayInfo } from "@/game/projectEngine";
import { getProjectRiskSummary } from "@/game/playerGuidanceEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "./playerTheme";

type ProjectStatusCardProps = {
  project: ProjectState;
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "推进中",
  SUCCESS: "已交付",
  FAILED: "项目受阻",
};

function MetricTile({
  label,
  value,
  hint,
  tone = "info",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "info" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "text-[#EF4444]"
      : tone === "warning"
        ? "text-[#FACC15]"
        : tone === "success"
          ? "text-[#22C55E]"
          : "text-[#2EA8FF]";

  return (
    <div className="rounded-xl border border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.46)] px-3 py-3">
      <p className="text-xs text-[#8EA3B8]">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${toneClass}`}>{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-[#8EA3B8]">{hint}</p> : null}
    </div>
  );
}

function ProgressBlock({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 text-[#8EA3B8]">
          {icon}
          {label}
        </span>
        <span className="tabular-nums text-[#EAF3FF]">{value}%</span>
      </div>
      <Progress
        value={value}
        className="h-2 bg-[rgba(255,255,255,0.06)] [&>div]:bg-[#1E88FF]"
      />
    </div>
  );
}

export function ProjectStatusCard({ project }: ProjectStatusCardProps) {
  const stageInfo = getStageDisplayInfo(project);
  const summary = getProjectRiskSummary(project);

  const fireTone = project.fireRisk >= 70 ? "danger" : project.fireRisk >= 45 ? "warning" : "success";
  const safetyTone = project.safety < 45 ? "danger" : project.safety < 65 ? "warning" : "success";
  const dataTone = project.dataIntegrity < 45 ? "warning" : project.dataIntegrity >= 70 ? "success" : "info";

  return (
    <section className={playerCardClass}>
      <div className={`${playerCardHeaderClass} flex items-start justify-between gap-3`}>
        <div>
          <p className="text-xs text-[#2EA8FF]">项目战况</p>
          <h3 className="mt-1 text-base font-semibold text-[#EAF3FF]">
            {stageInfo.stageConfig.name}
          </h3>
        </div>
        <span className="rounded-full border border-[rgba(60,160,255,0.18)] px-2.5 py-1 text-xs text-[#8EA3B8]">
          {PROJECT_STATUS_LABELS[project.status] || project.status}
        </span>
      </div>

      <div className={`${playerCardBodyClass} space-y-4`}>
        <p className="text-sm leading-relaxed text-[#8EA3B8]">
          {stageInfo.stageConfig.description}
        </p>

        <div className="space-y-3">
          <ProgressBlock
            label="阶段推进"
            value={project.stageProgress}
            icon={<TrendingUp className="size-3.5 text-[#2EA8FF]" />}
          />
          <ProgressBlock
            label="总体工程"
            value={project.overallProgress}
            icon={<ShieldCheck className="size-3.5 text-[#2EA8FF]" />}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MetricTile label="安全" value={`${project.safety}%`} tone={safetyTone} />
          <MetricTile label="消防风险" value={`${project.fireRisk}%`} tone={fireTone} />
          <MetricTile label="资料完整度" value={`${project.dataIntegrity}%`} tone={dataTone} />
          <MetricTile label="甲方信任" value={summary.ownerTrustLabel} tone="success" />
        </div>

        {summary.riskCount > 0 ? (
          <div className="rounded-xl border border-[rgba(250,204,21,0.25)] bg-[rgba(250,204,21,0.08)] px-4 py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#FACC15]" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#FACC15]">风险提示</p>
                <p className="mt-1 text-xs leading-relaxed text-[#FDE68A]">{summary.riskHint}</p>
                <Link href="/tasks" className="mt-2 inline-flex items-center gap-1 text-xs text-[#2EA8FF] hover:underline">
                  <FileText className="size-3.5" />
                  查看任务处理
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.08)] px-4 py-3">
            <p className="text-sm font-medium text-[#22C55E]">当前状态可控</p>
            <p className="mt-1 text-xs leading-relaxed text-[#8EA3B8]">
              暂无高优先级风险，继续推进阶段目标。
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
