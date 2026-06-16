import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { displayProgress } from "@/utils/clamp";
import { METRIC_LABELS } from "@/game/types";
import { getRiskList, getStageDisplayInfo, STAGE_GATE_STATUS_LABELS } from "@/game/projectEngine";
import { getRiskMetricLabel } from "@/utils/formatter";
import type { ProjectState } from "@prisma/client";

interface ProjectDashboardProps {
  project: ProjectState;
}

const POSITIVE_METRICS: (keyof ProjectState)[] = [
  "quality",
  "safety",
  "dataIntegrity",
  "ownerTrust",
  "propertyHandover",
];

const RISK_METRIC_KEYS: (keyof ProjectState)[] = ["cost", "fireRisk", "latentRisk"];

function riskBarClass(value: number): string {
  if (value <= 30) return "[&>div]:bg-emerald-500";
  if (value <= 60) return "[&>div]:bg-amber-500";
  if (value <= 80) return "[&>div]:bg-orange-500";
  return "[&>div]:bg-red-500";
}

function riskTextClass(value: number): string {
  if (value <= 30) return "text-emerald-400";
  if (value <= 60) return "text-amber-400";
  if (value <= 80) return "text-orange-400";
  return "text-red-400";
}

function MetricRow({
  metricKey,
  label,
  value,
  risk = false,
}: {
  metricKey?: string;
  label: string;
  value: number;
  risk?: boolean;
}) {
  const displayValue = displayProgress(value);
  const riskLabel = risk && metricKey ? getRiskMetricLabel(metricKey, displayValue) : null;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm text-zinc-300">
        <span>{label}</span>
        <span className={risk ? riskTextClass(displayValue) : ""}>
          {displayValue}
          {riskLabel && <span className="ml-2 text-xs">{riskLabel}</span>}
        </span>
      </div>
      <Progress
        value={displayValue}
        className={`h-2 ${risk ? riskBarClass(displayValue) : ""}`}
      />
    </div>
  );
}

export function ProjectDashboard({ project }: ProjectDashboardProps) {
  const risks = getRiskList(project);
  const totalDays = Number(process.env.SEASON_TOTAL_DAYS || 30);
  const remainingDays = Math.max(0, totalDays - project.dayCount);
  const stageInfo = getStageDisplayInfo(project);

  return (
    <div className="space-y-4">
      <Card className="border-amber-900/40 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-amber-400">建设主线 · {stageInfo.stageConfig.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-300">{stageInfo.stageConfig.description}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">第 {project.dayCount} 天</Badge>
            <Badge variant="outline">剩余 {remainingDays} 天</Badge>
            <Badge variant="outline">状态 {project.status}</Badge>
            <Badge variant="outline">
              阶段门：{STAGE_GATE_STATUS_LABELS[project.stageGateStatus] || project.stageGateStatus}
            </Badge>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-zinc-300">
                <span>阶段进度</span>
                <span>{project.stageProgress}%</span>
              </div>
              <Progress value={project.stageProgress} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-zinc-300">
                <span>总体建设进度</span>
                <span>{project.overallProgress}%</span>
              </div>
              <Progress value={project.overallProgress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-900/40 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-blue-400">关键节点</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm text-zinc-300">
            {stageInfo.milestoneItems.map((item) => (
              <li key={item.key}>
                {item.done ? "√" : "×"} {item.label}
              </li>
            ))}
          </ul>
          {project.stageGateStatus === "BLOCKED" && (
            <div className="mt-4 space-y-2 text-sm text-amber-300">
              <p>阶段门被卡住，暂不能进入下一阶段。</p>
              {stageInfo.gate.missingMilestones.length > 0 && (
                <div>
                  <p className="font-medium">缺失节点：</p>
                  <ul className="list-disc pl-4">
                    {stageInfo.gate.missingMilestones.map((key) => (
                      <li key={key}>{stageInfo.milestoneItems.find((m) => m.key === key)?.label || key}</li>
                    ))}
                  </ul>
                </div>
              )}
              {stageInfo.gate.failedMetrics.length > 0 && (
                <div>
                  <p className="font-medium">风险问题：</p>
                  <ul className="list-disc pl-4">
                    {stageInfo.gate.failedMetrics.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-900/40 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-amber-400">项目指标</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {POSITIVE_METRICS.map((key) => (
              <MetricRow
                key={key}
                label={METRIC_LABELS[key] || key}
                value={project[key] as number}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-900/40 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-red-400">风险指标</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {RISK_METRIC_KEYS.map((key) => (
            <MetricRow
              key={key}
              metricKey={key}
              label={METRIC_LABELS[key] || key}
              value={project[key] as number}
              risk
            />
          ))}
        </CardContent>
      </Card>

      <Card className="border-red-900/40 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-red-400">当前风险清单</CardTitle>
        </CardHeader>
        <CardContent>
          {risks.length ? (
            <ul className="list-disc space-y-1 pl-4 text-sm text-zinc-300">
              {risks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">暂无突出风险</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
