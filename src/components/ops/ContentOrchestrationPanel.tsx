"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContentHealthCheckReport } from "@/game/contentHealthCheck";
import type { ContentOrchestrationData } from "@/game/contentOrchestrationLoader";
import { countStageStats } from "@/game/contentOrchestrationHealth";
import { payloadAdminUrl } from "@/lib/payloadAdminUrl";

type TabId =
  | "overview"
  | "tasks"
  | "artifacts"
  | "actions"
  | "events"
  | "stories"
  | "cleanup"
  | "health";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "主线总览" },
  { id: "tasks", label: "阶段任务矩阵" },
  { id: "artifacts", label: "成果物流转" },
  { id: "actions", label: "地点行动挂载" },
  { id: "events", label: "事件池挂载" },
  { id: "stories", label: "剧情入口校验" },
  { id: "cleanup", label: "旧数据清理" },
  { id: "health", label: "健康检查" },
];

type ContentOrchestrationPanelProps = {
  data: ContentOrchestrationData;
  healthReport: ContentHealthCheckReport;
};

function adminLink(
  collection: string,
  docId?: string | number,
  slug?: string,
): { href: string; missing: boolean } {
  if (docId != null) {
    return { href: payloadAdminUrl(collection, docId), missing: false };
  }
  return {
    href: payloadAdminUrl(collection),
    missing: Boolean(slug),
  };
}

