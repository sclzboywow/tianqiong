"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Plus,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ProjectFlowData,
  ProjectFlowEventCard,
  ProjectFlowTask,
} from "@/game/projectFlowLoader";
import { cn } from "@/lib/utils";

function EditNodeLink({
  slug,
  tab,
  children,
}: {
  slug: string;
  tab: "task" | "action" | "story" | "events" | "basic";
  children: ReactNode;
}) {
  return (
    <Link
      href={`/ops/project-flow/node/${slug}?tab=${tab}`}
      className="inline-flex items-center gap-1 text-xs text-sky-300 hover:text-sky-200"
    >
      {children} <ArrowRight className="size-3" />
    </Link>
  );
}

function NamedList({
  empty = "暂无",
  items,
}: {
  empty?: string;
  items: { slug: string; name: string; status?: string }[];
}) {
  if (items.length === 0) return <span className="text-zinc-600">{empty}</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={`${item.slug}:${item.status || ""}`}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
        >
          {item.name}
          {item.status ? ` · ${item.status}` : ""}
          <span className="ml-1 text-[10px] text-zinc-500">{item.slug}</span>
        </span>
      ))}
    </div>
  );
}

function EventCard({
  event,
  compact = false,
  taskSlug,
}: {
  event: ProjectFlowEventCard;
  compact?: boolean;
  taskSlug?: string;
}) {
  return (
    <div className="rounded-lg border border-amber-900/50 bg-amber-950/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-amber-100">{event.title}</p>
          <p className="font-mono text-[10px] text-zinc-600">{event.slug}</p>
        </div>
        <Badge variant="outline" className="border-amber-700/60 text-amber-300">
          {event.businessType}
        </Badge>
      </div>
      {event.description ? (
        <p className="mt-2 text-xs leading-5 text-zinc-400">
          {event.description}
        </p>
      ) : null}
      {!compact ? (
        <div className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
          <p>触发阶段：{event.triggerStage || "不限"}</p>
          <p>触发权重：{event.weight ?? 10}</p>
          <p>触发地点：{event.triggerLocationSlugs?.join("、") || "不限"}</p>
          <p>触发对象：{event.triggerNpcNames?.join("、") || "不限"}</p>
          <p>
            触发频率：
            {event.onceOnly ? "仅一次" : `冷却 ${event.cooldownDays ?? 0} 天`}
          </p>
          <p>风险标签：{event.riskTags?.join("、") || "—"}</p>
          <p>
            成果物影响：
            {event.artifactEffects
              ?.map((item) => `${item.artifactSlug}→${item.status}`)
              .join("、") || "—"}
          </p>
          <p>
            指标影响：
            {Object.entries(event.metricEffects || {})
              .map(
                ([key, value]) =>
                  `${key} ${Number(value) > 0 ? "+" : ""}${value}`,
              )
              .join("、") || "—"}
          </p>
          <p>
            生成补正任务：
            {event.taskEffects?.map((item) => item.taskSlug).join("、") || "—"}
          </p>
          <p>触发结果：{event.resultText || "使用默认文案"}</p>
          <p>无任务结果：{event.noTaskText || "使用默认文案"}</p>
        </div>
      ) : null}
      {taskSlug ? (
        <div className="mt-3">
          <EditNodeLink slug={taskSlug} tab="events">
            调整事件规则
          </EditNodeLink>
        </div>
      ) : null}
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h4 className="mb-1.5 text-xs font-medium text-zinc-500">{title}</h4>
      <div className="text-sm text-zinc-200">{children}</div>
    </section>
  );
}

