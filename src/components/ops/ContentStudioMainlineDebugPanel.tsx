"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DisplayNativeSelect,
  DisplayTitle,
  SlugHint,
} from "@/components/ops/OpsDisplayHelpers";
import { CONSTRUCTION_PROJECT_MAINLINE_TASKS } from "@/data/constructionProjectMainlineTasks";
import {
  artifactToDisplayOption,
  getArtifactStatusLabel,
  getRuntimeTaskStatusLabel,
  getStageDisplayName,
  getStageGateStatusLabel,
  localizeBlockingReasons,
  resolveArtifactStatusOptions,
  taskToDisplayOption,
} from "@/game/contentDisplayLabels";

type MainlineTaskRow = {
  slug: string;
  title: string;
  stage: string;
  runtimeStatus: string | null;
  taskId: string | null;
  available: boolean;
  blockingReasons: string[];
  missingArtifacts: { slug: string; name: string; required: string; actual: string }[];
};

type ArtifactOption = {
  slug: string;
  name: string;
  stage?: string;
  defaultStatus: string;
  currentStatus: string | null;
  allowedStatusOptions: { status: string; label: string }[];
};

type DebugStatus = {
  project?: { currentStage?: string; stageProgress?: number; overallProgress?: number };
  milestones?: Record<string, boolean>;
  stageGate?: {
    canAdvance: boolean;
    stageGateStatus?: string;
    blockingReasons: string[];
  };
  artifacts?: ArtifactOption[];
  mainlineByStage?: Record<string, MainlineTaskRow[]>;
  permitDebug?: {
    slug: string;
    title: string;
    available: boolean;
    blockingReasons: string[];
    missingArtifacts: { slug: string; name: string; required: string; actual: string }[];
    inputArtifacts: {
      slug: string;
      name: string;
      minStatus: string;
      currentStatus: string | null;
    }[];
  };
};

async function fetchStatus(): Promise<DebugStatus> {
  const res = await fetch("/api/ops/mainline-debug/status");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "加载失败");
  return data;
}

const STAGE_ORDER = ["INITIATION", "APPROVAL", "DESIGN", "PROCUREMENT", "CONSTRUCTION"] as const;

const MAINLINE_TASK_OPTIONS = CONSTRUCTION_PROJECT_MAINLINE_TASKS.filter(
  (task) => task.category === "mainline",
).map((task) => taskToDisplayOption(task));

function runtimeStatusBadge(status: string | null) {
  const label = getRuntimeTaskStatusLabel(status);
  if (!status) return <Badge variant="outline">{label}</Badge>;
  if (status === "COMPLETED") return <Badge className="bg-emerald-700">{label}</Badge>;
  if (status === "IN_PROGRESS") return <Badge className="bg-sky-700">{label}</Badge>;
  return <Badge variant="outline">{label}</Badge>;
}

