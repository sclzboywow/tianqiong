"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProjectFlowData } from "@/game/projectFlowLoader";
import { cn } from "@/lib/utils";

const STEP_TITLES = [
  "所属项目阶段",
  "流程任务",
  "办理地点",
  "协同对象",
  "前置成果物",
  "产出成果物",
  "关键节点",
  "地点行动",
  "剧情片段",
  "可选事件池",
];

function stableSlug(title: string, stage: string) {
  const ascii = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (ascii) return ascii;
  let hash = 5381;
  for (const char of title) hash = ((hash << 5) + hash) ^ char.codePointAt(0)!;
  return `flow_${stage.toLowerCase()}_${(hash >>> 0).toString(36)}`;
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
            <span className="font-mono text-[10px] text-zinc-600">
              {choice.value}
            </span>
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

function ArtifactChoiceGrid({
  artifacts,
  selected,
  statuses,
  statusLabel,
  onToggle,
  onStatus,
}: {
  artifacts: ProjectFlowData["options"]["artifacts"];
  selected: string[];
  statuses: Record<string, string>;
  statusLabel: string;
  onToggle: (artifact: ProjectFlowData["options"]["artifacts"][number]) => void;
  onStatus: (slug: string, status: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {artifacts.map((artifact) => {
        const checked = selected.includes(artifact.slug);
        const statusOptions = artifact.allowedStatuses.length
          ? artifact.allowedStatuses
          : [artifact.defaultStatus];
        return (
          <div
            key={artifact.slug}
            className={cn(
              "rounded-lg border p-3",
              checked
                ? "border-sky-700 bg-sky-950/20"
                : "border-zinc-800 bg-zinc-950/40",
            )}
          >
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(artifact)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm text-zinc-200">
                  {artifact.name}
                </span>
                <span className="font-mono text-[10px] text-zinc-600">
                  {artifact.slug}
                </span>
              </span>
            </label>
            {checked ? (
              <label className="mt-3 block text-xs text-zinc-500">
                {statusLabel}
                <select
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-xs text-zinc-200"
                  value={statuses[artifact.slug] || artifact.defaultStatus}
                  onChange={(event) =>
                    onStatus(artifact.slug, event.target.value)
                  }
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function createInitialForm() {
  return {
    stage: "INITIATION",
    title: "",
    description: "",
    slug: "",
    locationSlug: "",
    npcNames: [] as string[],
    unresolvedNpcNames: [] as string[],
    inputArtifactSlugs: [] as string[],
    outputArtifactSlugs: [] as string[],
    inputArtifactStatuses: {} as Record<string, string>,
    outputArtifactStatuses: {} as Record<string, string>,
    milestoneKeys: [] as string[],
    actionSlug: "",
    actionLabel: "",
    actionDescription: "",
    storySlug: "",
    storyTitle: "",
    storyDescription: "",
    inkFile: "",
    eventEnabled: false,
    eventTitle: "",
    eventDescription: "",
    eventType: "材料补正",
    eventRiskTags: "",
    eventWeight: 10,
    eventOnceOnly: false,
    eventCooldownDays: 0,
  };
}

export function ProjectFlowNodeWizard({ data }: { data: ProjectFlowData }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    slug: string;
    inkNotice: string;
  } | null>(null);
  const [form, setForm] = useState(createInitialForm);
  const [npcSearch, setNpcSearch] = useState("");
  const effectiveSlug =
    form.slug || stableSlug(form.title || "new_node", form.stage);
  const effectiveStorySlug = form.storySlug || `story_${effectiveSlug}`;
  const effectiveInkFile = form.inkFile || effectiveSlug;
  const stage = data.stages.find((item) => item.id === form.stage);
  const location = data.options.locations.find(
    (item) => item.slug === form.locationSlug,
  );
  const existingTasks = data.stages.flatMap((item) => item.tasks);
  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(form.stage);
    if (step === 2)
      return (
        form.title.trim().length >= 2 && form.description.trim().length >= 2
      );
    if (step === 3) return Boolean(form.locationSlug);
    if (step === 4)
      return form.unresolvedNpcNames.length === 0 || form.npcNames.length > 0;
    if (step === 8)
      return (
        Boolean((form.actionLabel || `办理${form.title}`).trim()) &&
        Boolean((form.actionDescription || form.description).trim())
      );
    if (step === 9)
      return (
        Boolean((form.storyTitle || form.title).trim()) &&
        Boolean(effectiveInkFile)
      );
    if (step === 10 && form.eventEnabled)
      return form.eventTitle.trim().length >= 2;
    return true;
  }, [effectiveInkFile, form, step]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function toggle(
    key:
      | "npcNames"
      | "inputArtifactSlugs"
      | "outputArtifactSlugs"
      | "milestoneKeys",
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  }
  function toggleArtifact(
    key: "inputArtifactSlugs" | "outputArtifactSlugs",
    statusKey: "inputArtifactStatuses" | "outputArtifactStatuses",
    artifact: ProjectFlowData["options"]["artifacts"][number],
  ) {
    setForm((current) => {
      const removing = current[key].includes(artifact.slug);
      const nextStatuses = { ...current[statusKey] };
      if (removing) delete nextStatuses[artifact.slug];
      else nextStatuses[artifact.slug] = artifact.defaultStatus;
      return {
        ...current,
        [key]: removing
          ? current[key].filter((item) => item !== artifact.slug)
          : [...current[key], artifact.slug],
        [statusKey]: nextStatuses,
      };
    });
  }
  function loadExistingTask(slug: string) {
    if (!slug) {
      setForm(createInitialForm());
      return;
    }
    const task = existingTasks.find((item) => item.slug === slug);
    if (!task) return;
    const action = task.actionSlugs[0];
    const story = task.stories[0];
    const event = task.events.find(
      (item) => item.slug === `event_${task.slug}`,
    );
    const validNpcNames = new Set(data.options.npcs.map((npc) => npc.name));
    setForm({
      ...createInitialForm(),
      stage: task.stage || "INITIATION",
      title: task.title,
      description: task.description || "",
      slug: task.slug,
      locationSlug: task.locationNames[0]?.slug || "",
      npcNames: task.npcNames.filter((name) => validNpcNames.has(name)),
      unresolvedNpcNames: task.npcNames.filter(
        (name) => !validNpcNames.has(name),
      ),
      inputArtifactSlugs: task.inputArtifactLabels.map((item) => item.slug),
      outputArtifactSlugs: task.outputArtifactLabels.map((item) => item.slug),
      inputArtifactStatuses: Object.fromEntries(
        task.inputArtifactLabels.map((item) => [
          item.slug,
          item.status ||
            data.options.artifacts.find(
              (artifact) => artifact.slug === item.slug,
            )?.defaultStatus ||
            "draft",
        ]),
      ),
      outputArtifactStatuses: Object.fromEntries(
        task.outputArtifactLabels.map((item) => [
          item.slug,
          item.status ||
            data.options.artifacts.find(
              (artifact) => artifact.slug === item.slug,
            )?.defaultStatus ||
            "draft",
        ]),
      ),
      milestoneKeys: task.milestoneLabels.map((item) => item.key),
      actionSlug: action?.slug || "",
      actionLabel: action?.label || "",
      actionDescription: action?.description || "",
      storySlug: story?.slug || task.storySlug || "",
      storyTitle: story?.title || task.title,
      storyDescription: story?.description || task.description || "",
      inkFile: story?.inkFile || task.inkFile,
      eventEnabled: Boolean(event),
      eventTitle: event?.title || "",
      eventDescription: event?.description || "",
      eventType: event?.businessType || "材料补正",
      eventRiskTags: event?.riskTags?.join("，") || "",
      eventWeight: event?.weight ?? 10,
      eventOnceOnly: event?.onceOnly ?? false,
      eventCooldownDays: event?.cooldownDays ?? 0,
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/ops/project-flow/nodes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: effectiveSlug,
          stage: form.stage,
          title: form.title,
          description: form.description,
          locationSlug: form.locationSlug,
          npcNames: form.npcNames,
          inputArtifactSlugs: form.inputArtifactSlugs,
          outputArtifactSlugs: form.outputArtifactSlugs,
          inputArtifacts: form.inputArtifactSlugs.map((artifactSlug) => ({
            artifactSlug,
            minStatus:
              form.inputArtifactStatuses[artifactSlug] ||
              data.options.artifacts.find(
                (artifact) => artifact.slug === artifactSlug,
              )?.defaultStatus ||
              "draft",
          })),
          outputArtifacts: form.outputArtifactSlugs.map((artifactSlug) => ({
            artifactSlug,
            status:
              form.outputArtifactStatuses[artifactSlug] ||
              data.options.artifacts.find(
                (artifact) => artifact.slug === artifactSlug,
              )?.defaultStatus ||
              "draft",
          })),
          milestoneKeys: form.milestoneKeys,
          action: {
            slug: form.actionSlug || undefined,
            label: form.actionLabel || `办理${form.title}`,
            description: form.actionDescription || form.description,
          },
          story: {
            slug: effectiveStorySlug,
            title: form.storyTitle || form.title,
            description: form.storyDescription || form.description,
            inkFile: effectiveInkFile,
          },
          event: {
            enabled: form.eventEnabled,
            title: form.eventTitle,
            description: form.eventDescription,
            eventType: form.eventType,
            riskTags: form.eventRiskTags
              .split(/[，,]/)
              .map((item) => item.trim())
              .filter(Boolean),
            weight: form.eventWeight,
            onceOnly: form.eventOnceOnly,
            cooldownDays: form.eventCooldownDays,
          },
        }),
      });
      const body = (await response.json()) as {
        error?: string;
        issues?: string[];
        slug?: string;
        inkNotice?: string;
      };
      if (!response.ok)
        throw new Error(
          [body.error, ...(body.issues || [])].filter(Boolean).join("；"),
        );
      setResult({ slug: body.slug!, inkNotice: body.inkNotice! });
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (result)
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-emerald-900 bg-emerald-950/10 p-8 text-center">
        <Check className="mx-auto size-10 text-emerald-400" />
        <h1 className="mt-4 text-xl font-semibold">流程节点已保存</h1>
        <p className="mt-2 text-sm text-zinc-400">
          已创建或更新流程任务、地点行动和剧情片段：
          <span className="font-mono text-zinc-300">{result.slug}</span>
        </p>
        <p className="mt-3 rounded-md bg-zinc-950 p-3 text-sm text-amber-300">
          {result.inkNotice}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Link
            href="/ops/project-flow"
            className={buttonVariants({ size: "sm" })}
          >
            返回项目流程
          </Link>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setStep(1);
            }}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            继续新增
          </button>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex items-start justify-between border-b border-zinc-800 pb-5">
        <div>
          <p className="text-xs text-sky-400">
            流程节点向导 · 第 {step} / 10 步
          </p>
          <h1 className="mt-1 text-2xl font-semibold">
            {STEP_TITLES[step - 1]}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            按业务步骤完成一个可从地图进入的项目流程节点。
          </p>
        </div>
        <Link
          href="/ops/project-flow"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1",
          )}
        >
          <ArrowLeft className="size-4" />
          退出向导
        </Link>
      </header>
      <div className="my-5 grid grid-cols-5 gap-1 sm:grid-cols-10">
        {STEP_TITLES.map((title, index) => (
          <button
            key={title}
            type="button"
            onClick={() => index + 1 <= step && setStep(index + 1)}
            className={cn(
              "h-1.5 rounded-full",
              index + 1 <= step ? "bg-sky-500" : "bg-zinc-800",
            )}
            title={title}
          />
        ))}
      </div>
      <main className="min-h-[420px] rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-7">
        {step === 1 ? (
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.stages
                .filter((item) => item.id !== "OPENING")
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => set("stage", item.id)}
                    className={cn(
                      "rounded-lg border p-4 text-left",
                      form.stage === item.id
                        ? "border-sky-600 bg-sky-950/20"
                        : "border-zinc-800 bg-zinc-950/40",
                    )}
                  >
                    <p className="font-medium">{item.name}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      {item.description}
                    </p>
                  </button>
                ))}
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              “开业结算”是现有阶段推进规则中的终态，仅在总览中展示，不创建可生成任务。
            </p>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="space-y-5">
            <div>
              <Label>配置方式</Label>
              <select
                className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 p-3 text-sm"
                value={
                  existingTasks.some((task) => task.slug === form.slug)
                    ? form.slug
                    : ""
                }
                onChange={(event) => loadExistingTask(event.target.value)}
              >
                <option value="">新建流程节点</option>
                {existingTasks.map((task) => (
                  <option key={task.slug} value={task.slug}>
                    更新：{task.title} · {task.slug}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-zinc-600">
                选择已有节点会带入其阶段、成果物状态、地点行动和剧情配置。
              </p>
            </div>
            <div>
              <Label>流程任务名称</Label>
              <Input
                className="mt-2"
                value={form.title}
                onChange={(event) => set("title", event.target.value)}
                placeholder="例如：取得建设工程规划许可证"
              />
            </div>
            <div>
              <Label>任务说明</Label>
              <textarea
                className="mt-2 min-h-32 w-full rounded-md border border-zinc-700 bg-zinc-950 p-3 text-sm"
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                placeholder="用业务语言说明办理目标和完成标准"
              />
            </div>
            <div>
              <Label>系统标识（自动生成，高级用户可调整）</Label>
              <Input
                className="mt-2 font-mono"
                value={form.slug}
                onChange={(event) =>
                  set(
                    "slug",
                    event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, "_"),
                  )
                }
                placeholder={effectiveSlug}
              />
              <p className="mt-1 text-xs text-zinc-600">
                留空将使用：{effectiveSlug}
              </p>
            </div>
          </div>
        ) : null}
        {step === 3 ? (
          <div>
            <Label>选择办理地点</Label>
            <select
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 p-3 text-sm"
              value={form.locationSlug}
              onChange={(event) => set("locationSlug", event.target.value)}
            >
              <option value="">请选择地图中的办理地点</option>
              {data.options.locations.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name} · {item.slug}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {step === 4 ? (
          <div className="space-y-3">
            {form.unresolvedNpcNames.length ? (
              <div className="rounded-md border border-amber-900/60 bg-amber-950/20 p-3 text-sm text-amber-200">
                原配置引用了不存在的协同对象：
                {form.unresolvedNpcNames.join("、")}
                。请选择下方真实人员或部门后再保存。
              </div>
            ) : null}
            <Input
              value={npcSearch}
              onChange={(event) => setNpcSearch(event.target.value)}
              placeholder="搜索协同对象姓名或职责"
            />
            <div className="max-h-[460px] overflow-y-auto pr-1">
              <ChoiceGrid
                selected={form.npcNames}
                onToggle={(value) => toggle("npcNames", value)}
                choices={data.options.npcs
                  .filter(
                    (npc) =>
                      !npcSearch.trim() ||
                      `${npc.name} ${npc.description}`
                        .toLowerCase()
                        .includes(npcSearch.trim().toLowerCase()),
                  )
                  .map((npc) => ({
                    value: npc.name,
                    label: npc.name,
                    hint: npc.description,
                  }))}
              />
            </div>
          </div>
        ) : null}
        {step === 5 ? (
          <>
            <p className="mb-3 text-sm text-zinc-400">
              这些资料未达到所选状态时，流程任务会被阻塞。
            </p>
            <ArtifactChoiceGrid
              artifacts={data.options.artifacts}
              selected={form.inputArtifactSlugs}
              statuses={form.inputArtifactStatuses}
              statusLabel="最低需要状态"
              onToggle={(artifact) =>
                toggleArtifact(
                  "inputArtifactSlugs",
                  "inputArtifactStatuses",
                  artifact,
                )
              }
              onStatus={(slug, status) =>
                set("inputArtifactStatuses", {
                  ...form.inputArtifactStatuses,
                  [slug]: status,
                })
              }
            />
          </>
        ) : null}
        {step === 6 ? (
          <>
            <p className="mb-3 text-sm text-zinc-400">
              流程任务完成后按所选状态写入这些项目成果物。
            </p>
            <ArtifactChoiceGrid
              artifacts={data.options.artifacts}
              selected={form.outputArtifactSlugs}
              statuses={form.outputArtifactStatuses}
              statusLabel="完成后产出状态"
              onToggle={(artifact) =>
                toggleArtifact(
                  "outputArtifactSlugs",
                  "outputArtifactStatuses",
                  artifact,
                )
              }
              onStatus={(slug, status) =>
                set("outputArtifactStatuses", {
                  ...form.outputArtifactStatuses,
                  [slug]: status,
                })
              }
            />
          </>
        ) : null}
        {step === 7 ? (
          <ChoiceGrid
            selected={form.milestoneKeys}
            onToggle={(value) => toggle("milestoneKeys", value)}
            choices={data.options.milestones.map((item) => ({
              value: item.key,
              label: item.label,
            }))}
          />
        ) : null}
        {step === 8 ? (
          <div className="space-y-5">
            <p className="rounded-md bg-zinc-950 p-3 text-sm text-zinc-400">
              地点：{location?.name || "尚未选择"} · 阶段：{stage?.name}
            </p>
            <div>
              <Label>地点行动名称</Label>
              <Input
                className="mt-2"
                value={form.actionLabel}
                onChange={(event) => set("actionLabel", event.target.value)}
                placeholder={`办理${form.title || "该流程"}`}
              />
            </div>
            <div>
              <Label>行动说明</Label>
              <textarea
                className="mt-2 min-h-28 w-full rounded-md border border-zinc-700 bg-zinc-950 p-3 text-sm"
                value={form.actionDescription}
                onChange={(event) =>
                  set("actionDescription", event.target.value)
                }
                placeholder={form.description || "说明玩家在该地点要执行的行动"}
              />
            </div>
          </div>
        ) : null}
        {step === 9 ? (
          <div className="space-y-5">
            <div>
              <Label>剧情片段名称</Label>
              <Input
                className="mt-2"
                value={form.storyTitle}
                onChange={(event) => set("storyTitle", event.target.value)}
                placeholder={form.title || "与流程任务同名"}
              />
            </div>
            <div>
              <Label>剧情摘要</Label>
              <textarea
                className="mt-2 min-h-24 w-full rounded-md border border-zinc-700 bg-zinc-950 p-3 text-sm"
                value={form.storyDescription}
                onChange={(event) =>
                  set("storyDescription", event.target.value)
                }
                placeholder={form.description}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>剧情标识</Label>
                <Input
                  className="mt-2 font-mono"
                  value={form.storySlug}
                  onChange={(event) =>
                    set(
                      "storySlug",
                      event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "_"),
                    )
                  }
                  placeholder={effectiveStorySlug}
                />
              </div>
              <div>
                <Label>Ink 文件名</Label>
                <Input
                  className="mt-2 font-mono"
                  value={form.inkFile}
                  onChange={(event) =>
                    set(
                      "inkFile",
                      event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "_"),
                    )
                  }
                  placeholder={effectiveInkFile}
                />
              </div>
            </div>
            <p className="text-xs text-amber-300">
              第一版仅建立绑定；保存后请补充对应 Ink 文件并运行编译。
            </p>
          </div>
        ) : null}
        {step === 10 ? (
          <div className="space-y-5">
            <section className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
              <h2 className="font-medium text-zinc-100">保存前确认</h2>
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                <div>
                  <dt className="text-zinc-500">项目阶段</dt>
                  <dd className="mt-0.5 text-zinc-200">{stage?.name}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">流程任务</dt>
                  <dd className="mt-0.5 text-zinc-200">
                    {form.title}{" "}
                    <span className="font-mono text-zinc-600">
                      {effectiveSlug}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">办理地点</dt>
                  <dd className="mt-0.5 text-zinc-200">{location?.name}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">协同对象</dt>
                  <dd className="mt-0.5 text-zinc-200">
                    {form.npcNames.join("、") || "无"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">前置成果物</dt>
                  <dd className="mt-0.5 text-zinc-200">
                    {form.inputArtifactSlugs
                      .map(
                        (slug) =>
                          `${data.options.artifacts.find((item) => item.slug === slug)?.name || slug}（${form.inputArtifactStatuses[slug]}）`,
                      )
                      .join("、") || "无"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">完成后产出</dt>
                  <dd className="mt-0.5 text-zinc-200">
                    {form.outputArtifactSlugs
                      .map(
                        (slug) =>
                          `${data.options.artifacts.find((item) => item.slug === slug)?.name || slug}（${form.outputArtifactStatuses[slug]}）`,
                      )
                      .join("、") || "无"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">关键节点</dt>
                  <dd className="mt-0.5 text-zinc-200">
                    {form.milestoneKeys
                      .map(
                        (key) =>
                          data.options.milestones.find(
                            (item) => item.key === key,
                          )?.label || key,
                      )
                      .join("、") || "无"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">剧情绑定</dt>
                  <dd className="mt-0.5 text-zinc-200">
                    {form.storyTitle || form.title} ·{" "}
                    <span className="font-mono text-zinc-600">
                      {effectiveInkFile}
                    </span>
                  </dd>
                </div>
              </dl>
            </section>
            <label className="flex items-center gap-3 rounded-lg border border-zinc-700 p-4">
              <input
                type="checkbox"
                checked={form.eventEnabled}
                onChange={(event) => set("eventEnabled", event.target.checked)}
              />
              <span>
                <span className="block font-medium">
                  同时配置补正 / 风险事件
                </span>
                <span className="text-xs text-zinc-500">
                  可选；关闭时只保存流程任务、地点行动和剧情片段。
                </span>
              </span>
            </label>
            {form.eventEnabled ? (
              <div className="space-y-4">
                <div>
                  <Label>事件名称</Label>
                  <Input
                    className="mt-2"
                    value={form.eventTitle}
                    onChange={(event) => set("eventTitle", event.target.value)}
                    placeholder={`${form.title}补正事件`}
                  />
                </div>
                <div>
                  <Label>事件说明</Label>
                  <textarea
                    className="mt-2 min-h-24 w-full rounded-md border border-zinc-700 bg-zinc-950 p-3 text-sm"
                    value={form.eventDescription}
                    onChange={(event) =>
                      set("eventDescription", event.target.value)
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>业务类型</Label>
                    <select
                      className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm"
                      value={form.eventType}
                      onChange={(event) => set("eventType", event.target.value)}
                    >
                      {[
                        "材料补正",
                        "审批退回",
                        "规划冲突",
                        "设计修改",
                        "招采风险",
                        "施工风险",
                        "验收整改",
                      ].map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>风险标签（逗号分隔）</Label>
                    <Input
                      className="mt-2"
                      value={form.eventRiskTags}
                      onChange={(event) =>
                        set("eventRiskTags", event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>触发权重</Label>
                    <Input
                      className="mt-2"
                      type="number"
                      min={1}
                      value={form.eventWeight}
                      onChange={(event) =>
                        set("eventWeight", Number(event.target.value))
                      }
                    />
                  </div>
                  <div>
                    <Label>冷却天数</Label>
                    <Input
                      className="mt-2"
                      type="number"
                      min={0}
                      value={form.eventCooldownDays}
                      onChange={(event) =>
                        set("eventCooldownDays", Number(event.target.value))
                      }
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.eventOnceOnly}
                    onChange={(event) =>
                      set("eventOnceOnly", event.target.checked)
                    }
                  />
                  仅触发一次
                </label>
              </div>
            ) : null}
          </div>
        ) : null}
      </main>
      {error ? (
        <div className="mt-4 rounded-md border border-rose-900 bg-rose-950/20 p-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}
      <footer className="mt-5 flex items-center justify-between">
        <button
          type="button"
          disabled={step === 1 || saving}
          onClick={() => setStep((value) => value - 1)}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          上一步
        </button>
        {step < 10 ? (
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep((value) => value + 1)}
            className={cn(buttonVariants({ size: "sm" }), "gap-1")}
          >
            下一步
            <ArrowRight className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={!canContinue || saving}
            onClick={() => void save()}
            className={cn(buttonVariants({ size: "sm" }), "gap-1")}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {saving ? "保存中" : "保存流程节点"}
          </button>
        )}
      </footer>
    </div>
  );
}
