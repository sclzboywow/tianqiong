"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Copy,
  FileJson,
  FileUp,
  Minimize2,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContentPackReport } from "@/game/contentPackImport";
import { CRDMO_SAMPLE_PACK_JSON } from "@/game/contentPackSamples";
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

const COLLECTION_KEYS = [
  "artifactDefinitions",
  "areas",
  "mapLocations",
  "npcs",
  "storyEntries",
  "taskTemplates",
  "eventTemplates",
  "locationActions",
] as const;

type CollectionKey = (typeof COLLECTION_KEYS)[number];

type LooseRecord = Record<string, unknown>;

function readItemSlug(item: LooseRecord): string {
  const slug = item.slug ?? item.id;
  return typeof slug === "string" ? slug.trim() : "";
}

function readItemLabel(item: LooseRecord, key: CollectionKey): string {
  if (key === "npcs") {
    return readItemSlug(item) || String(item.name || "").trim();
  }
  if (key === "locationActions") {
    return readItemSlug(item) || String(item.label || "").trim();
  }
  return readItemSlug(item) || String(item.title || item.name || "").trim();
}

function countArrayField(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function parsePackJson(jsonText: string): LooseRecord | null {
  try {
    const parsed = JSON.parse(jsonText) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as LooseRecord) : null;
  } catch {
    return null;
  }
}

function extractSlugLists(pack: LooseRecord): Record<CollectionKey, string[]> {
  const result = {} as Record<CollectionKey, string[]>;
  for (const key of COLLECTION_KEYS) {
    const items = Array.isArray(pack[key]) ? (pack[key] as LooseRecord[]) : [];
    result[key] = items.map((item) => readItemLabel(item, key)).filter(Boolean);
  }
  return result;
}

function SlugListPreview({ label, slugs }: { label: string; slugs: string[] }) {
  if (slugs.length === 0) return null;
  const shown = slugs.slice(0, 10);
  const rest = slugs.length - shown.length;
  return (
    <div className="text-xs">
      <p className="mb-1 text-zinc-500">{label}</p>
      <p className="font-mono leading-relaxed text-zinc-300">
        {shown.join(" · ")}
        {rest > 0 ? ` · 等 ${slugs.length} 个` : ""}
      </p>
    </div>
  );
}