export function ContentStudioMainlineDebugPanel() {
  const [status, setStatus] = useState<DebugStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [grantSlug, setGrantSlug] = useState("approval_reply");
  const [grantStatus, setGrantStatus] = useState("approved");
  const [selectedSlug, setSelectedSlug] = useState("submit_construction_permit_application");

  const artifactLookup = useMemo(() => {
    const map = new Map<string, ArtifactOption>();
    for (const artifact of status?.artifacts || []) {
      map.set(artifact.slug, artifact);
    }
    return map;
  }, [status?.artifacts]);

  const displayContext = useMemo(
    () => ({
      taskTitles: new Map(
        CONSTRUCTION_PROJECT_MAINLINE_TASKS.map((task) => [
          task.slug,
          task.title?.trim() || task.slug,
        ]),
      ),
      artifactNames: new Map(
        (status?.artifacts || []).map((artifact) => [
          artifact.slug,
          artifact.name?.trim() || artifact.slug,
        ]),
      ),
      artifactLookup: artifactLookup,
    }),
    [status?.artifacts, artifactLookup],
  );

  function handleGrantSlugChange(nextSlug: string) {
    setGrantSlug(nextSlug);
    const artifact = artifactLookup.get(nextSlug);
    const options = artifact
      ? artifact.allowedStatusOptions.length > 0
        ? artifact.allowedStatusOptions
        : resolveArtifactStatusOptions(artifact)
      : resolveArtifactStatusOptions(null);
    setGrantStatus(artifact?.defaultStatus || options[0]?.status || "draft");
  }
  const grantArtifact = artifactLookup.get(grantSlug);
  const grantStatusOptions = useMemo(
    () =>
      grantArtifact
        ? grantArtifact.allowedStatusOptions.length > 0
          ? grantArtifact.allowedStatusOptions
          : resolveArtifactStatusOptions(grantArtifact)
        : resolveArtifactStatusOptions(null),
    [grantArtifact],
  );

  const artifactSelectOptions = useMemo(
    () => (status?.artifacts || []).map((artifact) => artifactToDisplayOption(artifact)),
    [status?.artifacts],
  );

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await fetchStatus());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetchStatus()
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch((error) => {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "加载失败");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function postAction(path: string, body?: object) {
    setMessage(null);
    const res = await fetch(path, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "操作失败");
    setMessage(data.message || "操作成功");
    await loadStatus();
    return data;
  }

  if (loading && !status) {
    return <p className="text-sm text-zinc-400">加载主线调试状态…</p>;
  }

  const project = status?.project;
  const permit = status?.permitDebug;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-zinc-100">主线调试</h2>
          <p className="text-sm text-zinc-500">
            运行时项目状态、24 条建设主线任务、施工许可终局依赖
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void loadStatus()}>
            刷新
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() =>
              void postAction("/api/ops/mainline-debug/reset").catch((e) =>
                setMessage(String(e.message)),
              )
            }
          >
            重置主线
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              void postAction("/api/ops/mainline-debug/clear-artifacts").catch((e) =>
                setMessage(String(e.message)),
              )
            }
          >
            清空成果物
          </Button>
        </div>
      </div>

      {message ? (
        <p className="rounded-md border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="text-xs text-zinc-500">当前阶段</p>
          <p className="mt-1 text-lg font-medium text-zinc-100">
            {getStageDisplayName(project?.currentStage || "INITIATION")}
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            阶段进度 {project?.stageProgress ?? 0}% · 总体 {project?.overallProgress ?? 0}%
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            阶段门：{getStageGateStatusLabel(status?.stageGate?.stageGateStatus)}
            {status?.stageGate?.canAdvance ? " · 可推进" : ""}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 md:col-span-2">
          <p className="text-xs text-zinc-500">阶段门阻塞</p>
          {status?.stageGate?.blockingReasons?.length ? (
            <ul className="mt-2 space-y-1 text-sm text-amber-300/90">
              {localizeBlockingReasons(status.stageGate.blockingReasons, displayContext).map(
                (line) => (
                  <li key={line}>{line}</li>
                ),
              )}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-emerald-400/90">无阶段门阻塞</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-zinc-100">施工许可终局任务</p>
          {permit ? (
            <Badge variant="outline">{permit.title}</Badge>
          ) : null}
        </div>
        {permit ? (
          <>
            <div>
              <p className="text-sm text-zinc-300">{permit.title}</p>
              <SlugHint slug={permit.slug} className="mt-0.5 block" />
              <p className="mt-1 text-sm text-zinc-400">
                {permit.available ? "依赖已满足" : "仍有阻塞"}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="px-2 py-1 text-left">成果物</th>
                    <th className="px-2 py-1 text-left">需要状态</th>
                    <th className="px-2 py-1 text-left">当前状态</th>
                  </tr>
                </thead>
                <tbody>
                  {permit.inputArtifacts.map((item) => {
                    const missing = permit.missingArtifacts.some((m) => m.slug === item.slug);
                    const artifact = artifactLookup.get(item.slug);
                    return (
                      <tr key={item.slug} className={missing ? "text-rose-300" : "text-zinc-300"}>
                        <td className="px-2 py-1">
                          <p>{item.name}</p>
                          <SlugHint slug={item.slug} />
                        </td>
                        <td className="px-2 py-1">
                          {getArtifactStatusLabel(item.minStatus, artifact)}
                        </td>
                        <td className="px-2 py-1">
                          {getArtifactStatusLabel(item.currentStatus, artifact)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {permit.blockingReasons.length > 0 ? (
              <ul className="space-y-1 text-sm text-rose-300/90">
                {localizeBlockingReasons(permit.blockingReasons, displayContext).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
        <label className="space-y-1 text-sm text-zinc-400">
          <span>完成任务</span>
          <DisplayNativeSelect
            className="mt-1 min-w-[280px]"
            value={selectedSlug}
            onChange={setSelectedSlug}
            options={MAINLINE_TASK_OPTIONS}
          />
        </label>
        <Button
          size="sm"
          onClick={() =>
            void postAction("/api/ops/mainline-debug/complete-task", { taskSlug: selectedSlug }).catch(
              (e) => setMessage(String(e.message)),
            )
          }
        >
          完成选中任务
        </Button>
        <label className="space-y-1 text-sm text-zinc-400">
          <span>授予成果物</span>
          <DisplayNativeSelect
            className="mt-1 min-w-[240px]"
            value={grantSlug}
            onChange={handleGrantSlugChange}
            options={artifactSelectOptions}
          />
        </label>
        <label className="space-y-1 text-sm text-zinc-400">
          <span>状态</span>
          <select
            className="mt-1 block min-w-[160px] rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
            value={grantStatus}
            onChange={(e) => setGrantStatus(e.target.value)}
          >
            {grantStatusOptions.map((option) => (
              <option key={option.status} value={option.status}>
                {option.label}
                {option.label !== option.status ? `（${option.status}）` : ""}
              </option>
            ))}
          </select>
        </label>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            void postAction("/api/ops/mainline-debug/grant-artifact", {
              slug: grantSlug,
              status: grantStatus,
            }).catch((e) => setMessage(String(e.message)))
          }
        >
          授予成果物
        </Button>
      </div>

      {STAGE_ORDER.map((stageId) => {
        const rows = status?.mainlineByStage?.[stageId] || [];
        if (rows.length === 0) return null;
        return (
          <div key={stageId} className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-300">{getStageDisplayName(stageId)}</h3>
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-900/80 text-zinc-400">
                  <tr>
                    <th className="px-3 py-2 text-left">任务</th>
                    <th className="px-3 py-2 text-left">运行时</th>
                    <th className="px-3 py-2 text-left">可生成</th>
                    <th className="px-3 py-2 text-left">阻塞原因</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {rows.map((row) => (
                    <tr key={row.slug} className="bg-zinc-950/40">
                      <td className="px-3 py-2">
                        <DisplayTitle title={row.title} slug={row.slug} />
                      </td>
                      <td className="px-3 py-2">{runtimeStatusBadge(row.runtimeStatus)}</td>
                      <td className="px-3 py-2">
                        {row.available ? (
                          <span className="text-emerald-400">是</span>
                        ) : (
                          <span className="text-rose-400">否</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-400">
                        {row.blockingReasons.length
                          ? localizeBlockingReasons(row.blockingReasons, displayContext).join("；")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
