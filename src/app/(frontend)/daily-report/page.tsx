import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateDailyReport } from "@/game/dailyReportEngine";
import { displayProgress } from "@/utils/clamp";
import { METRIC_LABELS } from "@/game/types";

export default async function DailyReportPage() {
  const report = await generateDailyReport();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        <h1 className="text-xl font-bold text-amber-400">项目日报</h1>

        <Card className="border-amber-900/40 bg-zinc-900/80">
          <CardHeader>
            <CardTitle>今日项目指标</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            {report.project &&
              Object.entries(METRIC_LABELS).map(([key, label]) => {
                const value = report.project?.[key as keyof typeof report.project];
                if (typeof value !== "number") return null;
                return (
                  <p key={key}>
                    {label}：{displayProgress(value)}
                  </p>
                );
              })}
          </CardContent>
        </Card>

        <Card className="border-zinc-700 bg-zinc-900/80">
          <CardHeader>
            <CardTitle>今日重大事件</CardTitle>
          </CardHeader>
          <CardContent>
            {report.majorEvents.length ? (
              <ul className="list-disc space-y-1 pl-4 text-sm text-zinc-300">
                {report.majorEvents.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-400">暂无</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-700 bg-zinc-900/80">
          <CardHeader>
            <CardTitle>完整日报</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-zinc-300">{report.content}</pre>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
