"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, FileJson, Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContentPackReport } from "@/game/contentPackImport";
import { cn } from "@/lib/utils";

const COLLECTION_LABELS: Record<string, string> = {
  artifactDefinitions: "成果物",
  areas: "沙盘区域",
  mapLocations: "地图地点",
  npcs: "NPC",
  storyEntries: "剧情入口",
  taskTemplates: "任务模板",
  eventTemplates: "事件模板",
  locationActions: "地点行动",
};

const SAMPLE_PACK = `{
  "packId": "demo-pack-v1",
  "name": "示例内容包",
  "version": "1.0.0",
  "artifactDefinitions": [],
  "areas": [],
  "mapLocations": [],
  "npcs": [],
  "storyEntries": [],
  "taskTemplates": [],
  "eventTemplates": [],
  "locationActions": []
}`;

function SummaryBlock({ report }: { report: ContentPackReport }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <p className="text-xs text-zinc-500">packId</p>
          <p className="mt-1 font-mono text-sm text-zinc-100">{report.packId}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <p className="text-xs text-zinc-500">名称</p>
          <p className="mt-1 text-sm text-zinc-100">{report.name}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <p className="text-xs text-zinc-500">版本</p>
          <p className="mt-1 font-mono text-sm text-zinc-100">{report.version}</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">内容数量</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(report.counts || {}).map(([key, count]) => (
            <span
              key={key}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
            >
              {COLLECTION_LABELS[key] || key} {count}
            </span>
          ))}
        </div>
      </div>

      {report.errors.length > 0 && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/20 p-3">
          <p className="text-sm font-medium text-red-300">校验错误 ({report.errors.length})</p>
          <ul className="mt-2 space-y-1 text-sm text-red-200/90">
            {report.errors.map((error) => (
              <li key={error}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {report.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-900/60 bg-amber-950/20 p-3">
          <p className="text-sm font-medium text-amber-300">警告</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-200/90">
            {report.warnings.map((warning) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {Object.values(report.summary || {}).some(
        (item) => item.created > 0 || item.updated > 0,
      ) && (
        <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
            <CheckCircle2 className="size-4" />
            导入结果
          </p>
          <ul className="mt-2 space-y-1 text-sm text-emerald-200/90">
            {Object.entries(report.summary).map(([key, item]) => {
              if (item.created === 0 && item.updated === 0) return null;
              return (
                <li key={key}>
                  {COLLECTION_LABELS[key] || key}：新建 {item.created}，更新 {item.updated}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ContentPackImportPanel() {
  const [jsonText, setJsonText] = useState(SAMPLE_PACK);
  const [report, setReport] = useState<ContentPackReport | null>(null);
  const [loading, setLoading] = useState<"validate" | "import" | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  async function runValidate() {
    setLoading("validate");
    setRequestError(null);
    setImported(false);
    try {
      const pack = JSON.parse(jsonText);
      const response = await fetch("/api/ops/content-pack/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pack),
      });
      const data = (await response.json()) as ContentPackReport;
      setReport(data);
      if (!response.ok && !data.errors?.length) {
        setRequestError("校验请求失败");
      }
    } catch (error) {
      setReport(null);
      setRequestError(error instanceof Error ? error.message : "JSON 解析失败");
    } finally {
      setLoading(null);
    }
  }

  async function runImport() {
    setLoading("import");
    setRequestError(null);
    try {
      const pack = JSON.parse(jsonText);
      const response = await fetch("/api/ops/content-pack/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack, mode: "upsert" }),
      });
      const data = (await response.json()) as ContentPackReport;
      setReport(data);
      if (data.ok) {
        setImported(true);
      } else if (!data.errors?.length) {
        setRequestError("导入请求失败");
      }
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "JSON 解析失败");
    } finally {
      setLoading(null);
    }
  }

  const canImport = !imported && (report === null || report.ok);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sky-400">批量导入</p>
          <h1 className="mt-1 text-2xl font-semibold">JSON 内容包导入</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            粘贴 JSON 内容包，校验引用关系后 upsert 写入 Payload。适合批量导入剧情、任务、事件、NPC、地点与成果物。
          </p>
        </div>
        <Link
          href="/ops/project-flow"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
        >
          <ArrowLeft className="size-4" />
          返回流程编排
        </Link>
      </header>

      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-zinc-100">
            <FileJson className="size-4 text-sky-400" />
            内容包 JSON
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={jsonText}
            onChange={(event) => {
              setJsonText(event.target.value);
              setReport(null);
              setImported(false);
              setRequestError(null);
            }}
            rows={18}
            spellCheck={false}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-100 outline-none focus:border-sky-700"
            placeholder="粘贴内容包 JSON..."
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runValidate}
              disabled={loading !== null}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              {loading === "validate" ? "校验中..." : "校验内容包"}
            </button>
            <button
              type="button"
              onClick={runImport}
              disabled={loading !== null || !canImport}
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "gap-1")}
            >
              <Upload className="size-4" />
              {loading === "import" ? "导入中..." : "确认导入"}
            </button>
          </div>
          {!report?.ok && report && (
            <p className="text-xs text-zinc-500">存在校验错误时无法导入。</p>
          )}
          {requestError && (
            <p className="text-sm text-red-300">{requestError}</p>
          )}
        </CardContent>
      </Card>

      {report && (
        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader>
            <CardTitle className="text-base text-zinc-100">校验报告</CardTitle>
          </CardHeader>
          <CardContent>
            <SummaryBlock report={report} />
            {imported && (
              <div className="mt-4">
                <Link href="/ops/project-flow" className={cn(buttonVariants({ size: "sm" }))}>
                  查看流程编排结果
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