function TaskDetail({
  task,
  stageName,
  onClose,
}: {
  task: ProjectFlowTask;
  stageName: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label="流程节点详情"
    >
      <button
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="关闭详情"
      />
      <aside className="relative h-full w-full max-w-2xl overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <p className="text-xs text-sky-300">{stageName}</p>
            <h2 className="mt-1 text-xl font-semibold">{task.title}</h2>
            <p className="mt-1 font-mono text-xs text-zinc-600">{task.slug}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-zinc-400 hover:bg-zinc-900"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="grid gap-5 py-5 sm:grid-cols-2">
          <DetailSection title="任务说明">
            <p className="leading-6 text-zinc-300">
              {task.description || "尚未填写任务说明"}
            </p>
          </DetailSection>
          <DetailSection title="当前配置状态">
            {task.configurationIssues.length ? (
              <div>
                <p className="text-amber-300">
                  {task.configurationIssues.length} 项待完善
                </p>
                <ul className="mt-1 space-y-1 text-xs text-amber-200/80">
                  {task.configurationIssues.map((issue) => (
                    <li key={issue}>· {issue}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <span className="text-emerald-300">配置完整</span>
            )}
          </DetailSection>
          <DetailSection title="办理地点">
            <NamedList items={task.locationNames} />
          </DetailSection>
          <DetailSection title="协同对象 / 部门">
            {task.npcNames.length ? (
              task.npcNames.join("、")
            ) : (
              <span className="text-zinc-600">暂无</span>
            )}
          </DetailSection>
          <DetailSection title="前置成果物">
            <NamedList items={task.inputArtifactLabels} />
          </DetailSection>
          <DetailSection title="完成后产出">
            <NamedList items={task.outputArtifactLabels} />
          </DetailSection>
          <DetailSection title="解锁关键节点">
            {task.milestoneLabels.length ? (
              task.milestoneLabels.map((item) => (
                <p key={item.key}>
                  {item.label}
                  <span className="ml-1 font-mono text-[10px] text-zinc-600">
                    {item.key}
                  </span>
                </p>
              ))
            ) : (
              <span className="text-zinc-600">无</span>
            )}
          </DetailSection>
          <DetailSection title="地点行动入口">
            {task.actionSlugs.length ? (
              task.actionSlugs.map((item) => (
                <p key={item.slug}>
                  {item.label}
                  <span className="ml-1 font-mono text-[10px] text-zinc-600">
                    {item.slug}
                  </span>
                </p>
              ))
            ) : (
              <span className="text-zinc-600">暂无</span>
            )}
          </DetailSection>
          <DetailSection title="剧情片段">
            {task.stories.length ? (
              task.stories.map((story) => (
                <p key={story.slug}>
                  {story.title}
                  <span className="ml-1 font-mono text-[10px] text-zinc-600">
                    {story.slug}
                  </span>
                </p>
              ))
            ) : (
              <span className="text-zinc-600">暂无</span>
            )}
          </DetailSection>
          <DetailSection title="运行时阻塞原因">
            {task.runtime.blockingReasons.length ? (
              <ul className="space-y-1 text-amber-300">
                {task.runtime.blockingReasons.map((reason) => (
                  <li key={reason}>· {reason}</li>
                ))}
              </ul>
            ) : (
              <p className="text-emerald-300">
                当前项目状态已满足全部前置条件，可以办理。
              </p>
            )}
          </DetailSection>
        </div>
        <section className="border-t border-zinc-800 pt-5">
          <h3 className="mb-3 font-medium">关联补正 / 风险事件</h3>
          <div className="space-y-3">
            {task.events.length ? (
              task.events.map((event) => (
                <EventCard
                  key={event.slug}
                  event={event}
                  taskSlug={task.slug}
                />
              ))
            ) : (
              <p className="text-sm text-zinc-600">当前节点未挂载事件。</p>
            )}
          </div>
        </section>
        <section className="mt-5 border-t border-zinc-800 pt-5">
          <div className="rounded-lg border border-sky-900/60 bg-sky-950/15 p-4">
            <h3 className="font-medium text-zinc-100">调整流程节点</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              在同一个节点工作台中调整任务、办理地点、成果物、剧情和事件，不再分别进入数据表单。
            </p>
            <Link
              href={`/ops/project-flow/node/${task.slug}`}
              className={cn(buttonVariants({ size: "sm" }), "mt-3 gap-1")}
            >
              进入节点编排 <ArrowRight className="size-3" />
            </Link>
          </div>
        </section>
      </aside>
    </div>
  );
}

export function ProjectFlowPanel({ data }: { data: ProjectFlowData }) {
  const [selected, setSelected] = useState<{
    task: ProjectFlowTask;
    stageName: string;
  } | null>(null);
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sky-400">
            建设项目内容工作台
          </p>
          <h1 className="mt-1 text-2xl font-semibold">项目流程编排</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            围绕项目阶段查看流程任务、办理地点、成果物依赖、补正事件和剧情包装。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/ops/project-flow/new-node"
            className={cn(buttonVariants({ size: "sm" }), "gap-1")}
          >
            <Plus className="size-4" />
            新增流程节点
          </Link>
          <Link
            href="/ops/content-studio"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            内容资产
          </Link>
          <Link
            href="/ops/content-orchestration"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            技术视图
          </Link>
          <a
            href="/admin"
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            系统维护
          </a>
        </div>
      </header>
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline">流程任务 {data.summary.tasks}</Badge>
        <Badge variant="outline">事件 {data.summary.events}</Badge>
        <Badge variant="outline">
          当前阶段{" "}
          {data.stages.find((stage) => stage.id === data.summary.currentStage)
            ?.name || "未初始化"}
        </Badge>
        <Badge variant={data.summary.blockedTasks ? "outline" : "default"}>
          等待前置 {data.summary.blockedTasks}
        </Badge>
        <Badge variant={data.summary.issues ? "outline" : "default"}>
          配置待完善 {data.summary.issues}
        </Badge>
        <Link href="/ops/content-orchestration?tab=health">
          <Badge
            variant={data.summary.healthFailures ? "destructive" : "outline"}
            className="cursor-pointer"
          >
            健康检查 {data.summary.healthFailures} 错误 /{" "}
            {data.summary.healthWarnings} 警告
          </Badge>
        </Link>
      </div>
      <nav
        className="sticky top-[57px] z-30 flex gap-2 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/95 p-2 backdrop-blur"
        aria-label="项目阶段导航"
      >
        {data.stages.map((stage) => (
          <a
            key={stage.id}
            href={`#stage-${stage.id}`}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-xs transition",
              stage.id === data.summary.currentStage
                ? "bg-sky-900/60 text-sky-200"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
            )}
          >
            {stage.name}
            <span className="ml-1 text-zinc-600">{stage.tasks.length}</span>
          </a>
        ))}
      </nav>
      {data.stages.map((stage, index) => (
        <Card
          key={stage.id}
          id={`stage-${stage.id}`}
          className="scroll-mt-28 border-zinc-800 bg-zinc-900/60"
        >
          <CardHeader className="border-b border-zinc-800/80">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-sky-950 text-sm font-semibold text-sky-300">
                  {index + 1}
                </span>
                <div>
                  <CardTitle className="text-base">{stage.name}</CardTitle>
                  <p className="mt-1 max-w-4xl text-sm text-zinc-400">
                    {stage.description}
                  </p>
                </div>
              </div>
              <Badge variant="outline">{stage.tasks.length} 个流程节点</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="mr-1 text-xs text-zinc-500">阶段完成条件</span>
              {stage.requiredMilestones.length ? (
                stage.requiredMilestones.map((item) => (
                  <Badge
                    key={item.key}
                    variant="outline"
                    className="border-zinc-700 text-zinc-300"
                  >
                    {item.label}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-zinc-600">无</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {stage.tasks.length ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {stage.tasks.map((task) => (
                  <button
                    key={task.slug}
                    type="button"
                    onClick={() => setSelected({ task, stageName: stage.name })}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-left transition hover:border-sky-800 hover:bg-zinc-950"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-zinc-100">
                          {task.title}
                        </h3>
                        <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
                          {task.slug}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.runtime.available ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-800 text-emerald-300"
                          >
                            可办理
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-800 text-amber-300"
                          >
                            等待前置
                          </Badge>
                        )}
                        {task.configurationIssues.length ? (
                          <AlertTriangle className="size-4 text-amber-400" />
                        ) : (
                          <CheckCircle2 className="size-4 text-emerald-400" />
                        )}
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-zinc-400">
                      {task.description || "尚未填写任务说明"}
                    </p>
                    <div className="mt-3 grid gap-2 text-xs text-zinc-500 sm:grid-cols-2">
                      <p className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {task.locationNames
                          .map((item) => item.name)
                          .join("、") || "未配置办理地点"}
                      </p>
                      <p>协同对象：{task.npcNames.join("、") || "未配置"}</p>
                      <p>
                        前置成果物：
                        {task.inputArtifactLabels
                          .map((item) => item.name)
                          .join("、") || "无"}
                      </p>
                      <p>
                        完成后产出：
                        {task.outputArtifactLabels
                          .map((item) => item.name)
                          .join("、") || "无"}
                      </p>
                      <p>地点行动：{task.actionSlugs.length}</p>
                      <p>
                        事件 / 剧情：{task.events.length} /{" "}
                        {task.stories.length}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-800 py-8 text-center text-sm text-zinc-600">
                该阶段尚未配置流程节点
              </div>
            )}
            {stage.events.length ? (
              <details>
                <summary className="cursor-pointer text-sm text-amber-300">
                  查看本阶段事件池（{stage.events.length}）
                </summary>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  {stage.events.map((event) => (
                    <EventCard key={event.slug} event={event} compact />
                  ))}
                </div>
              </details>
            ) : null}
          </CardContent>
        </Card>
      ))}
      {selected ? (
        <TaskDetail
          task={selected.task}
          stageName={selected.stageName}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}
