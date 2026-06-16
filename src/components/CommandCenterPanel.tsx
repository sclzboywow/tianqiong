import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectState } from "@prisma/client";
import { getStageConfig } from "@/game/projectStages";
import { getStageRecommendations } from "@/game/locationEngine";
import { listTasks } from "@/game/taskEngine";

type CommandCenterPanelProps = {
  project: ProjectState;
};

export async function CommandCenterPanel({ project }: CommandCenterPanelProps) {
  const stageConfig = getStageConfig(project.currentStage);
  const tasks = await listTasks();
  const recommendations = getStageRecommendations(project, tasks);

  return (
    <Card className="border-amber-900/40 bg-zinc-900/80">
      <CardHeader>
        <CardTitle className="text-amber-400">项目指挥中心</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 text-sm text-zinc-300">
          <Badge variant="outline">当前阶段：{stageConfig?.name}</Badge>
          <Badge variant="outline">阶段进度：{project.stageProgress}%</Badge>
          <Badge variant="outline">总体进度：{project.overallProgress}%</Badge>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-200">今日建议</p>
          {recommendations.length === 0 ? (
            <p className="text-sm text-zinc-400">当前阶段推荐地点尚未解锁，请先在协同地图查看解锁条件。</p>
          ) : (
            <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-300">
              {recommendations.map((item, index) => (
                <li key={item.location.id}>
                  <Link href={`/locations/${item.location.id}`} className="text-amber-400 hover:underline">
                    去{item.location.name}
                  </Link>
                  {item.activeTaskCount > 0 && (
                    <span className="ml-1 text-zinc-500">（{item.activeTaskCount} 个待处理）</span>
                  )}
                </li>
              ))}
              <li>
                <Link href="/locations" className="text-amber-400 hover:underline">
                  去协同地图查看更多地点
                </Link>
              </li>
            </ol>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-200">快捷入口</p>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/locations", label: "协同地图" },
              { href: "/tasks", label: "任务大厅" },
              { href: "/ops/project-overview", label: "项目总控" },
              { href: "/profile", label: "角色状态" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
