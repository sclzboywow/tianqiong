import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ProjectOverviewData } from "@/game/projectOverview";
import { TASK_STATUS_LABELS, STAGE_GATE_STATUS_LABELS } from "@/game/projectOverview";
import { MILESTONE_LABELS } from "@/game/projectStages";

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

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-700/80 bg-zinc-950/50 px-3 py-2">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-lg font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

export function ProjectOverviewPanel({ data }: { data: ProjectOverviewData }) {
  if (!data.project || data.emptyMessage) {
    return (
      <Card className="border-amber-900/40 bg-zinc-900/80">
        <CardContent className="py-10 text-center text-zinc-300">{data.emptyMessage}</CardContent>
      </Card>
    );
  }

  const project = data.project;
  const stageInfo = data.stageInfo!;
  const gateBlocked = project.stageGateStatus === "BLOCKED";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-amber-400">项目总控</h1>
        <p className="mt-1 text-sm text-zinc-400">
          查看当前赛季建设进度、阶段节点、任务运行和风险状态。
        </p>
      </div>

      <Card className="border-amber-900/40 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-base text-amber-300">项目概览</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">项目状态 {project.status}</Badge>
            <Badge variant="outline">当前阶段 {stageInfo.stageConfig.name}</Badge>
            <Badge variant="outline">
              阶段门 {STAGE_GATE_STATUS_LABELS[project.stageGateStatus] || project.stageGateStatus}
            </Badge>
            <Badge variant="outline">
              时间压力 {data.timePressure}（第 {project.dayCount}/{data.totalDays} 天）
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-zinc-300">
                <span>总体建设进度</span>
                <span>{project.overallProgress}%</span>
              </div>
              <Progress value={project.overallProgress} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-zinc-300">
                <span>当前阶段进度</span>
                <span>{project.stageProgress}%</span>
              </div>
              <Progress value={project.stageProgress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-700 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-base">阶段推进</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[520px] grid grid-cols-[1.2fr_0.5fr_0.7fr_0.7fr] gap-2 border-b border-zinc-700 pb-2 text-xs font-medium text-zinc-400">
              <span>阶段名称</span>
              <span>权重</span>
              <span>状态</span>
              <span>进度</span>
            </div>
            {data.stages.map((row) => (
              <div
                key={row.id}
                className="grid min-w-[520px] grid-cols-[1.2fr_0.5fr_0.7fr_0.7fr] gap-2 border-b border-zinc-800 py-2 text-sm text-zinc-200 last:border-0"
              >
                <span>{row.name}</span>
                <span>{row.weight > 0 ? `${row.weight}%` : "-"}</span>
                <span className={row.statusLabel === "当前阶段" ? "text-amber-400" : "text-zinc-300"}>
                  {row.statusLabel}
                </span>
                <span>{row.progress === null ? "-" : `${row.progress}%`}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-700 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-base">关键节点 · {stageInfo.stageConfig.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-1 text-sm text-zinc-300">
            {stageInfo.milestoneItems.map((item) => (
              <li key={item.key}>
                {item.done ? "√" : "×"} {item.label}
              </li>
            ))}
          </ul>
          {gateBlocked && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-sm text-red-200">
              <p className="font-medium">阶段门被卡住，暂不能进入下一阶段。</p>
              {stageInfo.gate.missingMilestones.length > 0 && (
                <div className="mt-2">
                  <p className="text-red-300/90">缺失节点：</p>
                  <ul className="mt-1 list-disc pl-5">
                    {stageInfo.gate.missingMilestones.map((key) => (
                      <li key={key}>{MILESTONE_LABELS[key] || key}</li>
                    ))}
                  </ul>
                </div>
              )}
              {stageInfo.gate.failedMetrics.length > 0 && (
                <div className="mt-2">
                  <p className="text-red-300/90">风险问题：</p>
                  <ul className="mt-1 list-disc pl-5">
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

      <Card className="border-zinc-700 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-base">任务运行统计</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-xs text-zinc-400">全部任务</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              <StatBlock label="全部" value={data.taskStats.total} />
              {Object.entries(TASK_STATUS_LABELS).map(([status, label]) => (
                <StatBlock key={status} label={label} value={data.taskStats[status] || 0} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-zinc-400">当前阶段（{stageInfo.stageConfig.name}）</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatBlock label="当前阶段任务" value={data.currentStageTaskStats.total} />
              <StatBlock label="已完成" value={data.currentStageTaskStats.COMPLETED || 0} />
              <StatBlock
                label="进行中"
                value={(data.currentStageTaskStats.IN_PROGRESS || 0) + (data.currentStageTaskStats.RESOLVING || 0)}
              />
              <StatBlock label="待处理" value={data.currentStageTaskStats.PENDING || 0} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-700 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-base">风险指标</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.risks.map((metric) => (
            <div key={metric.key} className="space-y-1">
              <div className="flex justify-between text-sm text-zinc-300">
                <span>{metric.label}</span>
                <span className={metric.risk ? riskTextClass(metric.value) : ""}>
                  {metric.value}
                  {metric.levelLabel && <span className="ml-2 text-xs">{metric.levelLabel}</span>}
                </span>
              </div>
              <Progress
                value={metric.value}
                className={`h-2 ${metric.risk ? riskBarClass(metric.value) : ""}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
