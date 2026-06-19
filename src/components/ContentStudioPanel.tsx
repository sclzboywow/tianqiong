import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ContentHealthCheckReport } from "@/game/contentHealthCheck";
import type { ContentStudioData } from "@/game/contentStudioLoader";
import { buildChapter1AcceptanceFromStudio } from "@/game/chapter1Acceptance";
import {
  getActionsForLocationStudio,
  getEventsForLocationStudio,
  getLocationStudioRow,
  getTaskTemplateBySlug,
  payloadAdminUrl,
} from "@/game/contentStudioLoader";
import { type EventTemplateData, type StoryEntryData, type TaskTemplateData, type MetricEffects, type ChoiceEffectsMap } from "@/game/types";
import { PROJECT_STAGES } from "@/game/projectStages";
import {
  formatChoiceEffectLines,
  formatMetricEffectLines,
  formatMilestoneEffectLines,
  formatResolutionMode,
} from "@/game/taskEffectDisplay";
import type { LocationAction } from "@/data/locationActions";
import { ContentStudioArtifactPanel, ContentStudioDependencyDebugPanel } from "@/components/ops/ContentStudioArtifactPanel";
import { ContentStudioDependencyFlow } from "@/components/ops/ContentStudioDependencyFlow";
import { ContentStudioMainlineDebugPanel } from "@/components/ops/ContentStudioMainlineDebugPanel";

export type ContentStudioTab = "overview" | "deliverables" | "dependency" | "debug" | "mainline";

type ContentStudioPanelProps = {
  data: ContentStudioData;
  healthReport: ContentHealthCheckReport;
  selectedLocationId?: string;
  activeTab?: ContentStudioTab;
};

function stageLabel(stageId?: string) {
  if (!stageId) return "—";
  return PROJECT_STAGES.find((stage) => stage.id === stageId)?.name || stageId;
}

function formatMetricEffects(effects?: MetricEffects) {
  return formatMetricEffectLines(effects);
}

function formatMilestoneEffects(effects?: Record<string, boolean>) {
  return formatMilestoneEffectLines(effects);
}

function formatChoiceEffects(effects?: ChoiceEffectsMap) {
  return formatChoiceEffectLines(effects);
}

function formatActionCosts(action: LocationAction) {
  const parts: string[] = [];
  if (action.staminaCost) parts.push(`体力 ${action.staminaCost}`);
  if (action.spiritCost) parts.push(`精神 ${action.spiritCost}`);
  return parts.length > 0 ? parts.join(" / ") : "无消耗";
}

function formatActionRequirements(action: LocationAction) {
  const parts: string[] = [];
  if (action.minLevel) parts.push(`Lv.${action.minLevel}`);
  if (action.minReputation) parts.push(`声望 ${action.minReputation}`);
  return parts.length > 0 ? parts.join(" / ") : "无门槛";
}

