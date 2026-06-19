"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ContentStudioData } from "@/game/contentStudioLoader";
import { payloadAdminUrl } from "@/game/contentStudioLoader";
import { PROJECT_STAGES } from "@/game/projectStages";
import { resolveAllowedStatuses } from "@/data/artifactDefinitions";

type ContentStudioArtifactPanelProps = {
  data: ContentStudioData;
};

function stageLabel(stageId?: string) {
  if (!stageId) return "—";
  return PROJECT_STAGES.find((stage) => stage.id === stageId)?.name || stageId;
}

function formatRefs(refs?: { slug: string; title: string }[]) {
  if (!refs?.length) return "—";
  return refs.map((item) => item.title).join("、");
}

export function ContentStudioArtifactPanel({ data }: ContentStudioArtifactPanelProps) {
  const [runtimeStatus, setRuntimeStatus] = useState<Record<string, string | null>>({});

  useEffect(() => {
    void fetch("/api/project/artifacts")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) return;
        const map: Record<string, string | null> = {};
        for (const items of Object.values(json.byStage || {}) as { slug: string; currentStatus: string | null }[][]) {
          for (const item of items) {
            map[item.slug] = item.currentStatus;
          }
        }
        setRuntimeStatus(map);
      })
      .catch(() => undefined);
  }, []);

  const knownSlugs = useMemo(
    () => new Set(data.artifactDefinitions.map((item) => item.slug)),
    [data.artifactDefinitions],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium text-zinc-100">成果物中心</h2>
          <p className="text-sm text-zinc-500">共 {data.artifactDefinitions.length} 项成果物定义</p>
        </div>
        <Link
          href={payloadAdminUrl("artifact-definitions")}
          target="_blank"
          className="inline-flex h-8 items-center rounded-md border border-zinc-700 px-3 text-sm text-zinc-200 hover:bg-zinc-900"
        >
          在 Payload 中编辑
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900/80 text-zinc-400">
            <tr>
              <th className="px-3 py-2 text-left font-medium">名称</th>
              <th className="px-3 py-2 text-left font-medium">slug</th>
              <th className="px-3 py-2 text-left font-medium">阶段</th>
              <th className="px-3 py-2 text-left font-medium">默认状态</th>
              <th className="px-3 py-2 text-left font-medium">允许状态</th>
              <th className="px-3 py-2 text-left font-medium">运行时状态</th>
              <th className="px-3 py-2 text-left font-medium">产出任务</th>
              <th className="px-3 py-2 text-left font-medium">依赖任务</th>
              <th className="px-3 py-2 text-left font-medium">事件影响</th>
              <th className="px-3 py-2 text-left font-medium">启用</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {data.artifactDefinitions.map((artifact) => {
              const docId = data.artifactDefinitionDocIds[artifact.slug];
              const statusFlow = resolveAllowedStatuses(artifact)
                .map((item) => item.label || item.status)
                .join(" → ");
              return (
                <tr key={artifact.slug} className="bg-zinc-950/40 hover:bg-zinc-900/40">
                  <td className="px-3 py-2">
                    {docId ? (
                      <Link
                        href={payloadAdminUrl("artifact-definitions", docId)}
                        className="text-sky-400 hover:underline"
                        target="_blank"
                      >
                        {artifact.name}
                      </Link>
                    ) : (
                      artifact.name
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-500">{artifact.slug}</td>
                  <td className="px-3 py-2">{stageLabel(artifact.stage)}</td>
                  <td className="px-3 py-2">{artifact.defaultStatus || "draft"}</td>
                  <td className="px-3 py-2 text-xs text-zinc-400">{statusFlow || "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    {runtimeStatus[artifact.slug] ? (
                      <span className="text-emerald-400">{runtimeStatus[artifact.slug]}</span>
                    ) : (
                      <span className="text-zinc-500">未产出</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-400">
                    {formatRefs(data.artifactUsage.producedByTasks[artifact.slug])}
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-400">
                    {formatRefs(data.artifactUsage.requiredByTasks[artifact.slug])}
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-400">
                    {formatRefs(data.artifactUsage.affectedByEvents[artifact.slug])}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={artifact.enabled !== false ? "default" : "outline"}>
                      {artifact.enabled !== false ? "启用" : "停用"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.dependencyGraph.nodes.some(
        (node) => node.type === "artifact" && !knownSlugs.has(node.id.replace("artifact:", "")),
      ) ? (
        <p className="text-sm text-rose-400">
          依赖图中存在未定义的成果物 slug（红色节点），请先在 Payload 中补全 artifact-definitions。
        </p>
      ) : null}
    </div>
  );
}

type DependencyDebugResult = {
  available: boolean;
  taskSlug?: string;
  templateTitle?: string;
  configurationOk?: boolean;
  missingArtifacts: { slug: string; name: string; required: string; actual: string }[];
  missingTasks: string[];
  missingMilestones: string[];
  blockingReasons: string[];
  invalidArtifactSlugs?: { slug: string; role: "input" | "output" }[];
};

export function ContentStudioDependencyDebugPanel({
  taskSlugs,
}: {
  taskSlugs: string[];
}) {
  const [seasonId, setSeasonId] = useState("season-1");
  const [taskSlug, setTaskSlug] = useState(taskSlugs[0] || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DependencyDebugResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDebug = useCallback(async () => {
    if (!taskSlug.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ seasonId, taskSlug });
      const response = await fetch(`/api/ops/dependency-debug?${params.toString()}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "调试请求失败");
      }
      setResult(json as DependencyDebugResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "调试请求失败");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [seasonId, taskSlug]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-zinc-100">任务为什么不能生成</h2>
        <p className="text-sm text-zinc-500">基于当前赛季运行时状态，检查任务模板依赖是否满足。</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="space-y-1 text-sm">
          <span className="text-zinc-400">赛季 ID</span>
          <input
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
            value={seasonId}
            onChange={(event) => setSeasonId(event.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-zinc-400">任务 slug</span>
          <select
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
            value={taskSlug}
            onChange={(event) => setTaskSlug(event.target.value)}
          >
            {taskSlugs.map((slug) => (
              <option key={slug} value={slug}>
                {slug}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <Button onClick={runDebug} disabled={loading}>
            {loading ? "检查中…" : "检查依赖"}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      {result ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-zinc-400">任务：</span>
            <span className="text-sm text-zinc-200">{result.templateTitle || result.taskSlug}</span>
            <span className="text-sm text-zinc-400">可生成：</span>
            <Badge variant={result.available ? "default" : "destructive"}>
              {result.available ? "是" : "否"}
            </Badge>
            {result.configurationOk === false ? (
              <Badge variant="destructive">配置错误</Badge>
            ) : null}
          </div>

          {result.invalidArtifactSlugs && result.invalidArtifactSlugs.length > 0 ? (
            <div className="rounded border border-rose-900/50 bg-rose-950/20 p-3">
              <p className="text-sm font-medium text-rose-300 mb-2">未定义的成果物 slug</p>
              <ul className="space-y-1 text-sm text-rose-300">
                {result.invalidArtifactSlugs.map((item) => (
                  <li key={`${item.role}-${item.slug}`}>
                    [{item.role === "input" ? "输入" : "产出"}] {item.slug} — 在 artifact-definitions 中不存在
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.blockingReasons.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-zinc-300 mb-2">阻塞原因</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-400">
                {result.blockingReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-emerald-400">当前依赖均已满足，任务可以生成。</p>
          )}

          {result.missingArtifacts.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-zinc-300 mb-2">缺失成果物</p>
              <ul className="space-y-1 text-sm text-zinc-400">
                {result.missingArtifacts.map((item) => (
                  <li key={item.slug}>
                    {item.name}（需要 {item.required}，当前 {item.actual}）
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.missingTasks.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-zinc-300 mb-2">未完成前置任务</p>
              <p className="text-sm text-zinc-400 font-mono">{result.missingTasks.join(", ")}</p>
            </div>
          ) : null}

          {result.missingMilestones.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-zinc-300 mb-2">未达成关键节点</p>
              <p className="text-sm text-zinc-400 font-mono">{result.missingMilestones.join(", ")}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
