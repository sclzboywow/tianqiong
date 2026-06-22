"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROJECT_STAGES } from "@/game/projectStages";
import type {
  ProjectFlowData,
  ProjectFlowTask,
} from "@/game/projectFlowLoader";
import { cn } from "@/lib/utils";

type EditorTab = "basic" | "task" | "action" | "story" | "events";

const TABS: { id: EditorTab; label: string }[] = [
  { id: "basic", label: "节点总览" },
  { id: "task", label: "任务与成果" },
  { id: "action", label: "办理入口" },
  { id: "story", label: "剧情包装" },
  { id: "events", label: "风险事件" },
];

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
}: {
  saving: boolean;
  error: string | null;
  issues: string[];
  onSave: () => void;
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
        保存当前页
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

  const primaryAction = node.actionSlugs[0];
  const primaryStory = node.stories[0];
  const primaryLocationSlug = node.locationNames[0]?.slug || "";

  const [taskForm, setTaskForm] = useState({
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
    inkFile: primaryStory?.inkFile || "",
    storySlug: primaryStory?.slug || node.storySlug || "",
  });

  const [actionForm, setActionForm] = useState({
    actionSlug: primaryAction?.slug || "",
    label: primaryAction?.label || "",
    description: primaryAction?.description || "",
    locationSlug: primaryLocationSlug,
    npcNames: [...node.npcNames],
  });

  const [storyForm, setStoryForm] = useState({
    storySlug: primaryStory?.slug || `story_${slug}`,
    title: primaryStory?.title || node.title,
    description: primaryStory?.description || node.description || "",
    inkFile: primaryStory?.inkFile || "",
  });

  const [eventForms, setEventForms] = useState(
    node.events.map((event) => ({
      slug: event.slug,
      enabled: event.enabled !== false,
      title: event.title,
      description: event.description || "",
      eventType: event.eventType || event.businessType,
      riskTags: [...(event.riskTags || [])],
      weight: event.weight ?? 10,
      onceOnly: event.onceOnly ?? false,
      cooldownDays: event.cooldownDays ?? 0,
    })),
  );

  const artifactStatusMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const artifact of options.artifacts) {
      map.set(
        artifact.slug,
        artifact.allowedStatuses.length
          ? artifact.allowedStatuses
          : [artifact.defaultStatus],
      );
    }
    return map;
  }, [options.artifacts]);

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
    setNode(data.node);
    router.refresh();
  }

  async function patchJson(path: string, body: unknown) {
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
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败");
    } finally {
      setSaving(false);
    }
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
          const statuses = artifactStatusMap.get(artifact.slug) || [
            artifact.defaultStatus,
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
                <span className="text-sm text-zinc-200">{artifact.name}</span>
              </label>
              {checked ? (
                <select
                  className="mt-3 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-xs"
                  value={
                    mode === "input"
                      ? current?.minStatus || artifact.defaultStatus
                      : current?.status || artifact.defaultStatus
                  }
                  onChange={(event) => {
                    onChange(
                      selected.map((item) =>
                        item.artifactSlug === artifact.slug
                          ? mode === "input"
                            ? { ...item, minStatus: event.target.value }
                            : { ...item, status: event.target.value }
                          : item,
                      ),
                    );
                  }}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
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
          </div>
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
                      primaryLocationSlug,
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
                  {location.name}
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
        <section className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          {node.stories.length > 1 ? (
            <label className="block space-y-2">
              <Label>选择剧情片段</Label>
              <select
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm"
                value={storyForm.storySlug}
                onChange={(event) => {
                  const picked = node.stories.find(
                    (item) => item.slug === event.target.value,
                  );
                  if (!picked) return;
                  setStoryForm({
                    storySlug: picked.slug,
                    title: picked.title,
                    description: picked.description || "",
                    inkFile: picked.inkFile,
                  });
                }}
              >
                {node.stories.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block space-y-2">
            <Label>剧情标题</Label>
            <Input
              value={storyForm.title}
              onChange={(event) =>
                setStoryForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </label>
          <label className="block space-y-2">
            <Label>剧情说明</Label>
            <textarea
              className="min-h-20 w-full rounded-md border border-zinc-700 bg-zinc-950 p-3 text-sm"
              value={storyForm.description}
              onChange={(event) =>
                setStoryForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </label>
          <details className="rounded-lg border border-zinc-800 p-4">
            <summary className="cursor-pointer text-sm text-zinc-400">
              高级字段
            </summary>
            <div className="mt-4 space-y-4">
              <label className="block space-y-2">
                <Label>剧情标识（storySlug）</Label>
                <Input
                  value={storyForm.storySlug}
                  onChange={(event) =>
                    setStoryForm((prev) => ({
                      ...prev,
                      storySlug: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block space-y-2">
                <Label>Ink 文件名（inkFile）</Label>
                <Input
                  value={storyForm.inkFile}
                  onChange={(event) =>
                    setStoryForm((prev) => ({
                      ...prev,
                      inkFile: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </details>
          <SaveBar
            saving={saving}
            error={error}
            issues={issues}
            onSave={() =>
              void patchJson(
                `/api/ops/project-flow/nodes/${slug}/story`,
                storyForm,
              )
            }
          />
        </section>
      ) : null}

      {tab === "events" ? (
        <section className="space-y-5">
          {eventForms.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
              当前节点未挂载事件。
            </p>
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
          {eventForms.length ? (
            <SaveBar
              saving={saving}
              error={error}
              issues={issues}
              onSave={() =>
                void patchJson(`/api/ops/project-flow/nodes/${slug}/events`, {
                  events: eventForms,
                })
              }
            />
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
