"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROJECT_STAGES } from "@/game/projectStages";
import type {
  ProjectFlowData,
  ProjectFlowTask,
} from "@/game/projectFlowLoader";
import {
  buildPrerequisiteTaskMap,
  findPrerequisiteCyclePath,
  formatPrerequisiteCycleIssue,
  suggestRiskEventSlug,
} from "@/game/projectFlowNodeUtils";
import {
  getTaskDisplayName,
  locationToDisplayOption,
} from "@/game/contentDisplayLabels";
import { ArtifactStatusSelect } from "@/components/ops/OpsDisplayHelpers";
import { ProjectFlowNodeLifecyclePanel } from "@/components/ops/ProjectFlowNodeLifecyclePanel";
import { ProjectFlowStoryWorkbench } from "@/components/ops/ProjectFlowStoryWorkbench";
import { cn } from "@/lib/utils";

type EditorTab = "basic" | "flow" | "task" | "action" | "story" | "events";

type TaskOption = ProjectFlowData["options"]["tasks"][number];

type EventFormState = {
  slug: string;
  enabled: boolean;
  title: string;
  description: string;
  eventType: string;
  riskTags: string[];
  weight: number;
  onceOnly: boolean;
  cooldownDays: number;
};

function buildTaskForm(node: ProjectFlowTask, slug: string) {
  const primaryStory = node.stories[0];
  return {
    title: node.title,
    description: node.description || "",
    stage: node.stage || "",
    npcNames: [...node.npcNames],
    inputArtifacts: node.inputArtifactLabels.map((item) => ({
      artifactSlug: item.slug,
      minStatus: item.status || "draft",
    })),
    outputArtifacts: node.outputArtifactLabels.map((item) => ({
      artifactSlug: item.slug,
      status: item.status || "draft",
    })),
    milestoneKeys: node.milestoneLabels.map((item) => item.key),
    prerequisiteTaskSlugs: [...(node.prerequisiteTaskSlugs || [])],
    inkFile: primaryStory?.inkFile || "",
    storySlug: primaryStory?.slug || node.storySlug || `story_${slug}`,
  };
}

function buildActionForm(node: ProjectFlowTask) {
  const primaryAction = node.actionSlugs[0];
  const primaryLocationSlug = node.locationNames[0]?.slug || "";
  return {
    actionSlug: primaryAction?.slug || "",
    label: primaryAction?.label || "",
    description: primaryAction?.description || "",
    locationSlug: primaryLocationSlug,
    npcNames: [...node.npcNames],
  };
}

function buildEventForms(node: ProjectFlowTask): EventFormState[] {
  return node.events.map((event) => ({
    slug: event.slug,
    enabled: event.enabled !== false,
    title: event.title,
    description: event.description || "",
    eventType: event.eventType || event.businessType,
    riskTags: [...(event.riskTags || [])],
    weight: event.weight ?? 10,
    onceOnly: event.onceOnly ?? false,
    cooldownDays: event.cooldownDays ?? 0,
  }));
}

const TABS: { id: EditorTab; label: string }[] = [
  { id: "basic", label: "节点总览" },
  { id: "flow", label: "流程关系" },
  { id: "task", label: "任务与成果" },
  { id: "action", label: "办理入口" },
  { id: "story", label: "剧情调用" },
  { id: "events", label: "风险事件" },
];

const TAB_SAVE_LABELS: Record<EditorTab, string> = {
  basic: "保存节点信息",
  flow: "保存流程关系",
  task: "保存任务与成果",
  action: "保存办理入口",
  story: "保存剧情调用",
  events: "保存风险事件",
};

function getSuccessorTasks(tasks: TaskOption[], currentSlug: string) {
  const dependents = tasks.filter(
    (task) =>
      task.slug !== currentSlug &&
      (task.prerequisiteTaskSlugs || []).includes(currentSlug),
  );
  return {
    mainline: dependents.filter((task) => task.category === "mainline"),
    other: dependents.filter((task) => task.category !== "mainline"),
  };
}

