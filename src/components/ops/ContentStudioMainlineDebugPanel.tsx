"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PROJECT_STAGES } from "@/game/projectStages";
import { CONSTRUCTION_MAINLINE_TASK_SLUGS } from "@/data/constructionProjectMainlineTasks";

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

type DebugStatus = {
  project?: { currentStage?: string; stageProgress?: number; overallProgress?: number };
  milestones?: Record<string, boolean>;
  stageGate?: {
    canAdvance: boolean;
    stageGateStatus?: string;
    blockingReasons: string[];
  };
  artifacts?: { slug: string; name: string; stage?: string; currentStatus: string | null }[];
  mainlineByStage?: Record<string, MainlineTaskRow[]>;
  permitDebug?: {
    slug: string;
    title: string;
    available: boolean;
    blockingReasons: string[];
    missingArtifacts: { slug: string; name: string; required: string; actual: string }[];
    inputArtifacts: { slug: string; minStatus: string; currentStatus: string | null }[];
  };
};

const STAGE_ORDER = ["INITIATION", "APPROVAL", "DESIGN", "PROCUREMENT", "CONSTRUCTION"] as const;

function stageLabel(stageId: string) {
  return PROJECT_STAGES.find((s) => s.id === stageId)?.name || stageId;
}

function statusBadge(status: string | null) {
  if (!status) return <Badge variant="outline">未生成</Badge>;
  if (status === "COMPLETED") return <Badge className="bg-emerald-700">已完成</Badge>;
  if (status === "IN_PROGRESS") return <Badge className="bg-sky-700">进行中</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export function ContentStudioMainlineDebugPanel() {
  const [status, setStatus] = useState<DebugStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [grantSlug, setGrantSlug] = useState("approval_reply");
  const [grantStatus, setGrantStatus] = useState("approved");
  const [selectedSlug, setSelectedSlug] = useState("submit_construction_permit_application");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ops/mainline-debug/status");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "加载失败");
      setStatus(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

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
            {stageLabel(project?.currentStage || "INITIATION")}
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            阶段进度 {project?.stageProgress ?? 0}% · 总体 {project?.overallProgress ?? 0}%
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            阶段门：{status?.stageGate?.stageGateStatus || "—"}
            {status?.stageGate?.canAdvance ? " · 可推进" : ""}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 md:col-span-2">
          <p className="text-xs text-zinc-500">阶段门阻塞</p>
          {status?.stageGate?.blockingReasons?.length ? (
            <ul className="mt-2 space-y-1 text-sm text-amber-300/90">
              {status.stageGate.blockingReasons.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-emerald-400/90">无阶段门阻塞</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-zinc-100">施工许可终局任务</p>
          <Badge variant="outline">{permit?.slug}</Badge>
        </div>
        {permit ? (
          <>
            <p className="text-sm text-zinc-400">
              {permit.title} · {permit.available ? "依赖已满足" : "仍有阻塞"}
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="px-2 py-1 text-left">成果物</th>
                    <th className="px-2 py-1 text-left">需要</th>
                    <th className="px-2 py-1 text-left">当前</th>
                  </tr>
                </thead>
                <tbody>
                  {permit.inputArtifacts.map((item) => {
                    const missing = permit.missingArtifacts.some((m) => m.slug === item.slug);
                    return (
                      <tr key={item.slug} className={missing ? "text-rose-300" : "text-zinc-300"}>
                        <td className="px-2 py-1 font-mono text-xs">{item.slug}</td>
                        <td className="px-2 py-1">{item.minStatus}</td>
                        <td className="px-2 py-1">{item.currentStatus || "未产出"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {permit.blockingReasons.length > 0 ? (
              <ul className="space-y-1 text-sm text-rose-300/90">
                {permit.blockingReasons.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
        <label className="text-sm text-zinc-400">
          完成任务
          <select
            className="mt-1 block rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
          >
            {CONSTRUCTION_MAINLINE_TASK_SLUGS.map((slug) => (
              <option key={slug} value={slug}>
                {slug}
              </option>
            ))}
          </select>
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
        <label className="text-sm text-zinc-400">
          授予成果物 slug
          <input
            className="mt-1 block rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
            value={grantSlug}
            onChange={(e) => setGrantSlug(e.target.value)}
          />
        </label>
        <label className="text-sm text-zinc-400">
          状态
          <input
            className="mt-1 block w-28 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
            value={grantStatus}
            onChange={(e) => setGrantStatus(e.target.value)}
          />
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
            <h3 className="text-sm font-medium text-zinc-300">{stageLabel(stageId)}</h3>
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
                        <p className="text-zinc-100">{row.title}</p>
                        <p className="font-mono text-xs text-zinc-500">{row.slug}</p>
                      </td>
                      <td className="px-3 py-2">{statusBadge(row.runtimeStatus)}</td>
                      <td className="px-3 py-2">
                        {row.available ? (
                          <span className="text-emerald-400">是</span>
                        ) : (
                          <span className="text-rose-400">否</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-400">
                        {row.blockingReasons.length
                          ? row.blockingReasons.join("；")
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