function TaskSummaryTable({ tasks }: { tasks: LooseRecord[] }) {
  if (tasks.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full min-w-[640px] text-left text-xs">
        <thead className="bg-zinc-900/80 text-zinc-500">
          <tr>
            <th className="px-3 py-2 font-medium">slug</th>
            <th className="px-3 py-2 font-medium">title</th>
            <th className="px-3 py-2 font-medium">stage</th>
            <th className="px-3 py-2 font-medium">NPC</th>
            <th className="px-3 py-2 font-medium">前置</th>
            <th className="px-3 py-2 font-medium">输入</th>
            <th className="px-3 py-2 font-medium">产出</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800 text-zinc-200">
          {tasks.map((task) => {
            const slug = readItemSlug(task);
            return (
              <tr key={slug} className="bg-zinc-950/40">
                <td className="px-3 py-2 font-mono text-sky-300/90">{slug}</td>
                <td className="px-3 py-2">{String(task.title || "—")}</td>
                <td className="px-3 py-2 font-mono">{String(task.stage || "—")}</td>
                <td className="px-3 py-2">{countArrayField(task.npcList)}</td>
                <td className="px-3 py-2">{countArrayField(task.prerequisiteTaskSlugs)}</td>
                <td className="px-3 py-2">{countArrayField(task.inputArtifacts)}</td>
                <td className="px-3 py-2">{countArrayField(task.outputArtifacts)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatImportReportText(report: ContentPackReport): string {
  const lines = [
    `内容包导入报告`,
    `packId: ${report.packId}`,
    `名称: ${report.name}`,
    `版本: ${report.version}`,
    ``,
    `内容数量:`,
    ...Object.entries(report.counts || {}).map(
      ([key, count]) => `- ${COLLECTION_LABELS[key] || key}: ${count}`,
    ),
  ];
  if (Object.values(report.summary || {}).some((s) => s.created > 0 || s.updated > 0)) {
    lines.push("", "导入结果:");
    for (const [key, item] of Object.entries(report.summary)) {
      if (item.created === 0 && item.updated === 0) continue;
      lines.push(
        `- ${COLLECTION_LABELS[key] || key}: 新建 ${item.created}，更新 ${item.updated}`,
      );
    }
  }
  if (report.errors.length) {
    lines.push("", "错误:", ...report.errors.map((e) => `- ${e}`));
  }
  if (report.warnings.length) {
    lines.push("", "警告:", ...report.warnings.map((w) => `- ${w}`));
  }
  return lines.join("\n");
}

function FieldGuide() {
  return (
    <details className="group rounded-lg border border-zinc-800 bg-zinc-900/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-zinc-200">
        <span>内容包字段说明</span>
        <ChevronDown className="size-4 text-zinc-500 transition group-open:rotate-180" />
      </summary>
      <div className="space-y-4 border-t border-zinc-800 px-4 py-3 text-sm text-zinc-400">
        <ul className="space-y-1">
          <li>
            <span className="text-zinc-300">artifactDefinitions</span>：成果物定义
          </li>
          <li>
            <span className="text-zinc-300">mapLocations</span>：地图地点
          </li>
          <li>
            <span className="text-zinc-300">npcs</span>：协同对象
          </li>
          <li>
            <span className="text-zinc-300">storyEntries</span>：剧情入口
          </li>
          <li>
            <span className="text-zinc-300">taskTemplates</span>：流程任务
          </li>
          <li>
            <span className="text-zinc-300">eventTemplates</span>：风险 / 补正事件
          </li>
          <li>
            <span className="text-zinc-300">locationActions</span>：地点按钮 / 行动入口
          </li>
        </ul>
        <div className="space-y-2 text-xs leading-relaxed">
          <p className="font-medium text-zinc-300">常用字段</p>
          <p>
            <span className="text-zinc-300">slug / id</span>：唯一标识，导入后不要随意修改。
          </p>
          <p>
            <span className="text-zinc-300">title / name / label</span>：界面显示名称。
          </p>
          <p>
            <span className="text-zinc-300">stage</span>：项目阶段（如 INITIATION、APPROVAL）。
          </p>
          <p>
            <span className="text-zinc-300">area</span>：任务所属沙盘区域名称，须与 areas /
            Payload 沙盘区域 <code className="text-sky-300/90">name</code> 一致（如「项目管理部」）。
          </p>
          <p>
            <span className="text-zinc-300">npcList</span>：可写{" "}
            <code className="text-sky-300/90">[&quot;项目分管领导&quot;]</code> 或{" "}
            <code className="text-sky-300/90">[{`{ "npc": "项目分管领导" }`}]</code>
          </p>
          <p>
            <span className="text-zinc-300">prerequisiteTaskSlugs</span>：前置任务 slug 列表。
          </p>
          <p>
            <span className="text-zinc-300">inputArtifacts / outputArtifacts</span>
            ：成果物依赖与产出。
          </p>
          <p>
            <span className="text-zinc-300">triggerTaskSlugs</span>：地点行动或事件触发的任务
            slug。
          </p>
        </div>
      </div>
    </details>
  );
}

function ReportPanel({
  report,
  packPreview,
  imported,
  onContinue,
  onCopyReport,
}: {
  report: ContentPackReport;
  packPreview: LooseRecord | null;
  imported: boolean;
  onContinue: () => void;
  onCopyReport: () => void;
}) {
  const slugLists = packPreview ? extractSlugLists(packPreview) : null;
  const tasks = packPreview && Array.isArray(packPreview.taskTemplates)
    ? (packPreview.taskTemplates as LooseRecord[])
    : [];

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

      {report.ok && !imported && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0" />
          校验通过，可以导入
        </div>
      )}

      {slugLists && report.ok && (
        <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
          <p className="text-xs uppercase tracking-wider text-zinc-500">slug 摘要</p>
          {COLLECTION_KEYS.map((key) => (
            <SlugListPreview
              key={key}
              label={COLLECTION_LABELS[key]}
              slugs={slugLists[key]}
            />
          ))}
        </div>
      )}

      {tasks.length > 0 && report.ok && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-zinc-500">任务摘要</p>
          <TaskSummaryTable tasks={tasks} />
        </div>
      )}

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

      {imported && (
        <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
          <Link href="/ops/project-flow" className={cn(buttonVariants({ size: "sm" }))}>
            返回流程编排
          </Link>
          <button type="button" onClick={onContinue} className={buttonVariants({ variant: "outline", size: "sm" })}>
            继续导入新包
          </button>
          <button
            type="button"
            onClick={onCopyReport}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
          >
            <Copy className="size-4" />
            复制导入报告
          </button>
        </div>
      )}
    </div>
  );
}

export function ContentPackImportPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jsonText, setJsonText] = useState(CRDMO_SAMPLE_PACK_JSON);
  const [report, setReport] = useState<ContentPackReport | null>(null);
  const [loading, setLoading] = useState<"validate" | "import" | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [jsonToolError, setJsonToolError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const packPreview = useMemo(() => parsePackJson(jsonText), [jsonText]);

  const resetValidation = useCallback(() => {
    setReport(null);
    setImported(false);
    setRequestError(null);
  }, []);

  function mutateJsonText(next: string) {
    setJsonText(next);
    resetValidation();
    setJsonToolError(null);
  }

  function runJsonTool(action: "format" | "minify") {
    try {
      const value = JSON.parse(jsonText);
      mutateJsonText(JSON.stringify(value, null, action === "format" ? 2 : undefined));
    } catch (error) {
      setJsonToolError(
        `JSON 解析失败：${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  }

  async function copyText(text: string, hint: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyHint(hint);
      window.setTimeout(() => setCopyHint(null), 2000);
    } catch {
      setCopyHint("复制失败，请手动选择文本");
    }
  }

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
      setRequestError(
        error instanceof Error ? `JSON 解析失败：${error.message}` : "JSON 解析失败",
      );
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
      setRequestError(
        error instanceof Error ? `JSON 解析失败：${error.message}` : "JSON 解析失败",
      );
    } finally {
      setLoading(null);
    }
  }

  function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        mutateJsonText(reader.result);
      }
    };
    reader.onerror = () => setJsonToolError("读取文件失败");
    reader.readAsText(file, "utf-8");
    event.target.value = "";
  }

  const canImport = !imported && report?.ok === true;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sky-400">批量导入</p>
          <h1 className="mt-1 text-2xl font-semibold">内容包导入工作台</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            编辑 JSON 内容包、校验引用关系后 upsert 写入 Payload。默认提供 CRDMO
            最小示例，适合批量调试核药主线剧情与流程任务。
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

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-zinc-100">
              <FileJson className="size-4 text-sky-400" />
              内容包 JSON
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => runJsonTool("format")}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
              >
                <Sparkles className="size-3.5" />
                格式化 JSON
              </button>
              <button
                type="button"
                onClick={() => runJsonTool("minify")}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
              >
                <Minimize2 className="size-3.5" />
                压缩 JSON
              </button>
              <button
                type="button"
                onClick={() => mutateJsonText("")}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
              >
                <Trash2 className="size-3.5" />
                清空
              </button>
              <button
                type="button"
                onClick={() => mutateJsonText(CRDMO_SAMPLE_PACK_JSON)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
              >
                <RotateCcw className="size-3.5" />
                恢复示例
              </button>
              <button
                type="button"
                onClick={() => copyText(jsonText, "已复制 JSON")}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
              >
                <Copy className="size-3.5" />
                复制 JSON
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
              >
                <FileUp className="size-3.5" />
                选择 JSON 文件
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <textarea
              value={jsonText}
              onChange={(event) => mutateJsonText(event.target.value)}
              rows={26}
              spellCheck={false}
              className="min-h-[420px] w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-100 outline-none focus:border-sky-700"
              placeholder="粘贴或编辑内容包 JSON..."
            />

            {(jsonToolError || copyHint) && (
              <p className={cn("text-xs", jsonToolError ? "text-red-300" : "text-emerald-300")}>
                {jsonToolError || copyHint}
              </p>
            )}

            <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-3">
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
            {!canImport && !imported && (
              <p className="text-xs text-zinc-500">请先校验内容包，校验通过后才能导入。</p>
            )}
            {requestError && <p className="text-sm text-red-300">{requestError}</p>}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <FieldGuide />

          <Card className="border-zinc-800 bg-zinc-900/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-zinc-100">校验 / 导入报告</CardTitle>
            </CardHeader>
            <CardContent>
              {report ? (
                <ReportPanel
                  report={report}
                  packPreview={packPreview}
                  imported={imported}
                  onContinue={() => {
                    setImported(false);
                    setReport(null);
                    setRequestError(null);
                  }}
                  onCopyReport={() => {
                    if (report) void copyText(formatImportReportText(report), "已复制导入报告");
                  }}
                />
              ) : (
                <p className="text-sm text-zinc-500">
                  编辑左侧 JSON 后点击「校验内容包」，此处将显示数量统计、slug 摘要与任务表。
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
