"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Copy, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProjectFlowData, ProjectFlowTask } from "@/game/projectFlowLoader";
import { cn } from "@/lib/utils";

type StoryEntryOption = ProjectFlowData["options"]["storyEntries"][number];

export type StoryWorkbenchForm = {
  storySlug: string;
  title: string;
  description: string;
  inkFile: string;
  status: "draft" | "published";
  estimatedMinutes: string;
  tags: string;
};

type InkPreviewState = {
  loading: boolean;
  ok: boolean;
  inkFile: string;
  status?: "available" | "missing" | "load_failed";
  lines?: string[];
  choices?: { index: number; text: string; choiceId: string }[];
  ended?: boolean;
  error?: string;
  sourcePath?: string;
  compiledPath?: string;
};

type SaveMode = "update" | "bind" | "clone";

function FieldHint({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-5 text-zinc-500">{children}</p>;
}

function entryFromStory(
  story: ProjectFlowTask["stories"][number] | undefined,
  slug: string,
  taskTitle: string,
  taskDescription?: string,
): StoryWorkbenchForm {
  return {
    storySlug: story?.slug || `story_${slug}`,
    title: story?.title || taskTitle,
    description: story?.description || taskDescription || "",
    inkFile: story?.inkFile || "",
    status: (story?.status as "draft" | "published") || "draft",
    estimatedMinutes:
      story?.estimatedMinutes != null ? String(story.estimatedMinutes) : "",
    tags: (story?.tags || []).join(", "),
  };
}

function entryFromOption(entry: StoryEntryOption): StoryWorkbenchForm {
  return {
    storySlug: entry.slug,
    title: entry.title,
    description: entry.description || "",
    inkFile: entry.inkFile,
    status: (entry.status as "draft" | "published") || "draft",
    estimatedMinutes:
      entry.estimatedMinutes != null ? String(entry.estimatedMinutes) : "",
    tags: (entry.tags || []).join(", "),
  };
}

function inkStatusLabel(status: InkPreviewState["status"]) {
  if (status === "available") return "可用";
  if (status === "load_failed") return "编译失败";
  return "未找到";
}

function inkStatusMessage(preview: InkPreviewState) {
  if (preview.status === "available") return "当前 Ink 脚本可正常加载。";
  if (preview.status === "missing") {
    return `未找到对应 Ink 编译文件：${preview.compiledPath || `src/ink/stories/${preview.inkFile}.json`}。请先创建或编译 Ink 脚本。`;
  }
  return preview.error || "Ink 脚本存在但无法加载，请检查编译产物。";
}

export function ProjectFlowStoryWorkbench({
  slug,
  taskTitle,
  node,
  storyEntries,
  eventTitles,
  saveLabel,
  saving,
  error,
  issues,
  onSave,
}: {
  slug: string;
  taskTitle: string;
  node: ProjectFlowTask;
  storyEntries: StoryEntryOption[];
  eventTitles: Map<string, string>;
  saveLabel: string;
  saving: boolean;
  error: string | null;
  issues: string[];
  onSave: (payload: {
    mode: SaveMode;
    form: StoryWorkbenchForm;
    updateStoryEntryOnBind: boolean;
    cloneFromStorySlug?: string;
  }) => void;
}) {
  const primaryStory = node.stories[0];
  const committedForm = useMemo(
    () => entryFromStory(primaryStory, slug, taskTitle, node.description),
    [primaryStory, slug, taskTitle, node.description],
  );

  const [form, setForm] = useState<StoryWorkbenchForm>(committedForm);
  const [saveMode, setSaveMode] = useState<SaveMode>("update");
  const [bindCandidateSlug, setBindCandidateSlug] = useState<string | null>(null);
  const [updateStoryEntryOnBind, setUpdateStoryEntryOnBind] = useState(false);
  const [cloneSourceSlug, setCloneSourceSlug] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<InkPreviewState>({
    loading: false,
    ok: false,
    inkFile: committedForm.inkFile,
  });

  const activeEntry = useMemo(
    () => storyEntries.find((item) => item.slug === committedForm.storySlug),
    [storyEntries, committedForm.storySlug],
  );

  const editingEntry = useMemo(
    () => storyEntries.find((item) => item.slug === form.storySlug),
    [storyEntries, form.storySlug],
  );

  const relatedEventLabels = useMemo(() => {
    const slugs =
      editingEntry?.relatedEventSlugs?.length
        ? editingEntry.relatedEventSlugs
        : node.events.map((event) => event.slug);
    return slugs.map((eventSlug) => eventTitles.get(eventSlug) || eventSlug);
  }, [editingEntry, node.events, eventTitles]);

  const relatedNpcNames = useMemo(() => {
    if (editingEntry?.relatedNpcNames?.length) return editingEntry.relatedNpcNames;
    return node.npcNames;
  }, [editingEntry, node.npcNames]);

  const sharedTaskSlugs = useMemo(() => {
    const related = editingEntry?.relatedTaskSlugs || [];
    return related.filter((taskSlug) => taskSlug !== slug);
  }, [editingEntry, slug]);

  const loadPreview = useCallback(async (inkFile: string) => {
    if (!inkFile.trim()) {
      setPreview({ loading: false, ok: false, inkFile, status: "missing" });
      return;
    }
    setPreview((prev) => ({ ...prev, loading: true, inkFile }));
    try {
      const res = await fetch(
        `/api/ops/ink/preview?inkFile=${encodeURIComponent(inkFile)}`,
      );
      const data = await res.json();
      setPreview({
        loading: false,
        ok: Boolean(data.ok),
        inkFile,
        status: data.status || (data.ok ? "available" : "missing"),
        lines: data.lines,
        choices: data.choices,
        ended: data.ended,
        error: data.error,
        sourcePath: data.sourcePath,
        compiledPath: data.compiledPath,
      });
    } catch {
      setPreview({
        loading: false,
        ok: false,
        inkFile,
        status: "load_failed",
        error: "预览请求失败",
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const inkFile = form.inkFile;
    if (!inkFile.trim()) {
      return;
    }
    void (async () => {
      try {
        const res = await fetch(
          `/api/ops/ink/preview?inkFile=${encodeURIComponent(inkFile)}`,
        );
        const data = await res.json();
        if (cancelled) return;
        setPreview({
          loading: false,
          ok: Boolean(data.ok),
          inkFile,
          status: data.status || (data.ok ? "available" : "missing"),
          lines: data.lines,
          choices: data.choices,
          ended: data.ended,
          error: data.error,
          sourcePath: data.sourcePath,
          compiledPath: data.compiledPath,
        });
      } catch {
        if (cancelled) return;
        setPreview({
          loading: false,
          ok: false,
          inkFile,
          status: "load_failed",
          error: "预览请求失败",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.inkFile]);

  function resetToCommitted() {
    setForm(committedForm);
    setSaveMode("update");
    setBindCandidateSlug(null);
    setCloneSourceSlug(null);
    setUpdateStoryEntryOnBind(false);
    setNotice(null);
  }

  function handleSelectBind(candidateSlug: string) {
    const picked = storyEntries.find((item) => item.slug === candidateSlug);
    if (!picked) return;
    setBindCandidateSlug(candidateSlug);
    setForm(entryFromOption(picked));
    setSaveMode("bind");
    setCloneSourceSlug(null);
    setNotice("已选择剧情入口，保存后当前任务将调用该剧情。");
    const otherTasks = picked.relatedTaskSlugs.filter((taskSlug) => taskSlug !== slug);
    if (otherTasks.length > 0) {
      setNotice(
        "该剧情入口已被其它任务引用。复用后多个任务会调用同一段剧情，如需单独修改请先复制剧情入口。",
      );
    }
  }

  function confirmBind() {
    if (!bindCandidateSlug) return;
    setSaveMode("bind");
    setNotice("已确认绑定，请点击「保存剧情调用」生效。");
  }

  function handleClone() {
    const sourceSlug = form.storySlug;
    const newSlug = `story_${slug}`;
    if (storyEntries.some((item) => item.slug === newSlug)) {
      setNotice(`剧情入口 ${newSlug} 已存在，请在高级字段中修改标识后保存。`);
      setForm((prev) => ({ ...prev, storySlug: newSlug }));
      setSaveMode("clone");
      setCloneSourceSlug(sourceSlug);
      return;
    }
    const source = storyEntries.find((item) => item.slug === sourceSlug);
    setForm({
      ...(source ? entryFromOption(source) : form),
      storySlug: newSlug,
    });
    setSaveMode("clone");
    setCloneSourceSlug(sourceSlug);
    setBindCandidateSlug(null);
    setNotice(
      "已准备复制为当前任务专属剧情入口。复制剧情入口不会复制 Ink 脚本内容；如需独立剧情文本，请另行创建专属 Ink 脚本并修改 inkFile。",
    );
  }

  async function copyInkFileName() {
    if (!form.inkFile) return;
    try {
      await navigator.clipboard.writeText(form.inkFile);
      setNotice(`已复制 Ink 脚本名：${form.inkFile}`);
    } catch {
      setNotice("复制失败，请手动复制 Ink 脚本名。");
    }
  }

  return (
    <section className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
      <header>
        <h2 className="text-lg font-medium text-zinc-100">任务剧情调用与修改</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          当前任务通过剧情入口调用 Ink 剧情脚本。这里用于选择、绑定和修改剧情入口信息，并预览当前
          Ink 脚本效果。具体对话内容来自 Ink 脚本文件，不建议在这里随意新写；如需修改对话，应修改对应
          Ink 脚本后重新编译。
        </p>
      </header>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
        <h3 className="text-sm font-medium text-zinc-200">当前调用</h3>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-zinc-500">当前任务</dt>
            <dd className="mt-1 text-zinc-100">{taskTitle}</dd>
            <dd className="font-mono text-[10px] text-zinc-600">{slug}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">剧情入口</dt>
            <dd className="mt-1 text-zinc-100">
              {activeEntry?.title || primaryStory?.title || "未绑定"}
            </dd>
            <dd className="font-mono text-[10px] text-zinc-600">
              {committedForm.storySlug}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Ink 脚本</dt>
            <dd className="mt-1 font-mono text-sm text-zinc-200">
              {committedForm.inkFile || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">脚本状态</dt>
            <dd className="mt-1">
              <Badge
                variant="outline"
                className={cn(
                  preview.status === "available"
                    ? "border-emerald-800 text-emerald-300"
                    : preview.status === "load_failed"
                      ? "border-amber-800 text-amber-300"
                      : "border-rose-800 text-rose-300",
                )}
              >
                {inkStatusLabel(preview.status)}
              </Badge>
            </dd>
            <dd className="mt-1 text-xs text-zinc-500">
              {preview.loading ? "正在检查…" : inkStatusMessage(preview)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-zinc-500">关联事件</dt>
            <dd className="mt-1 text-zinc-300">
              {relatedEventLabels.length ? relatedEventLabels.join("、") : "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-zinc-500">关联 NPC</dt>
            <dd className="mt-1 text-zinc-300">
              {relatedNpcNames.length ? relatedNpcNames.join("、") : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
        <h3 className="text-sm font-medium text-zinc-200">选择已有剧情入口</h3>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          可以将当前任务绑定到已有剧情入口。复用剧情入口时，多个任务会调用同一段 Ink 脚本。
        </p>
        <label className="mt-3 block space-y-2">
          <Label>绑定已有剧情入口</Label>
          <select
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm"
            value={bindCandidateSlug || ""}
            onChange={(event) => {
              const value = event.target.value;
              if (!value) {
                resetToCommitted();
                return;
              }
              handleSelectBind(value);
            }}
          >
            <option value="">— 选择剧情入口 —</option>
            {storyEntries.map((entry) => (
              <option key={entry.slug} value={entry.slug}>
                {entry.title}（Ink：{entry.inkFile}）
              </option>
            ))}
          </select>
          {bindCandidateSlug ? (
            <p className="font-mono text-[10px] text-zinc-600">{bindCandidateSlug}</p>
          ) : null}
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!bindCandidateSlug}
            onClick={confirmBind}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            绑定到当前任务
          </button>
          <button
            type="button"
            disabled={!bindCandidateSlug}
            onClick={resetToCommitted}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            取消选择
          </button>
        </div>
        {bindCandidateSlug && sharedTaskSlugs.length > 0 ? (
          <p className="mt-3 text-xs text-amber-300">
            该剧情入口已被其它任务引用（{sharedTaskSlugs.join("、")}
            ）。复用后多个任务会调用同一段剧情，如需单独修改请先复制剧情入口。
          </p>
        ) : null}
        <label className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
          <input
            type="checkbox"
            checked={updateStoryEntryOnBind}
            onChange={(event) => setUpdateStoryEntryOnBind(event.target.checked)}
            disabled={saveMode !== "bind"}
          />
          绑定时同时更新剧情入口信息（标题、说明等）
        </label>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-zinc-200">剧情入口信息</h3>
            <FieldHint>
              这里只修改剧情入口的标题、说明和后台关联信息，不直接修改 Ink 对话正文。
            </FieldHint>
          </div>
          <button
            type="button"
            onClick={handleClone}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            复制为当前任务专属剧情入口
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <label className="block space-y-2">
            <Label>剧情标题</Label>
            <FieldHint>
              用于后台和任务详情展示，不等同于 Ink 脚本正文。
            </FieldHint>
            <Input
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </label>
          <label className="block space-y-2">
            <Label>剧情说明</Label>
            <FieldHint>
              用于说明这段剧情的用途和适用场景，不是完整对话正文。
            </FieldHint>
            <textarea
              className="min-h-20 w-full rounded-md border border-zinc-700 bg-zinc-950 p-3 text-sm"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <Label>剧情状态</Label>
              <select
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm"
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    status: event.target.value as "draft" | "published",
                  }))
                }
              >
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
              </select>
            </label>
            <label className="block space-y-2">
              <Label>预计时长（分钟）</Label>
              <Input
                type="number"
                min={0}
                value={form.estimatedMinutes}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    estimatedMinutes: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <label className="block space-y-2">
            <Label>标签</Label>
            <Input
              placeholder="多个标签用英文逗号分隔"
              value={form.tags}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, tags: event.target.value }))
              }
            />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-zinc-200">Ink 脚本预览</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadPreview(form.inkFile)}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
            >
              <RefreshCw className="size-3.5" />
              刷新预览
            </button>
            <button
              type="button"
              disabled={!form.inkFile}
              onClick={() => void copyInkFileName()}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
            >
              <Copy className="size-3.5" />
              复制 Ink 文件名
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          预览当前 Ink 脚本的初始文本和玩家选项，用于检查调用是否正确。
        </p>
        <div className="mt-3 space-y-2 text-xs text-zinc-500">
          <p>源文件通常为：src/ink/stories/{form.inkFile || "…"}.ink</p>
          <p>编译产物为：src/ink/stories/{form.inkFile || "…"}.json</p>
        </div>
        <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-950 p-4">
          {preview.loading ? (
            <p className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="size-4 animate-spin" />
              加载预览…
            </p>
          ) : preview.ok ? (
            <div className="space-y-4">
              <div className="space-y-2 text-sm leading-6 text-zinc-200">
                {preview.lines?.length ? (
                  preview.lines.map((line) => <p key={line}>{line}</p>)
                ) : (
                  <p className="text-zinc-500">（脚本暂无初始文本）</p>
                )}
              </div>
              {preview.choices?.length ? (
                <div>
                  <p className="text-xs text-zinc-500">当前可选选项</p>
                  <ul className="mt-2 space-y-1 text-sm text-sky-200">
                    {preview.choices.map((choice) => (
                      <li key={choice.choiceId}>
                        {choice.index + 1}. {choice.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="text-xs text-zinc-500">
                {preview.ended ? "剧情已结束" : "剧情进行中"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-rose-300">
              {preview.error || inkStatusMessage(preview)}
            </p>
          )}
        </div>
      </div>

      <details className="rounded-lg border border-zinc-800 p-4">
        <summary className="cursor-pointer text-sm text-zinc-400">
          高级关联字段
        </summary>
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          一般不需要修改。只有在切换剧情入口或更换 Ink 脚本时才调整。
        </p>
        <div className="mt-4 space-y-4">
          <label className="block space-y-2">
            <Label>剧情入口标识（storySlug）</Label>
            <FieldHint>
              系统内部用于绑定剧情入口的唯一标识。一般不要手动修改；如需新建当前任务专属剧情入口，请使用「复制为当前任务专属剧情入口」。
            </FieldHint>
            <Input
              className="font-mono text-sm"
              value={form.storySlug}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, storySlug: event.target.value }))
              }
            />
          </label>
          <label className="block space-y-2">
            <Label>Ink 脚本名（inkFile）</Label>
            <FieldHint>
              当前剧情入口调用的 Ink 脚本名，不需要填写 .ink 后缀。具体对话和选项来自对应
              Ink 脚本，不建议在这里随意编造。
            </FieldHint>
            <Input
              className="font-mono text-sm"
              placeholder="project_document_task"
              value={form.inkFile}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, inkFile: event.target.value }))
              }
            />
          </label>
        </div>
      </details>

      {notice ? <p className="text-sm text-amber-300">{notice}</p> : null}
      {saveMode !== "update" ? (
        <p className="text-xs text-zinc-500">
          待保存操作：
          {saveMode === "bind" ? "绑定剧情入口" : "复制并绑定专属剧情入口"}
        </p>
      ) : null}

      <div className="sticky bottom-0 border-t border-zinc-800 bg-zinc-950/95 py-4 backdrop-blur">
        {error ? <p className="mb-2 text-sm text-rose-300">{error}</p> : null}
        {issues.length ? (
          <ul className="mb-2 space-y-1 text-xs text-amber-300">
            {issues.map((issue) => (
              <li key={issue}>· {issue}</li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            onSave({
              mode: saveMode,
              form,
              updateStoryEntryOnBind,
              cloneFromStorySlug: cloneSourceSlug || undefined,
            })
          }
          className={cn(buttonVariants({ size: "sm" }), "gap-2")}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          {saveLabel}
        </button>
      </div>
    </section>
  );
}
