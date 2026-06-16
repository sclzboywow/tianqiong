import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ContentHealthCheckReport } from "@/game/contentHealthCheck";
import type { ContentStudioData } from "@/game/contentStudioLoader";
import {
  getActionsForLocationStudio,
  getLocationStudioRow,
  getTaskTemplateBySlug,
  payloadAdminUrl,
} from "@/game/contentStudioLoader";
import { METRIC_LABELS, type TaskTemplateData } from "@/game/types";
import { MILESTONE_LABELS, PROJECT_STAGES } from "@/game/projectStages";
import type { LocationAction } from "@/data/locationActions";

type ContentStudioPanelProps = {
  data: ContentStudioData;
  healthReport: ContentHealthCheckReport;
  selectedLocationId?: string;
};

function stageLabel(stageId?: string) {
  if (!stageId) return "—";
  return PROJECT_STAGES.find((stage) => stage.id === stageId)?.name || stageId;
}

function formatMetricEffects(effects?: Record<string, number>) {
  if (!effects || Object.keys(effects).length === 0) return ["—"];
  return Object.entries(effects).map(
    ([key, value]) => `${METRIC_LABELS[key] || key}: ${value > 0 ? "+" : ""}${value}`,
  );
}

function formatMilestoneEffects(effects?: Record<string, boolean>) {
  if (!effects || Object.keys(effects).length === 0) return ["—"];
  return Object.entries(effects)
    .filter(([, enabled]) => enabled)
    .map(([key]) => MILESTONE_LABELS[key] || key);
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
        </div>
      </div>
      <div className="grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
        <p>区域：{template.area || "—"}</p>
        <p>来源：{template.sourceName || template.sourceType || "—"}</p>
        <p className="sm:col-span-2 font-mono text-xs text-zinc-500">Ink：{template.inkFile || "—"}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 text-xs">
        <div>
          <p className="mb-1 text-zinc-500">成功效果</p>
          <ul className="space-y-0.5 text-emerald-300/90">
            {formatMetricEffects(template.successEffects).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-zinc-500">失败效果</p>
          <ul className="space-y-0.5 text-rose-300/90">
            {formatMetricEffects(template.failEffects).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-zinc-500">关键节点</p>
          <ul className="space-y-0.5 text-amber-300/90">
            {formatMilestoneEffects(template.milestoneEffects).map((line) => (
              <li key={line}>{line}</li>
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

export function ContentStudioPanel({
  data,
  healthReport,
  selectedLocationId,
}: ContentStudioPanelProps) {
  const selectedRow = getLocationStudioRow(data, selectedLocationId);
  const selectedActions = selectedLocationId
    ? getActionsForLocationStudio(data, selectedLocationId)
    : [];

  const overviewItems = [
    { label: "地图地点", value: data.overview.mapLocations },
    { label: "地点行动", value: data.overview.locationActions },
    { label: "任务模板", value: data.overview.taskTemplates },
    { label: "事件模板", value: data.overview.eventTemplates },
    { label: "NPC", value: data.overview.npcs },
    { label: "区域", value: data.overview.areas },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">内容编排台</h1>
        <p className="mt-1 text-sm text-zinc-400">
          可视化查看地点、行动、任务与剧情之间的关系，辅助配置与排查。
        </p>
      </div>

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
                          return (
                            <div key={`${action.id}-${slug}`}>
                              <FlowArrow />
                              {template ? (
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
                </p>
                <div className="space-y-2">
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
    </div>
  );
}