function TaskRow({
  task,
  showStage,
}: {
  task: ContentOrchestrationData["allTasks"][number];
  showStage?: boolean;
}) {
  const taskLink = adminLink("task-templates", task.payloadDocId, task.slug);
  const storyLink = adminLink("story-entries", task.storyEntryDocId, task.relatedStorySlug);

  return (
    <tr className="border-b border-zinc-800/80 text-sm">
      <td className="py-2 pr-3 align-top">
        <p className="font-medium text-zinc-100">{task.title}</p>
        <p className="font-mono text-xs text-zinc-500">{task.slug}</p>
      </td>
      {showStage ? (
        <td className="py-2 pr-3 text-zinc-400">{task.stage || "—"}</td>
      ) : null}
      <td className="py-2 pr-3 text-zinc-400">{task.category || "—"}</td>
      <td className="py-2 pr-3 text-zinc-400">{task.stageProgress ?? "—"}</td>
      <td className="py-2 pr-3 font-mono text-xs text-zinc-500">
        {(task.prerequisiteTaskSlugs || []).join(", ") || "—"}
      </td>
      <td className="py-2 pr-3 font-mono text-xs text-zinc-500">
        {task.inputArtifacts.join(", ") || "—"}
      </td>
      <td className="py-2 pr-3 font-mono text-xs text-zinc-500">
        {task.outputArtifacts.join(", ") || "—"}
      </td>
      <td className="py-2 pr-3 font-mono text-xs text-zinc-500">
        {task.relatedActionSlugs.join(", ") || "—"}
      </td>
      <td className="py-2 pr-3 font-mono text-xs text-zinc-500">
        {task.relatedStorySlug || "—"}
      </td>
      <td className="py-2 align-top">
        <div className="flex flex-wrap gap-1">
          <a
            href={taskLink.href}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
          >
            任务
          </a>
          {task.relatedStorySlug ? (
            <a
              href={storyLink.href}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
            >
              剧情
            </a>
          ) : null}
          <Link
            href={`/ops/content-studio?tab=debug&task=${task.slug}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs")}
          >
            依赖
          </Link>
        </div>
        {taskLink.missing ? (
          <p className="mt-1 text-xs text-amber-400">后台记录缺失，请先 payload:seed:local</p>
        ) : null}
        {task.seedOnly ? (
          <p className="mt-1 text-xs text-amber-400">仅 seed 基准，Payload 未同步</p>
        ) : null}
      </td>
    </tr>
  );
}

export function ContentOrchestrationPanel({ data, healthReport }: ContentOrchestrationPanelProps) {
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">项目主线编排</h1>
          <p className="mt-1 text-sm text-zinc-400">
            从建设项目流程视角串联任务、成果物、地点行动、事件与剧情入口。
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">配置态 · Payload</Badge>
            <Badge variant="outline">基准态 · 静态 seed</Badge>
            <Badge variant="outline">运行态 · 主线调试</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/ops/content-studio"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            内容编排台
          </Link>
          <Link
            href="/ops/content-studio?tab=mainline"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            主线调试
          </Link>
          <a
            href="/admin"
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Payload 后台
          </a>
        </div>
      </div>

      {!data.cleanup.clean ? (
        <Card className="border-amber-800/50 bg-amber-950/20">
          <CardContent className="p-4 text-sm text-amber-200">
            检测到旧 Chapter1 数据残留。建议执行{" "}
            <span className="font-mono">npm run cleanup:legacy-chapter1:apply</span>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              buttonVariants({ variant: tab === item.id ? "default" : "outline", size: "sm" }),
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <section className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-100">总体统计（基准态）</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "正式主线任务", value: data.overview.mainlineTaskCount },
                { label: "补正任务", value: data.overview.correctionTaskCount },
                { label: "成果物定义", value: data.overview.artifactCount },
                { label: "建设项目地点行动", value: data.overview.constructionActionCount },
                { label: "建设项目事件", value: data.overview.constructionEventCount },
                { label: "通用 Ink 套数", value: data.overview.genericInkCount },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                  <p className="text-xs text-zinc-500">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-zinc-100">{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {data.stages.map((stage) => {
              const stats = countStageStats(stage);
              return (
                <Card key={stage.stageId} className="border-zinc-800 bg-zinc-900/80">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base text-zinc-100">
                        {stage.stageName}（{stage.stageId}）
                      </CardTitle>
                      <Badge variant={stage.stageGateReady ? "default" : "outline"}>
                        stageProgress {stage.stageProgressSum}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-zinc-400">
                    <p>
                      主线 {stats.tasks} · 补正 {stats.corrections} · 成果物 {stats.artifacts} ·
                      地点行动 {stats.actions} · 建设事件 {stats.events}
                    </p>
                    <p className="font-mono text-xs text-zinc-500">
                      requiredMilestones: {stage.requiredMilestones.join(", ") || "—"}
                    </p>
                    {stage.warnings.length > 0 ? (
                      <ul className="text-xs text-amber-300/90">
                        {stage.warnings.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      {tab === "tasks" ? (
        <section className="space-y-8">
          {data.stages.map((stage) => (
            <div key={stage.stageId}>
              <h2 className="mb-3 text-lg font-medium text-zinc-200">
                {stage.stageName} · 主线任务（{stage.tasks.length}）
              </h2>
              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full min-w-[960px] px-2 text-left">
                  <thead className="bg-zinc-950/80 text-xs text-zinc-500">
                    <tr>
                      <th className="p-2">任务</th>
                      <th className="p-2">category</th>
                      <th className="p-2">stageProgress</th>
                      <th className="p-2">前置任务</th>
                      <th className="p-2">输入成果物</th>
                      <th className="p-2">输出成果物</th>
                      <th className="p-2">地点行动</th>
                      <th className="p-2">StoryEntry</th>
                      <th className="p-2">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stage.tasks.map((task) => (
                      <TaskRow key={task.slug} task={task} />
                    ))}
                  </tbody>
                </table>
              </div>
              {stage.correctionTasks.length > 0 ? (
                <>
                  <h3 className="mb-2 mt-4 text-sm font-medium text-zinc-400">
                    补正任务（不计入正式主线计数）
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-zinc-800">
                    <table className="w-full min-w-[960px] text-left">
                      <tbody>
                        {stage.correctionTasks.map((task) => (
                          <TaskRow key={task.slug} task={task} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      {tab === "artifacts" ? (
        <section className="space-y-6">
          {data.terminalTask ? (
            <Card className="border-emerald-900/40 bg-emerald-950/10">
              <CardHeader>
                <CardTitle className="text-base text-emerald-300">
                  终局任务 · {data.terminalTask.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-mono text-zinc-400">{data.terminalTask.slug}</p>
                <p className="text-zinc-300">所需成果物及产出任务：</p>
                <ul className="space-y-1 font-mono text-xs text-zinc-400">
                  {[
                    "approval_reply",
                    "planning_condition",
                    "drawing_review_certificate",
                    "construction_contract",
                    "supervision_contract",
                    "quality_safety_supervision",
                    "funding_certificate",
                  ].map((slug) => {
                    const art = data.artifacts.find((a) => a.slug === slug);
                    return (
                      <li key={slug}>
                        {slug} ← {(art?.producedBy || []).join(" → ") || "无产出任务"}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-zinc-950/80 text-xs text-zinc-500">
                <tr>
                  <th className="p-2">成果物</th>
                  <th className="p-2">阶段</th>
                  <th className="p-2">产出</th>
                  <th className="p-2">依赖</th>
                  <th className="p-2">事件影响</th>
                  <th className="p-2">主线使用</th>
                </tr>
              </thead>
              <tbody>
                {data.artifacts.map((art) => (
                  <tr key={art.slug} className="border-b border-zinc-800/80">
                    <td className="p-2">
                      <p className="text-zinc-100">{art.name}</p>
                      <p className="font-mono text-xs text-zinc-500">{art.slug}</p>
                    </td>
                    <td className="p-2 text-zinc-400">{art.stage || "—"}</td>
                    <td className="p-2 font-mono text-xs text-zinc-500">
                      {art.producedBy.join(", ") || "—"}
                    </td>
                    <td className="p-2 font-mono text-xs text-zinc-500">
                      {art.requiredBy.join(", ") || "—"}
                    </td>
                    <td className="p-2 font-mono text-xs text-zinc-500">
                      {art.affectedByEvents.join(", ") || "—"}
                    </td>
                    <td className="p-2">{art.usedByMainline ? "是" : "否"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "actions" ? (
        <section className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-zinc-950/80 text-xs text-zinc-500">
              <tr>
                <th className="p-2">行动</th>
                <th className="p-2">地点</th>
                <th className="p-2">解锁阶段</th>
                <th className="p-2">触发任务</th>
                <th className="p-2">风险</th>
                <th className="p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {data.allActions.map((action) => (
                <tr
                  key={action.slug}
                  className={cn(
                    "border-b border-zinc-800/80",
                    action.risks.length > 0 && "bg-rose-950/10",
                  )}
                >
                  <td className="p-2">
                    <p className="text-zinc-100">{action.label}</p>
                    <p className="font-mono text-xs text-zinc-500">{action.slug}</p>
                  </td>
                  <td className="p-2 font-mono text-xs text-zinc-500">{action.locationSlug}</td>
                  <td className="p-2 text-zinc-400">{action.unlockStage || "—"}</td>
                  <td className="p-2 font-mono text-xs text-zinc-500">
                    {action.triggerTaskSlugs.join(", ") || "—"}
                  </td>
                  <td className="p-2 text-xs text-rose-300">{action.risks.join("; ") || "—"}</td>
                  <td className="p-2">
                    <a
                      href={
                        adminLink("location-actions", action.payloadDocId, action.slug).href
                      }
                      target="_blank"
                      rel="noreferrer"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
                    >
                      编辑
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {tab === "events" ? (
        <section className="space-y-6">
          {(["construction", "site", "other"] as const).map((kind) => {
            const label =
              kind === "construction"
                ? "正式建设项目事件"
                : kind === "site"
                  ? "现场支线事件"
                  : "其他事件";
            const rows = data.allEvents.filter((e) => e.kind === kind);
            if (rows.length === 0) return null;
            return (
              <div key={kind}>
                <h2 className="mb-2 text-lg font-medium text-zinc-200">
                  {label}（{rows.length}）
                </h2>
                <div className="overflow-x-auto rounded-lg border border-zinc-800">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <tbody>
                      {rows.map((event) => (
                        <tr
                          key={event.slug}
                          className={cn(
                            "border-b border-zinc-800/80",
                            event.risks.length > 0 && "bg-rose-950/10",
                          )}
                        >
                          <td className="p-2 w-48">
                            <p className="text-zinc-100">{event.title}</p>
                            <p className="font-mono text-xs text-zinc-500">{event.slug}</p>
                          </td>
                          <td className="p-2 text-zinc-400">{event.triggerStage || "—"}</td>
                          <td className="p-2 font-mono text-xs text-zinc-500">
                            {(event.triggerTaskSlugs || []).join(", ") || "—"}
                          </td>
                          <td className="p-2 text-xs text-rose-300">
                            {event.risks.join("; ") || "—"}
                          </td>
                          <td className="p-2">
                            <a
                              href={
                                adminLink("event-templates", event.payloadDocId, event.slug).href
                              }
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "text-xs",
                              )}
                            >
                              编辑
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </section>
      ) : null}

      {tab === "stories" ? (
        <section className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-zinc-950/80 text-xs text-zinc-500">
              <tr>
                <th className="p-2">StoryEntry</th>
                <th className="p-2">inkFile</th>
                <th className="p-2">关联任务</th>
                <th className="p-2">风险</th>
                <th className="p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {data.allStoryEntries.map((entry) => (
                <tr
                  key={entry.slug}
                  className={cn(
                    "border-b border-zinc-800/80",
                    entry.risks.length > 0 && "bg-rose-950/10",
                  )}
                >
                  <td className="p-2">
                    <p className="text-zinc-100">{entry.title}</p>
                    <p className="font-mono text-xs text-zinc-500">{entry.slug}</p>
                  </td>
                  <td className="p-2 font-mono text-xs text-zinc-500">{entry.inkFile || "—"}</td>
                  <td className="p-2 font-mono text-xs text-zinc-500">
                    {entry.relatedTaskSlugs.join(", ") || "—"}
                  </td>
                  <td className="p-2 text-xs text-rose-300">{entry.risks.join("; ") || "—"}</td>
                  <td className="p-2">
                    <a
                      href={adminLink("story-entries", entry.payloadDocId, entry.slug).href}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
                    >
                      编辑
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {tab === "cleanup" ? (
        <section>
          <Card
            className={cn(
              "border-zinc-800",
              data.cleanup.clean ? "bg-emerald-950/20" : "bg-amber-950/20",
            )}
          >
            <CardHeader>
              <CardTitle className="text-lg text-zinc-100">
                {data.cleanup.clean ? "旧数据已清理" : "旧数据残留"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {!data.cleanup.clean ? (
                <p className="text-amber-200">
                  执行{" "}
                  <span className="font-mono">npm run cleanup:legacy-chapter1:apply</span>
                </p>
              ) : null}
              {(
                [
                  ["旧任务", data.cleanup.oldTasks],
                  ["旧事件", data.cleanup.oldEvents],
                  ["旧 StoryEntry", data.cleanup.oldStoryEntries],
                  ["旧地点行动", data.cleanup.oldLocationActions],
                  ["旧 Ink", data.cleanup.oldInkFiles],
                ] as const
              ).map(([label, items]) => (
                <div key={label}>
                  <p className="mb-1 font-medium text-zinc-300">{label}</p>
                  <ul className="font-mono text-xs text-zinc-500">
                    {items
                      .filter((i) => i.found)
                      .map((i) => (
                        <li key={i.slug} className="text-amber-300">
                          {i.slug} ({i.source})
                        </li>
                      ))}
                    {items.every((i) => !i.found) ? (
                      <li className="text-emerald-400">无残留</li>
                    ) : null}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {tab === "health" ? (
        <section className="space-y-4">
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader>
              <CardTitle className="text-base text-zinc-100">{data.health.summary}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {data.health.errors.length > 0 ? (
                <ul className="space-y-1 text-rose-300">
                  {data.health.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              ) : null}
              {data.health.warnings.slice(0, 30).map((w) => (
                <p key={w} className="text-amber-300/90 text-xs">
                  {w}
                </p>
              ))}
            </CardContent>
          </Card>
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader>
              <CardTitle className="text-base text-zinc-100">content:check 摘要</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-400">
              <p>
                通过 {healthReport.passCount} · 失败 {healthReport.failCount} · 警告{" "}
                {healthReport.warnCount}
              </p>
              <Link
                href="/ops/content-studio?tab=debug"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "mt-3 inline-flex",
                )}
              >
                打开依赖调试
              </Link>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