function getFlowRelationWarnings(
  currentSlug: string,
  selectedPrerequisites: string[],
  tasks: TaskOption[],
): string[] {
  const warnings: string[] = [];
  const knownSlugs = new Set(tasks.map((task) => task.slug));

  if (selectedPrerequisites.includes(currentSlug)) {
    warnings.push("不能将当前任务设为自己的前置任务");
  }

  for (const prereqSlug of selectedPrerequisites) {
    if (!knownSlugs.has(prereqSlug)) {
      warnings.push(
        `前置任务不存在：${getTaskDisplayName(prereqSlug, tasks)}（${prereqSlug}）`,
      );
    }
  }

  const prerequisiteMap = buildPrerequisiteTaskMap(
    tasks,
    currentSlug,
    selectedPrerequisites,
  );
  const cyclePath = findPrerequisiteCyclePath(currentSlug, prerequisiteMap);
  if (cyclePath) {
    warnings.push(formatPrerequisiteCycleIssue(cyclePath));
  }

  return [...new Set(warnings)];
}

function renderSuccessorTaskList(
  tasks: TaskOption[],
  stageNameById: Map<string, string>,
  link = false,
) {
  if (!tasks.length) return null;
  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li
          key={task.slug}
          className="rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2"
        >
          {link ? (
            <Link
              href={`/ops/project-flow/node/${task.slug}?tab=flow`}
              className="text-sm text-sky-300 hover:text-sky-200"
            >
              {task.title}
            </Link>
          ) : (
            <p className="text-sm text-zinc-100">{task.title}</p>
          )}
          <p className="font-mono text-[10px] text-zinc-600">{task.slug}</p>
          <p className="text-xs text-zinc-500">
            {stageNameById.get(task.stage) || task.stage || "未分阶段"}
            {task.category !== "mainline" ? " · 补正/其他" : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

function MainlinePrerequisiteSelector({
  tasks,
  currentSlug,
  stageNameById,
  selected,
  onToggle,
}: {
  tasks: TaskOption[];
  currentSlug: string;
  stageNameById: Map<string, string>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const mainlineByStage = useMemo(() => {
    const groups = new Map<string, TaskOption[]>();
    for (const task of tasks) {
      if (task.slug === currentSlug || task.category !== "mainline") continue;
      const stageId = task.stage || "UNKNOWN";
      const list = groups.get(stageId) || [];
      list.push(task);
      groups.set(stageId, list);
    }
    return groups;
  }, [tasks, currentSlug]);

  const otherTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.slug !== currentSlug && task.category !== "mainline",
      ),
    [tasks, currentSlug],
  );

  function renderTaskOption(task: TaskOption) {
    const stageLabel = stageNameById.get(task.stage) || task.stage || "未分阶段";
    return (
      <label
        key={task.slug}
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
          selected.includes(task.slug)
            ? "border-sky-700 bg-sky-950/20"
            : "border-zinc-800 bg-zinc-950/40",
        )}
      >
        <input
          type="checkbox"
          checked={selected.includes(task.slug)}
          onChange={() => onToggle(task.slug)}
          className="mt-1"
        />
        <span>
          <span className="block text-sm text-zinc-200">{task.title}</span>
          <span className="mt-1 block font-mono text-[10px] text-zinc-600">
            {task.slug}
          </span>
          <span className="mt-1 block text-xs text-zinc-500">{stageLabel}</span>
          {!task.enabled ? (
            <span className="mt-1 block text-xs text-zinc-600">已禁用</span>
          ) : null}
        </span>
      </label>
    );
  }

  return (
    <div className="space-y-5">
      {PROJECT_STAGES.filter((stage) => stage.id !== "OPENING").map((stage) => {
        const stageTasks = mainlineByStage.get(stage.id);
        if (!stageTasks?.length) return null;
        return (
          <div key={stage.id}>
            <p className="text-xs font-medium text-zinc-400">{stage.name}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {stageTasks.map(renderTaskOption)}
            </div>
          </div>
        );
      })}
      {otherTasks.length ? (
        <details className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
          <summary className="cursor-pointer text-sm text-zinc-400">
            补正/其他任务（{otherTasks.length}）
          </summary>
          <p className="mt-2 text-xs text-zinc-600">
            默认折叠，避免干扰主线流程关系配置。
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {otherTasks.map(renderTaskOption)}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function parseTab(value: string | null): EditorTab {
  if (value && TABS.some((tab) => tab.id === value)) return value as EditorTab;
  return "basic";
}

function ChoiceGrid({
  choices,
  selected,
  onToggle,
}: {
  choices: { value: string; label: string; hint?: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {choices.map((choice) => (
        <label
          key={choice.value}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
            selected.includes(choice.value)
              ? "border-sky-700 bg-sky-950/20"
              : "border-zinc-800 bg-zinc-950/40",
          )}
        >
          <input
            type="checkbox"
            checked={selected.includes(choice.value)}
            onChange={() => onToggle(choice.value)}
            className="mt-1"
          />
          <span>
            <span className="block text-sm text-zinc-200">{choice.label}</span>
            {choice.hint ? (
              <span className="mt-1 block text-xs text-zinc-500">
                {choice.hint}
              </span>
            ) : null}
          </span>
        </label>
      ))}
    </div>
  );
}

function SaveBar({
  saving,
  error,
  issues,
  onSave,
  saveLabel = "保存当前页",
}: {
  saving: boolean;
  error: string | null;
  issues: string[];
  onSave: () => void;
  saveLabel?: string;
}) {
  return (
    <div className="sticky bottom-0 mt-6 border-t border-zinc-800 bg-zinc-950/95 py-4 backdrop-blur">
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
        onClick={onSave}
        className={cn(buttonVariants({ size: "sm" }), "gap-2")}
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        {saveLabel}
      </button>
    </div>
  );
}

export function ProjectFlowNodeEditor({
  slug,
  stageName,
  node: initialNode,
  options,
}: {
  slug: string;
  stageName: string;
  node: ProjectFlowTask;
  options: ProjectFlowData["options"];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  const [node, setNode] = useState(initialNode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[]>([]);

  const [taskForm, setTaskForm] = useState(() => buildTaskForm(initialNode, slug));
  const [actionForm, setActionForm] = useState(() => buildActionForm(initialNode));
  const [eventForms, setEventForms] = useState<EventFormState[]>(() =>
    buildEventForms(initialNode),
  );

  function applyNodeSnapshot(nextNode: ProjectFlowTask) {
    setNode(nextNode);
    setTaskForm(buildTaskForm(nextNode, slug));
    setActionForm(buildActionForm(nextNode));
    setEventForms(buildEventForms(nextNode));
  }

  const artifactStatusMap = useMemo(() => {
    const map = new Map<string, { status: string; label: string }[]>();
    for (const artifact of options.artifacts) {
      map.set(
        artifact.slug,
        artifact.allowedStatusOptions.length
          ? artifact.allowedStatusOptions
          : [{ status: artifact.defaultStatus, label: artifact.defaultStatus }],
      );
    }
    return map;
  }, [options.artifacts]);

  const taskTitleMap = useMemo(
    () => new Map(options.tasks.map((task) => [task.slug, task.title])),
    [options.tasks],
  );

  const eventTitles = useMemo(
    () => new Map(options.events.map((event) => [event.slug, event.title])),
    [options.events],
  );

  const stageNameById = useMemo(
    () =>
      new Map<string, string>(
        PROJECT_STAGES.map((stage) => [stage.id, stage.name]),
      ),
    [],
  );

  const taskBySlug = useMemo(
    () => new Map(options.tasks.map((task) => [task.slug, task])),
    [options.tasks],
  );

  const successorGroups = useMemo(
    () => getSuccessorTasks(options.tasks, slug),
    [options.tasks, slug],
  );
  const successorCount =
    successorGroups.mainline.length + successorGroups.other.length;

  const flowWarnings = useMemo(
    () =>
      getFlowRelationWarnings(
        slug,
        taskForm.prerequisiteTaskSlugs,
        options.tasks,
      ),
    [slug, taskForm.prerequisiteTaskSlugs, options.tasks],
  );

  function renderConfiguredPrerequisite(taskSlug: string) {
    const task = taskBySlug.get(taskSlug);
    return (
      <li
        key={taskSlug}
        className="rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2"
      >
        <p className="text-sm text-zinc-100">
          {task?.title || taskTitleMap.get(taskSlug) || taskSlug}
        </p>
        <p className="font-mono text-[10px] text-zinc-600">{taskSlug}</p>
        {task ? (
          <p className="text-xs text-zinc-500">
            {stageNameById.get(task.stage) || task.stage || "未分阶段"}
          </p>
        ) : null}
      </li>
    );
  }

  function setTab(next: EditorTab) {
    router.replace(`/ops/project-flow/node/${slug}?tab=${next}`);
  }

  async function refreshNode() {
    const res = await fetch(`/api/ops/project-flow/nodes/${slug}`);
    if (!res.ok) return;
    const data = (await res.json()) as {
      node: ProjectFlowTask;
      stageName: string;
    };
    applyNodeSnapshot(data.node);
    router.refresh();
  }

  async function patchJson(
    path: string,
    body: unknown,
    options?: { afterSuccess?: () => void },
  ) {
    setSaving(true);
    setError(null);
    setIssues([]);
    try {
      const res = await fetch(path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await res.json().catch(() => null)) as {
        error?: string;
        issues?: string[];
      } | null;
      if (!res.ok) {
        setError(payload?.error || "保存失败");
        setIssues(payload?.issues || []);
        return;
      }
      await refreshNode();
      options?.afterSuccess?.();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  function addRiskEvent() {
    const reserved = new Set([
      ...eventForms.map((event) => event.slug),
      ...node.events.map((event) => event.slug),
    ]);
    const eventSlug = suggestRiskEventSlug(slug, reserved);
    setEventForms((prev) => [
      ...prev,
      {
        slug: eventSlug,
        enabled: true,
        title: `${node.title}补正事件`,
        description: "",
        eventType: "材料补正",
        riskTags: [],
        weight: 10,
        onceOnly: false,
        cooldownDays: 0,
      },
    ]);
  }

  function toggleListValue(list: string[], value: string) {
    return list.includes(value)
      ? list.filter((item) => item !== value)
      : [...list, value];
  }

  function renderArtifactEditor(
    selected: { artifactSlug: string; minStatus?: string; status?: string }[],
    mode: "input" | "output",
    onChange: (
      next: { artifactSlug: string; minStatus?: string; status?: string }[],
    ) => void,
  ) {
    const selectedSlugs = selected.map((item) => item.artifactSlug);
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {options.artifacts.map((artifact) => {
          const checked = selectedSlugs.includes(artifact.slug);
          const current = selected.find(
            (item) => item.artifactSlug === artifact.slug,
          );
          const statusOptions = artifactStatusMap.get(artifact.slug) || [
            { status: artifact.defaultStatus, label: artifact.defaultStatus },
          ];
          return (
            <div
              key={artifact.slug}
              className={cn(
                "rounded-lg border p-3",
                checked ? "border-sky-700 bg-sky-950/20" : "border-zinc-800",
              )}
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    if (checked) {
                      onChange(
                        selected.filter(
                          (item) => item.artifactSlug !== artifact.slug,
                        ),
                      );
                    } else {
                      onChange([
                        ...selected,
                        mode === "input"
                          ? {
                              artifactSlug: artifact.slug,
                              minStatus: artifact.defaultStatus,
                            }
                          : {
                              artifactSlug: artifact.slug,
                              status: artifact.defaultStatus,
                            },
                      ]);
                    }
                  }}
                  className="mt-1"
                />
                <span>
                  <span className="text-sm text-zinc-200">{artifact.name}</span>
                  <span className="mt-0.5 block font-mono text-[10px] text-zinc-600">
                    {artifact.slug}
                  </span>
                </span>
              </label>
              {checked ? (
                <ArtifactStatusSelect
                  className="mt-3 w-full p-2 text-xs"
                  value={
                    mode === "input"
                      ? current?.minStatus || artifact.defaultStatus
                      : current?.status || artifact.defaultStatus
                  }
                  statusOptions={statusOptions}
                  onChange={(nextStatus) => {
                    onChange(
                      selected.map((item) =>
                        item.artifactSlug === artifact.slug
                          ? mode === "input"
                            ? { ...item, minStatus: nextStatus }
                            : { ...item, status: nextStatus }
                          : item,
                      ),
                    );
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <Link
            href="/ops/project-flow"
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
          >
            <ArrowLeft className="size-3" /> 返回流程编排
          </Link>
          <p className="mt-2 text-xs text-sky-300">{stageName}</p>
          <h1 className="mt-1 text-2xl font-semibold">{node.title}</h1>
          <p className="mt-1 font-mono text-xs text-zinc-600">{slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {node.enabled === false ? (
            <Badge variant="outline" className="border-zinc-600 text-zinc-400">
              已停用
            </Badge>
          ) : null}
          {node.configurationIssues.length ? (
            <Badge
              variant="outline"
              className="border-amber-700 text-amber-300"
            >
              {node.configurationIssues.length} 项待完善
            </Badge>
          ) : (
            <Badge>配置完整</Badge>
          )}
        </div>
      </header>

      <nav className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              buttonVariants({
                variant: tab === item.id ? "default" : "outline",
                size: "sm",
              }),
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "basic" ? (
        <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          <p className="text-sm leading-6 text-zinc-300">
            {node.description || "尚未填写任务说明"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-xs text-zinc-500">办理地点</p>
              <p className="mt-1">
                {node.locationNames.map((item) => item.name).join("、") || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">协同对象</p>
              <p className="mt-1">{node.npcNames.join("、") || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">运行时状态</p>
              <p
                className={cn(
                  "mt-1",
                  node.runtime.available
                    ? "text-emerald-300"
                    : "text-amber-300",
                )}
              >
                {node.runtime.available ? "可办理" : "等待前置"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">流程关系</p>
              <p className="mt-1">
                前置 {(node.prerequisiteTaskSlugs || []).length} · 后续主线{" "}
                {successorGroups.mainline.length} · 后续其他{" "}
                {successorGroups.other.length}
              </p>
            </div>
          </div>
          {!node.runtime.available && node.runtime.blockingReasons.length ? (
            <div className="rounded-lg border border-amber-900/40 bg-amber-950/10 p-4">
              <p className="text-xs text-amber-400">阻塞原因</p>
              <ul className="mt-2 space-y-1 text-sm text-amber-200">
                {node.runtime.blockingReasons.map((reason) => (
                  <li key={reason}>· {reason}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {(node.prerequisiteTaskSlugs || []).length ? (
            <div>
              <p className="text-xs text-zinc-500">当前前置任务</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(node.prerequisiteTaskSlugs || []).map((taskSlug) => (
                  <Badge key={taskSlug} variant="outline" className="font-normal">
                    {taskTitleMap.get(taskSlug) || taskSlug}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          {successorCount ? (
            <div className="space-y-3">
              {successorGroups.mainline.length ? (
                <div>
                  <p className="text-xs text-zinc-500">主线后续任务</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {successorGroups.mainline.map((task) => (
                      <Badge key={task.slug} variant="outline" className="font-normal">
                        {task.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {successorGroups.other.length ? (
                <div>
                  <p className="text-xs text-zinc-500">补正/其他后续任务</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {successorGroups.other.map((task) => (
                      <Badge
                        key={task.slug}
                        variant="outline"
                        className="border-zinc-700 font-normal text-zinc-400"
                      >
                        {task.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          {node.configurationIssues.length ? (
            <ul className="space-y-1 text-sm text-amber-300">
              {node.configurationIssues.map((issue) => (
                <li key={issue}>· {issue}</li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              onClick={() => setTab("flow")}
            >
              调整流程关系
            </button>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              onClick={() => setTab("task")}
            >
              调整任务与成果
            </button>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              onClick={() => setTab("action")}
            >
              调整办理入口
            </button>
          </div>
        </section>
      ) : null}

      {tab === "flow" ? (
        <section className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-sky-300">{stageName}</p>
              <h2 className="mt-1 text-lg font-medium text-zinc-100">{node.title}</h2>
              <p className="mt-1 font-mono text-xs text-zinc-600">{slug}</p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                node.runtime.available
                  ? "border-emerald-700 text-emerald-300"
                  : "border-amber-700 text-amber-300",
              )}
            >
              {node.runtime.available ? "可办理" : "等待前置"}
            </Badge>
          </div>

          {!node.runtime.available && node.runtime.blockingReasons.length ? (
            <div className="rounded-lg border border-amber-900/40 bg-amber-950/10 p-4">
              <p className="text-xs text-amber-400">当前阻塞原因</p>
              <ul className="mt-2 space-y-1 text-sm text-amber-200">
                {node.runtime.blockingReasons.map((reason) => (
                  <li key={reason}>· {reason}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="text-sm font-medium text-zinc-200">已配置的前置任务</p>
              {(taskForm.prerequisiteTaskSlugs || []).length ? (
                <ul className="space-y-2">
                  {taskForm.prerequisiteTaskSlugs.map(renderConfiguredPrerequisite)}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">尚未配置前置任务，当前节点可并行办理。</p>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="text-sm font-medium text-zinc-200">后续任务（反向推断）</p>
              {successorGroups.mainline.length ? (
                <div>
                  <p className="text-xs text-zinc-500">主线后续</p>
                  {renderSuccessorTaskList(
                    successorGroups.mainline,
                    stageNameById,
                    true,
                  )}
                </div>
              ) : null}
              {successorGroups.other.length ? (
                <div>
                  <p className="text-xs text-zinc-500">补正/其他后续</p>
                  {renderSuccessorTaskList(successorGroups.other, stageNameById, true)}
                </div>
              ) : null}
              {!successorCount ? (
                <p className="text-sm text-zinc-500">暂无其他任务将当前节点设为前置。</p>
              ) : null}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">选择前置任务</Label>
            <p className="mb-3 text-xs text-zinc-500">
              默认按阶段展示主线任务；补正/其他任务折叠在下方，避免干扰主线配置。
            </p>
            <MainlinePrerequisiteSelector
              tasks={options.tasks}
              currentSlug={slug}
              stageNameById={stageNameById}
              selected={taskForm.prerequisiteTaskSlugs}
              onToggle={(value) =>
                setTaskForm((prev) => ({
                  ...prev,
                  prerequisiteTaskSlugs: toggleListValue(
                    prev.prerequisiteTaskSlugs,
                    value,
                  ),
                }))
              }
            />
          </div>

          {flowWarnings.length ? (
            <ul className="space-y-1 rounded-lg border border-amber-900/40 bg-amber-950/10 p-4 text-sm text-amber-200">
              {flowWarnings.map((warning) => (
                <li key={warning}>· {warning}</li>
              ))}
            </ul>
          ) : null}

          <SaveBar
            saving={saving}
            error={error}
            issues={issues}
            saveLabel={TAB_SAVE_LABELS.flow}
            onSave={() => {
              if (flowWarnings.length) {
                setError("请先修正流程关系警告");
                setIssues(flowWarnings);
                return;
              }
              void patchJson(`/api/ops/project-flow/nodes/${slug}/task`, taskForm, {
                afterSuccess: () => setTab("basic"),
              });
            }}
          />
        </section>
      ) : null}

      {tab === "task" ? (
        <section className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <Label>流程任务名称</Label>
              <Input
                value={taskForm.title}
                onChange={(event) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <Label>任务说明</Label>
              <textarea
                className="min-h-24 w-full rounded-md border border-zinc-700 bg-zinc-950 p-3 text-sm"
                value={taskForm.description}
                onChange={(event) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-2">
              <Label>所属项目阶段</Label>
              <select
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm"
                value={taskForm.stage}
                onChange={(event) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    stage: event.target.value,
                  }))
                }
              >
                {PROJECT_STAGES.filter((stage) => stage.id !== "OPENING").map(
                  (stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
          <div>
            <Label className="mb-2 block">协同对象</Label>
            <ChoiceGrid
              choices={options.npcs.map((npc) => ({
                value: npc.name,
                label: npc.name,
                hint: npc.description,
              }))}
              selected={taskForm.npcNames}
              onToggle={(value) =>
                setTaskForm((prev) => ({
                  ...prev,
                  npcNames: toggleListValue(prev.npcNames, value),
                }))
              }
            />
          </div>
          <div>
            <Label className="mb-2 block">办理前需要的材料</Label>
            {renderArtifactEditor(taskForm.inputArtifacts, "input", (next) =>
              setTaskForm((prev) => ({
                ...prev,
                inputArtifacts: next as typeof prev.inputArtifacts,
              })),
            )}
          </div>
          <div>
            <Label className="mb-2 block">完成后产出的成果</Label>
            {renderArtifactEditor(taskForm.outputArtifacts, "output", (next) =>
              setTaskForm((prev) => ({
                ...prev,
                outputArtifacts: next as typeof prev.outputArtifacts,
              })),
            )}
          </div>
          <div>
            <Label className="mb-2 block">解锁关键节点</Label>
            <ChoiceGrid
              choices={options.milestones.map((item) => ({
                value: item.key,
                label: item.label,
              }))}
              selected={taskForm.milestoneKeys}
              onToggle={(value) =>
                setTaskForm((prev) => ({
                  ...prev,
                  milestoneKeys: toggleListValue(prev.milestoneKeys, value),
                }))
              }
            />
          </div>
          <SaveBar
            saving={saving}
            error={error}
            issues={issues}
            saveLabel={TAB_SAVE_LABELS.task}
            onSave={() =>
              void patchJson(
                `/api/ops/project-flow/nodes/${slug}/task`,
                taskForm,
              )
            }
          />
        </section>
      ) : null}

      {tab === "action" ? (
        <section className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          {node.actionSlugs.length > 1 ? (
            <label className="block space-y-2">
              <Label>选择地点行动</Label>
              <select
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm"
                value={actionForm.actionSlug}
                onChange={(event) => {
                  const picked = node.actionSlugs.find(
                    (item) => item.slug === event.target.value,
                  );
                  if (!picked) return;
                  setActionForm({
                    actionSlug: picked.slug,
                    label: picked.label,
                    description: picked.description,
                    locationSlug:
                      node.locationNames.find((loc) => loc.slug)?.slug ||
                      node.locationNames[0]?.slug ||
                      "",
                    npcNames: [...node.npcNames],
                  });
                }}
              >
                {node.actionSlugs.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block space-y-2">
            <Label>地点行动名称</Label>
            <Input
              value={actionForm.label}
              onChange={(event) =>
                setActionForm((prev) => ({
                  ...prev,
                  label: event.target.value,
                }))
              }
            />
          </label>
          <label className="block space-y-2">
            <Label>地点行动说明</Label>
            <textarea
              className="min-h-20 w-full rounded-md border border-zinc-700 bg-zinc-950 p-3 text-sm"
              value={actionForm.description}
              onChange={(event) =>
                setActionForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </label>
          <label className="block space-y-2">
            <Label>办理地点</Label>
            <select
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm"
              value={actionForm.locationSlug}
              onChange={(event) =>
                setActionForm((prev) => ({
                  ...prev,
                  locationSlug: event.target.value,
                }))
              }
            >
              {options.locations.map((location) => (
                <option key={location.slug} value={location.slug}>
                  {locationToDisplayOption(location).label}
                  {location.name !== location.slug ? `（${location.slug}）` : ""}
                </option>
              ))}
            </select>
          </label>
          <div>
            <Label className="mb-2 block">协同对象</Label>
            <ChoiceGrid
              choices={options.npcs.map((npc) => ({
                value: npc.name,
                label: npc.name,
              }))}
              selected={actionForm.npcNames}
              onToggle={(value) =>
                setActionForm((prev) => ({
                  ...prev,
                  npcNames: toggleListValue(prev.npcNames, value),
                }))
              }
            />
          </div>
          <p className="text-xs text-zinc-500">
            点击后触发的流程任务：{node.title}（{slug}）
          </p>
          <SaveBar
            saving={saving}
            error={error}
            issues={issues}
            saveLabel={TAB_SAVE_LABELS.action}
            onSave={() =>
              void patchJson(
                `/api/ops/project-flow/nodes/${slug}/action`,
                actionForm,
              )
            }
          />
        </section>
      ) : null}

      {tab === "story" ? (
        <ProjectFlowStoryWorkbench
          key={`${node.stories[0]?.slug || slug}-${node.stories[0]?.inkFile || ""}`}
          slug={slug}
          taskTitle={node.title}
          node={node}
          storyEntries={options.storyEntries}
          eventTitles={eventTitles}
          saveLabel={TAB_SAVE_LABELS.story}
          saving={saving}
          error={error}
          issues={issues}
          onSave={({ mode, form, updateStoryEntryOnBind, cloneFromStorySlug }) => {
            void patchJson(`/api/ops/project-flow/nodes/${slug}/story`, {
              mode,
              storySlug: form.storySlug,
              title: form.title,
              description: form.description,
              inkFile: form.inkFile || undefined,
              status: form.status,
              estimatedMinutes: form.estimatedMinutes
                ? Number(form.estimatedMinutes)
                : undefined,
              tags: form.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
              updateStoryEntryOnBind,
              cloneFromStorySlug,
            });
          }}
        />
      ) : null}

      {tab === "events" ? (
        <section className="space-y-5">
          {eventForms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
              <p className="text-sm text-zinc-500">当前节点未挂载风险事件。</p>
              <button
                type="button"
                onClick={addRiskEvent}
                className={cn(buttonVariants({ size: "sm" }), "mt-4 gap-1")}
              >
                <Plus className="size-4" />
                新增风险事件
              </button>
            </div>
          ) : (
            eventForms.map((event, index) => (
              <div
                key={event.slug}
                className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-100">{event.title}</p>
                    <p className="font-mono text-[10px] text-zinc-600">
                      {event.slug}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={event.enabled}
                      onChange={(eventChange) =>
                        setEventForms((prev) =>
                          prev.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, enabled: eventChange.target.checked }
                              : item,
                          ),
                        )
                      }
                    />
                    启用
                  </label>
                </div>
                <label className="block space-y-2">
                  <Label>事件标题</Label>
                  <Input
                    value={event.title}
                    onChange={(eventChange) =>
                      setEventForms((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, title: eventChange.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <Label>事件说明</Label>
                  <textarea
                    className="min-h-16 w-full rounded-md border border-zinc-700 bg-zinc-950 p-3 text-sm"
                    value={event.description}
                    onChange={(eventChange) =>
                      setEventForms((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, description: eventChange.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="space-y-2">
                    <Label>事件类型</Label>
                    <Input
                      value={event.eventType}
                      onChange={(eventChange) =>
                        setEventForms((prev) =>
                          prev.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, eventType: eventChange.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="space-y-2">
                    <Label>触发权重</Label>
                    <Input
                      type="number"
                      value={event.weight}
                      onChange={(eventChange) =>
                        setEventForms((prev) =>
                          prev.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  weight: Number(eventChange.target.value),
                                }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="space-y-2">
                    <Label>冷却天数</Label>
                    <Input
                      type="number"
                      value={event.cooldownDays}
                      onChange={(eventChange) =>
                        setEventForms((prev) =>
                          prev.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  cooldownDays: Number(
                                    eventChange.target.value,
                                  ),
                                }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
              </div>
            ))
          )}
          {eventForms.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={addRiskEvent}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
              >
                <Plus className="size-4" />
                新增风险事件
              </button>
            </div>
          ) : null}
          {eventForms.length > 0 ? (
            <SaveBar
              saving={saving}
              error={error}
              issues={issues}
              saveLabel={TAB_SAVE_LABELS.events}
              onSave={() =>
                void patchJson(`/api/ops/project-flow/nodes/${slug}/events`, {
                  events: eventForms,
                })
              }
            />
          ) : null}
        </section>
      ) : null}

      <ProjectFlowNodeLifecyclePanel
        slug={slug}
        title={node.title}
        enabled={node.enabled !== false}
        variant="danger"
      />
    </div>
  );
}
