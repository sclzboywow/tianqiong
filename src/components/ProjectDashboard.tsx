import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { displayProgress } from "@/utils/clamp";
import { METRIC_LABELS } from "@/game/types";
import { getRiskList } from "@/game/projectEngine";
import type { ProjectState } from "@prisma/client";

interface ProjectDashboardProps {
  project: ProjectState;
}

const METRICS: (keyof ProjectState)[] = [
  "progress",
  "quality",
  "safety",
  "cost",
  "dataIntegrity",
  "fireRisk",
  "ownerTrust",
  "propertyHandover",
];

export function ProjectDashboard({ project }: ProjectDashboardProps) {
  const risks = getRiskList(project);
  const totalDays = Number(process.env.SEASON_TOTAL_DAYS || 30);
  const remainingDays = Math.max(0, totalDays - project.dayCount);

  return (
    <div className="space-y-4">
      <Card className="border-amber-900/40 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-amber-400">项目总览 · {project.currentStage}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">第 {project.dayCount} 天</Badge>
            <Badge variant="outline">剩余 {remainingDays} 天</Badge>
            <Badge variant="outline">状态 {project.status}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {METRICS.map((key) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-sm text-zinc-300">
                  <span>{METRIC_LABELS[key] || key}</span>
                  <span>{displayProgress(project[key] as number)}</span>
                </div>
                <Progress value={displayProgress(project[key] as number)} className="h-2" />
              </div>
            ))}
          </div>
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
