import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/SiteHeader";
import { RankingTable } from "@/components/RankingTable";
import { getCurrentUserId } from "@/lib/session";
import { getProjectState, getStageDisplayInfo, STAGE_GATE_STATUS_LABELS } from "@/game/projectEngine";
import { getRanking } from "@/game/taskEngine";
import { generateDailyReport } from "@/game/dailyReportEngine";

export default async function HomePage() {
  const userId = await getCurrentUserId();
  const project = await getProjectState();
  const ranking = await getRanking(3);
  const report = await generateDailyReport();
  const stageInfo = project ? getStageDisplayInfo(project) : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <section className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-amber-400 sm:text-3xl">异界项目部：天穹综合体</h1>
          <p className="text-zinc-400">按建设阶段推进 · 关键节点驱动主线</p>
        </section>

        <Card className="border-amber-900/40 bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="text-amber-400">当前建设主线</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
            {project && stageInfo ? (
              <>
                <p>当前阶段：{stageInfo.stageConfig.name}</p>
                <p>阶段进度：{project.stageProgress}%</p>
                <p>总体进度：{project.overallProgress}%</p>
                <p>阶段门：{STAGE_GATE_STATUS_LABELS[project.stageGateStatus] || project.stageGateStatus}</p>
                <p className="sm:col-span-2 text-zinc-400">{stageInfo.stageConfig.description}</p>
              </>
            ) : (
              <p>项目尚未初始化</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-700 bg-zinc-900/80">
          <CardHeader>
            <CardTitle>今日日报摘要</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-zinc-300">{report.content.slice(0, 400)}...</pre>
          </CardContent>
        </Card>

        <RankingTable entries={ranking} />

        <div className="flex flex-col gap-2 sm:flex-row">
          {userId ? (
            <Link href="/project" className={cn(buttonVariants(), "flex-1 text-center")}>
              进入项目
            </Link>
          ) : (
            <Link href="/register" className={cn(buttonVariants(), "flex-1 text-center")}>
              注册加入
            </Link>
          )}
          <Link href="/tasks" className={cn(buttonVariants({ variant: "outline" }), "flex-1 text-center")}>
            任务大厅
          </Link>
        </div>
      </main>
    </div>
  );
}