function TaskTemplatePreview({ template, docId }: { template: TaskTemplateData; docId?: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-zinc-100">{template.title}</p>
          <p className="text-xs text-zinc-500 font-mono">{template.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{template.rarity}</Badge>
          <Badge variant="outline">{stageLabel(template.stage)}</Badge>
          {template.category ? <Badge variant="outline">{template.category}</Badge> : null}
        </div>
      </div>
      <div className="grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
        <p>区域：{template.area || "—"}</p>
        <p>来源：{template.sourceName || template.sourceType || "—"}</p>
        <p>结算模式：{formatResolutionMode(template.resolutionMode)}</p>
        <p>剧情入口：{template.storySlug || template.inkFile || "—"}</p>
        <p className="sm:col-span-2 font-mono text-xs text-zinc-500">Ink：{template.inkFile || "—"}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 text-xs">
        <div>
          <p className="mb-1 text-zinc-500">成功效果</p>
          <ul className="space-y-0.5 text-emerald-300/90">
            {formatMetricEffects(template.successEffects).map((line) => (
              <li key={`success-${line}`}>{line}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-zinc-500">失败效果</p>
          <ul className="space-y-0.5 text-rose-300/90">
            {formatMetricEffects(template.failEffects).map((line) => (
              <li key={`fail-${line}`}>{line}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-zinc-500">关键节点效果</p>
          <ul className="space-y-0.5 text-amber-300/90">
            {formatMilestoneEffects(template.milestoneEffects).map((line) => (
              <li key={`milestone-${line}`}>{line}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-zinc-500">选项效果</p>
          <ul className="space-y-0.5 text-sky-300/90">
            {formatChoiceEffects(template.choiceEffects).map((line) => (
              <li key={`choice-${line}`}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
      <Link
        href={payloadAdminUrl("task-templates", docId)}
        className="inline-block text-xs text-sky-400 hover:text-sky-300"
      >
        在 Payload 编辑任务模板 →
      </Link>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-1 text-zinc-600" aria-hidden>
      ↓
    </div>
  );
}

function countStoryReferences(data: ContentStudioData, storySlug: string) {
  const tasks = data.taskTemplates.filter((t) => t.storySlug === storySlug).length;
  const events = data.eventTemplates.filter((e) => e.storySlug === storySlug).length;
  const locations = data.locationActions.filter((a) => a.storySlug === storySlug).length;
  return { tasks, events, locations };
}

function contentHealthIssues(healthReport: ContentHealthCheckReport, slug: string, prefix: string) {
  const issues: string[] = [];
  for (const result of healthReport.results) {
    if (!result.name.startsWith(prefix)) continue;
    for (const failure of result.failures) {
      if (failure.startsWith(slug) || failure.startsWith(`${slug}:`)) {
        issues.push(failure);
      }
    }
  }
  return issues;
}

function eventHealthIssues(healthReport: ContentHealthCheckReport, eventSlug: string) {
  return contentHealthIssues(healthReport, eventSlug, "event-templates.");
}

function storyHealthIssues(healthReport: ContentHealthCheckReport, storySlug: string) {
  return [
    ...contentHealthIssues(healthReport, storySlug, "story-entries."),
    ...contentHealthIssues(healthReport, storySlug, "task-templates.storySlug"),
    ...contentHealthIssues(healthReport, storySlug, "event-templates.storySlug"),
  ];
}

function StoryEntryCard({
  entry,
  docId,
  data,
  healthReport,
}: {
  entry: StoryEntryData;
  docId?: string | number;
  data: ContentStudioData;
  healthReport: ContentHealthCheckReport;
}) {
  const refs = countStoryReferences(data, entry.slug);
  const issues = storyHealthIssues(healthReport, entry.slug);
  const healthy = issues.length === 0;

  return (
    <div className="rounded-lg border border-sky-900/40 bg-zinc-950/60 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-sky-200">{entry.title}</p>
          <p className="text-xs text-zinc-500 font-mono">{entry.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={healthy ? "default" : "destructive"}>{healthy ? "健康" : "异常"}</Badge>
          <Badge variant="outline">{entry.storyType}</Badge>
          <Badge variant="outline">{entry.status}</Badge>
        </div>
      </div>
      <div className="grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
        <p>阶段：{stageLabel(entry.stage)}</p>
        <p>启用：{entry.enabled === false ? "否" : "是"}</p>
        <p>引用：任务 {refs.tasks} · 事件 {refs.events} · 地点 {refs.locations}</p>
        <p className="sm:col-span-2 font-mono text-xs text-zinc-500">Ink：{entry.inkFile}</p>
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        <Link href={`/ops/story-preview/${entry.slug}`} className="text-sky-400 hover:text-sky-300">
          剧情预览 →
        </Link>
        <Link
          href={payloadAdminUrl("story-entries", docId)}
          className="text-sky-400 hover:text-sky-300"
        >
          在 Payload 编辑 →
        </Link>
      </div>
    </div>
  );
}

function EventPoolCard({
  event,
  docId,
  healthReport,
}: {
  event: EventTemplateData;
  docId?: string | number;
  healthReport: ContentHealthCheckReport;
}) {
  const issues = eventHealthIssues(healthReport, event.slug);
  const healthy = issues.length === 0;

  return (
    <div className="rounded-lg border border-violet-900/40 bg-zinc-950/60 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-violet-200">{event.title}</p>
          <p className="text-xs text-zinc-500 font-mono">{event.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={healthy ? "default" : "destructive"}>{healthy ? "健康" : "异常"}</Badge>
          <Badge variant="outline">{event.rarity}</Badge>
          <Badge variant="outline">权重 {event.weight ?? 10}</Badge>
        </div>
      </div>
      <div className="grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
        <p>触发阶段：{stageLabel(event.triggerStage)}</p>
        <p>地点：{event.triggerLocationSlugs?.join("、") || "任意"}</p>
        <p>风险标签：{event.riskTags?.join("、") || "—"}</p>
        <p>
          限制：{event.onceOnly ? "仅一次" : "可重复"}
          {(event.cooldownDays ?? 0) > 0 ? ` · 冷却 ${event.cooldownDays} 天` : ""}
        </p>
        <p className="sm:col-span-2">触发任务：{event.triggerTaskSlugs?.join("、") || "—"}</p>
        <p className="sm:col-span-2 font-mono text-xs text-zinc-500">Ink：{event.inkFile || "—"}</p>
      </div>
      {!healthy && (
        <ul className="space-y-0.5 text-xs text-rose-300/90">
          {issues.slice(0, 4).map((issue) => (
            <li key={issue}>— {issue}</li>
          ))}
        </ul>
      )}
      <Link
        href={payloadAdminUrl("event-templates", docId)}
        className="inline-block text-xs text-sky-400 hover:text-sky-300"
      >
        在 Payload 编辑事件模板 →
      </Link>
    </div>
  );
}

export function ContentStudioPanel({
  data,
  healthReport,
  selectedLocationId,
  activeTab = "overview",
}: ContentStudioPanelProps) {
  const selectedRow = getLocationStudioRow(data, selectedLocationId);
  const selectedActions = selectedLocationId
    ? getActionsForLocationStudio(data, selectedLocationId)
    : [];
  const selectedEvents = selectedLocationId
    ? getEventsForLocationStudio(data, selectedLocationId)
    : [];

  const overviewItems = [
    { label: "地图地点", value: data.overview.mapLocations },
    { label: "地点行动", value: data.overview.locationActions },
    { label: "任务模板", value: data.overview.taskTemplates },
    { label: "事件模板", value: data.overview.eventTemplates },
    { label: "剧情入口", value: data.overview.storyEntries },
    { label: "NPC", value: data.overview.npcs },
    { label: "区域", value: data.overview.areas },
    { label: "成果物", value: data.overview.artifactDefinitions },
  ];

  const tabLinks: { id: ContentStudioTab; label: string }[] = [
    { id: "overview", label: "总览" },
    { id: "deliverables", label: "成果物中心" },
    { id: "dependency", label: "依赖关系图" },
    { id: "debug", label: "依赖调试" },
    { id: "mainline", label: "主线调试" },
  ];

  const taskSlugs = data.taskTemplates.map((template) => template.slug);

  const chapter1Report = buildChapter1AcceptanceFromStudio(data);
  const chapter1Items = [
    { label: "主线任务", item: chapter1Report.tasks },
    { label: "StoryEntry", item: chapter1Report.storyEntries },
    { label: "Ink 文件", item: chapter1Report.inkFiles },
    { label: "地点行动", item: chapter1Report.locationActions },
    { label: "事件池", item: chapter1Report.events },
    { label: "阶段门节点", item: chapter1Report.stageGate },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">内容编排台</h1>
        <p className="mt-1 text-sm text-zinc-400">
          可视化查看地点、行动、任务与剧情之间的关系，辅助配置与排查。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tabLinks.map((tab) => (
            <Link
              key={tab.id}
              href={
                tab.id === "overview"
                  ? "/ops/content-studio"
                  : `/ops/content-studio?tab=${tab.id}`
              }
              className={`rounded-md px-3 py-1.5 text-sm ${
                activeTab === tab.id
                  ? "bg-sky-600 text-white"
                  : "border border-zinc-700 text-zinc-300 hover:bg-zinc-900"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {activeTab === "deliverables" ? (
        <section>
          <ContentStudioArtifactPanel data={data} />
        </section>
      ) : null}

      {activeTab === "dependency" ? (
        <section>
          <h2 className="mb-3 text-lg font-medium text-zinc-200">任务—成果物依赖关系</h2>
          <ContentStudioDependencyFlow
            graph={data.dependencyGraph}
            knownArtifactSlugs={new Set(data.artifactDefinitions.map((def) => def.slug))}
          />
        </section>
      ) : null}

      {activeTab === "debug" ? (
        <section>
          <ContentStudioDependencyDebugPanel taskSlugs={taskSlugs} />
        </section>
      ) : null}

      {activeTab === "mainline" ? (
        <section>
          <ContentStudioMainlineDebugPanel />
        </section>
      ) : null}

      {activeTab === "overview" ? (
        <>
      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-200">内容总览</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {overviewItems.map((item) => (
            <Card key={item.label} className="border-zinc-800 bg-zinc-900/80">
              <CardContent className="p-4">
                <p className="text-xs text-zinc-500">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-100">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-200">第一章验收</h2>
        <p className="mb-4 text-sm text-zinc-500">
          {chapter1Report.chapterName}（{stageLabel(chapter1Report.stage)}）可玩内容包完成度摘要。
        </p>
        <Card
          className={`border-zinc-800 ${chapter1Report.allOk ? "bg-emerald-950/20" : "bg-zinc-900/80"}`}
        >
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={chapter1Report.allOk ? "default" : "outline"}>
                {chapter1Report.allOk ? "验收就绪" : "待补齐"}
              </Badge>
              <span className="text-sm text-zinc-400">
                运行 <span className="font-mono text-zinc-300">npm run test:chapter1</span> 做完整检查
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {chapter1Items.map(({ label, item }) => (
                <div
                  key={label}
                  className={`rounded-lg border p-3 ${
                    item.ok ? "border-emerald-900/40 bg-zinc-950/50" : "border-amber-900/40 bg-amber-950/10"
                  }`}
                >
                  <p className="text-xs text-zinc-500">{label}</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-100">
                    {item.done}/{item.total}
                  </p>
                  {item.missing.length > 0 ? (
                    <p className="mt-1 text-xs text-amber-300/90 font-mono truncate" title={item.missing.join(", ")}>
                      缺失：{item.missing.join(", ")}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-emerald-400/90">完整</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-medium text-zinc-200">地点编排</h2>
          <div className="space-y-4 max-h-[720px] overflow-y-auto pr-1">
            {Object.entries(data.locationsByGroup).map(([group, rows]) => {
              if (rows.length === 0) return null;
              return (
                <div key={group}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">{group}</p>
                  <div className="space-y-2">
                    {rows.map((row) => {
                      const isSelected = row.location.id === selectedLocationId;
                      return (
                        <Link
                          key={row.location.id}
                          href={`/ops/content-studio?location=${row.location.id}`}
                          className={`block rounded-lg border p-3 transition-colors ${
                            isSelected
                              ? "border-emerald-700/60 bg-emerald-950/30"
                              : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
                          }`}
                        >
                          <p className="font-medium text-zinc-100">{row.location.name}</p>
                          <p className="mt-1 text-xs text-zinc-500">{stageLabel(row.location.unlockStage)}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
                            <span>NPC {row.relatedNpcCount}</span>
                            <span>区域 {row.relatedAreaCount}</span>
                            <span>行动 {row.actionCount}</span>
                            <span>任务 {row.triggerTaskCount}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <h2 className="mb-3 text-lg font-medium text-zinc-200">地点详情与关系链</h2>
          {!selectedRow ? (
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="p-6 text-sm text-zinc-500">← 选择左侧地点查看行动与任务关系</CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="border-zinc-800 bg-zinc-900/80">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-base text-zinc-100">{selectedRow.location.name}</CardTitle>
                    <Link
                      href={payloadAdminUrl("map-locations", selectedRow.payloadDocId)}
                      className="text-xs text-sky-400 hover:text-sky-300"
                    >
                      编辑地点 →
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-zinc-400">
                  <p>{selectedRow.location.description}</p>
                  <p>解锁阶段：{stageLabel(selectedRow.location.unlockStage)}</p>
                  <div>
                    <p className="text-zinc-500">关联 NPC</p>
                    <p>{selectedRow.location.relatedNpcNames?.join("、") || "—"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">关联区域</p>
                    <p>{selectedRow.location.relatedAreaNames?.join("、") || "—"}</p>
                  </div>
                </CardContent>
              </Card>

              {selectedActions.length === 0 ? (
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-4 text-sm text-zinc-500">该地点暂无配置行动</CardContent>
                </Card>
              ) : (
                selectedActions.map((action) => {
                  const taskSlugs = action.triggerTaskSlugs || [];
                  return (
                    <div key={action.id} className="space-y-1">
                      <Card className="border-emerald-900/40 bg-zinc-900/80">
                        <CardHeader className="pb-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <CardTitle className="text-sm text-emerald-300">{action.label}</CardTitle>
                            <Link
                              href={payloadAdminUrl(
                                "location-actions",
                                data.locationActionDocIds[action.id],
                              )}
                              className="text-xs text-sky-400 hover:text-sky-300"
                            >
                              编辑行动 →
                            </Link>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-zinc-400">
                          <p>{action.description}</p>
                          <p>消耗：{formatActionCosts(action)}</p>
                          <p>门槛：{formatActionRequirements(action)}</p>
                          <p className="font-mono text-xs text-zinc-500">{action.id}</p>
                        </CardContent>
                      </Card>

                      {taskSlugs.length === 0 ? (
                        <>
                          <FlowArrow />
                          <Card className="border-zinc-800 bg-zinc-950/50">
                            <CardContent className="p-3 text-xs text-zinc-500">未配置触发任务</CardContent>
                          </Card>
                        </>
                      ) : (
                        taskSlugs.map((slug) => {
                          const template = getTaskTemplateBySlug(data, slug);
                          const linkedEvents = selectedEvents.filter((event) =>
                            (event.triggerTaskSlugs || []).includes(slug),
                          );
                          return (
                            <div key={`${action.id}-${slug}`}>
                              <FlowArrow />
                              {linkedEvents.length > 0 ? (
                                linkedEvents.map((event) => (
                                  <div key={event.slug} className="space-y-1">
                                    <Card className="border-violet-900/40 bg-violet-950/20">
                                      <CardContent className="p-3 space-y-1">
                                        <p className="text-sm font-medium text-violet-200">
                                          事件池 · {event.title}
                                        </p>
                                        <p className="font-mono text-xs text-zinc-500">{event.slug}</p>
                                        <p className="text-xs text-zinc-400">
                                          权重 {event.weight ?? 10}
                                          {event.onceOnly ? " · 仅一次" : ""}
                                          {(event.cooldownDays ?? 0) > 0
                                            ? ` · 冷却 ${event.cooldownDays} 天`
                                            : ""}
                                        </p>
                                        <Link
                                          href={payloadAdminUrl(
                                            "event-templates",
                                            data.eventTemplateDocIds[event.slug],
                                          )}
                                          className="inline-block text-xs text-sky-400 hover:text-sky-300"
                                        >
                                          编辑事件 →
                                        </Link>
                                      </CardContent>
                                    </Card>
                                    <FlowArrow />
                                    {template ? (
                                      <>
                                        <Card className="border-zinc-700 bg-zinc-950/70">
                                          <CardContent className="p-3 space-y-1">
                                            <p className="text-sm font-medium text-zinc-100">
                                              {template.title}
                                            </p>
                                            <p className="font-mono text-xs text-zinc-500">{slug}</p>
                                            <p className="text-xs text-zinc-400">
                                              {template.rarity} · {template.area} ·{" "}
                                              {stageLabel(template.stage)}
                                            </p>
                                          </CardContent>
                                        </Card>
                                        <FlowArrow />
                                        <Card className="border-zinc-800 bg-zinc-950/50">
                                          <CardContent className="p-3 space-y-2 text-xs">
                                            <p className="font-mono text-zinc-500">
                                              Ink：{template.inkFile}
                                            </p>
                                            <div>
                                              <p className="text-zinc-500">成功效果</p>
                                              <p className="text-emerald-300/90">
                                                {formatMetricEffects(template.successEffects).join("；")}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-zinc-500">关键节点</p>
                                              <p className="text-amber-300/90">
                                                {formatMilestoneEffects(template.milestoneEffects).join(
                                                  "；",
                                                )}
                                              </p>
                                            </div>
                                            <Link
                                              href={payloadAdminUrl(
                                                "task-templates",
                                                data.taskTemplateDocIds[slug],
                                              )}
                                              className="inline-block text-sky-400 hover:text-sky-300"
                                            >
                                              编辑任务 →
                                            </Link>
                                          </CardContent>
                                        </Card>
                                      </>
                                    ) : (
                                      <Card className="border-rose-900/40 bg-rose-950/20">
                                        <CardContent className="p-3 text-xs text-rose-300">
                                          任务模板缺失：{slug}
                                        </CardContent>
                                      </Card>
                                    )}
                                  </div>
                                ))
                              ) : template ? (
                                <>
                                  <Card className="border-zinc-700 bg-zinc-950/70">
                                    <CardContent className="p-3 space-y-1">
                                      <p className="text-sm font-medium text-zinc-100">{template.title}</p>
                                      <p className="font-mono text-xs text-zinc-500">{slug}</p>
                                      <p className="text-xs text-zinc-400">
                                        {template.rarity} · {template.area} · {stageLabel(template.stage)}
                                      </p>
                                    </CardContent>
                                  </Card>
                                  <FlowArrow />
                                  <Card className="border-zinc-800 bg-zinc-950/50">
                                    <CardContent className="p-3 space-y-2 text-xs">
                                      <p className="font-mono text-zinc-500">Ink：{template.inkFile}</p>
                                      <div>
                                        <p className="text-zinc-500">成功效果</p>
                                        <p className="text-emerald-300/90">
                                          {formatMetricEffects(template.successEffects).join("；")}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-zinc-500">关键节点</p>
                                        <p className="text-amber-300/90">
                                          {formatMilestoneEffects(template.milestoneEffects).join("；")}
                                        </p>
                                      </div>
                                      <Link
                                        href={payloadAdminUrl(
                                          "task-templates",
                                          data.taskTemplateDocIds[slug],
                                        )}
                                        className="inline-block text-sky-400 hover:text-sky-300"
                                      >
                                        编辑任务 →
                                      </Link>
                                    </CardContent>
                                  </Card>
                                </>
                              ) : (
                                <Card className="border-rose-900/40 bg-rose-950/20">
                                  <CardContent className="p-3 text-xs text-rose-300">
                                    任务模板缺失：{slug}
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-200">事件池</h2>
        <p className="mb-4 text-sm text-zinc-500">
          地点行动生成任务后，系统按权重从事件池随机触发事件，并可能追加关联任务。
        </p>
        {data.eventTemplates.length === 0 ? (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4 text-sm text-zinc-500">
              暂无事件模板，请先运行 seed 或在 Payload 后台配置。
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {data.eventTemplates.map((event) => (
              <EventPoolCard
                key={event.slug}
                event={event}
                docId={data.eventTemplateDocIds[event.slug]}
                healthReport={healthReport}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-200">剧情入口</h2>
        <p className="mb-4 text-sm text-zinc-500">
          统一管理 Ink 剧情文件，任务/事件通过 storySlug 引用，可在此预览剧情。
        </p>
        {data.storyEntries.length === 0 ? (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4 text-sm text-zinc-500">
              暂无剧情入口，请先运行 seed 或在 Payload 后台配置。
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {data.storyEntries.map((entry) => (
              <StoryEntryCard
                key={entry.slug}
                entry={entry}
                docId={data.storyEntryDocIds[entry.slug]}
                data={data}
                healthReport={healthReport}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-200">任务模板预览</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {data.taskTemplates.map((template) => (
            <TaskTemplatePreview
              key={template.slug}
              template={template}
              docId={data.taskTemplateDocIds[template.slug]}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-200">内容健康检查</h2>
        <Card className="border-zinc-800 bg-zinc-900/80">
          <CardContent className="p-4 space-y-3">
            {healthReport.missingCoreTables.length > 0 ? (
              <p className="text-sm text-rose-300">
                基础内容表缺失：{healthReport.missingCoreTables.join("、")}。请先运行 seed。
              </p>
            ) : (
              <>
                <p className="text-sm text-zinc-400">
                  合计 {healthReport.passCount} 通过，{healthReport.failCount} 失败
                  {healthReport.warnCount > 0 ? `，${healthReport.warnCount} 警告` : ""}
                </p>
                <div className="space-y-2">
                  {healthReport.warnings?.map((result) => (
                    <div
                      key={result.name}
                      className="rounded border border-amber-900/40 bg-amber-950/20 p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-amber-700 text-amber-300">
                          WARN
                        </Badge>
                        <span className="text-zinc-200">{result.name}</span>
                      </div>
                      {result.failures.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-amber-300/90">
                          {result.failures.slice(0, 8).map((failure) => (
                            <li key={failure}>— {failure}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                  {healthReport.results.map((result) => (
                    <div
                      key={result.name}
                      className="rounded border border-zinc-800 bg-zinc-950/50 p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={result.pass ? "default" : "destructive"}>
                          {result.pass ? "PASS" : "FAIL"}
                        </Badge>
                        <span className="text-zinc-200">{result.name}</span>
                        <span className="text-xs text-zinc-500">({result.total})</span>
                      </div>
                      {!result.pass && result.failures.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-rose-300/90">
                          {result.failures.slice(0, 8).map((failure) => (
                            <li key={failure}>— {failure}</li>
                          ))}
                          {result.failures.length > 8 && (
                            <li>— …还有 {result.failures.length - 8} 项</li>
                          )}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>
        </>
      ) : null}
    </div>
  );
}
