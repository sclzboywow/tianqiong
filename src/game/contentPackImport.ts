import { revalidatePath } from "next/cache";
import { z } from "zod";
import { loadContentStudioData } from "./contentStudioLoader";
import {
  buildPrerequisiteTaskMap,
  findPrerequisiteCyclePath,
  formatPrerequisiteCycleIssue,
} from "./projectFlowNodeUtils";
import { getOpsPayloadContext } from "./projectFlowNodeMutations";
import { clearStoryEntryCache } from "./storyEntryLoader";
import { bustContentOrchestrationCache } from "@/lib/contentOrchestrationCache";
import { bustOpsDataCache } from "@/lib/opsDataCache";
import type { Payload, PayloadRequest } from "payload";

export type ContentPackCollectionSummary = { created: number; updated: number };

export type ContentPackReport = {
  ok: boolean;
  packId: string;
  name: string;
  version: string;
  counts: Record<ContentPackCollectionKey, number>;
  summary: Record<ContentPackCollectionKey, ContentPackCollectionSummary>;
  errors: string[];
  warnings: string[];
};

export type ContentPackCollectionKey =
  | "artifactDefinitions"
  | "areas"
  | "mapLocations"
  | "npcs"
  | "storyEntries"
  | "taskTemplates"
  | "eventTemplates"
  | "locationActions";

const COLLECTION_KEYS: ContentPackCollectionKey[] = [
  "artifactDefinitions",
  "areas",
  "mapLocations",
  "npcs",
  "storyEntries",
  "taskTemplates",
  "eventTemplates",
  "locationActions",
];

const PAYLOAD_COLLECTION: Record<ContentPackCollectionKey, string> = {
  artifactDefinitions: "artifact-definitions",
  areas: "areas",
  mapLocations: "map-locations",
  npcs: "npcs",
  storyEntries: "story-entries",
  taskTemplates: "task-templates",
  eventTemplates: "event-templates",
  locationActions: "location-actions",
};

const looseRecord = z.record(z.string(), z.unknown());

const ContentPackSchema = z.object({
  packId: z.string().trim().min(1, "packId 不能为空"),
  name: z.string().trim().min(1, "name 不能为空"),
  version: z.string().trim().min(1, "version 不能为空"),
  artifactDefinitions: z.array(looseRecord).default([]),
  areas: z.array(looseRecord).default([]),
  mapLocations: z.array(looseRecord).default([]),
  npcs: z.array(looseRecord).default([]),
  storyEntries: z.array(looseRecord).default([]),
  taskTemplates: z.array(looseRecord).default([]),
  eventTemplates: z.array(looseRecord).default([]),
  locationActions: z.array(looseRecord).default([]),
});

export type ParsedContentPack = z.infer<typeof ContentPackSchema>;

function emptySummary(): Record<ContentPackCollectionKey, ContentPackCollectionSummary> {
  return Object.fromEntries(
    COLLECTION_KEYS.map((key) => [key, { created: 0, updated: 0 }]),
  ) as Record<ContentPackCollectionKey, ContentPackCollectionSummary>;
}

function emptyCounts(): Record<ContentPackCollectionKey, number> {
  return Object.fromEntries(COLLECTION_KEYS.map((key) => [key, 0])) as Record<
    ContentPackCollectionKey,
    number
  >;
}

function baseReport(
  pack: ParsedContentPack,
  errors: string[],
  warnings: string[] = [],
): ContentPackReport {
  const counts = emptyCounts();
  for (const key of COLLECTION_KEYS) {
    counts[key] = pack[key].length;
  }
  return {
    ok: errors.length === 0,
    packId: pack.packId,
    name: pack.name,
    version: pack.version,
    counts,
    summary: emptySummary(),
    errors,
    warnings,
  };
}

function readSlug(item: Record<string, unknown>): string {
  const slug = item.slug ?? item.id;
  return typeof slug === "string" ? slug.trim() : "";
}

function toSlugArray(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    if (typeof item === "string") {
      const value = item.trim();
      return value ? [value] : [];
    }
    if (item && typeof item === "object") {
      const slug = (item as { slug?: string }).slug?.trim();
      return slug ? [slug] : [];
    }
    return [];
  });
}

function toNameArray(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    if (typeof item === "string") {
      const value = item.trim();
      return value ? [value] : [];
    }
    if (item && typeof item === "object") {
      const name = (item as { name?: string }).name?.trim();
      return name ? [name] : [];
    }
    return [];
  });
}

function toNpcList(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    if (typeof item === "string") {
      const value = item.trim();
      return value ? [value] : [];
    }
    if (item && typeof item === "object") {
      const npc = (item as { npc?: string }).npc?.trim();
      return npc ? [npc] : [];
    }
    return [];
  });
}

function toTagArray(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    if (typeof item === "string") {
      const value = item.trim();
      return value ? [value] : [];
    }
    if (item && typeof item === "object") {
      const tag = (item as { tag?: string }).tag?.trim();
      return tag ? [tag] : [];
    }
    return [];
  });
}

function toInputArtifacts(items: unknown) {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as {
      artifactSlug?: string;
      minStatus?: string;
      quantity?: number;
    };
    if (!row.artifactSlug?.trim()) return [];
    return [
      {
        artifactSlug: row.artifactSlug.trim(),
        minStatus: row.minStatus?.trim() || "draft",
        quantity: row.quantity ?? 1,
      },
    ];
  });
}

function toOutputArtifacts(items: unknown) {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as {
      artifactSlug?: string;
      status?: string;
      versionBump?: boolean;
    };
    if (!row.artifactSlug?.trim()) return [];
    return [
      {
        artifactSlug: row.artifactSlug.trim(),
        status: row.status?.trim() || "draft",
        versionBump: row.versionBump ?? false,
      },
    ];
  });
}

function toTaskEffects(items: unknown) {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { action?: string; taskSlug?: string };
    if (!row.taskSlug?.trim()) return [];
    return [
      {
        action: row.action?.trim() || "spawn",
        taskSlug: row.taskSlug.trim(),
      },
    ];
  });
}

function toMilestoneEffectList(
  milestoneEffects: unknown,
  list: unknown,
): { milestone: string; value: boolean }[] {
  const fromList = Array.isArray(list)
    ? list.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as { milestone?: string; value?: boolean };
        if (!row.milestone?.trim()) return [];
        return [{ milestone: row.milestone.trim(), value: row.value ?? true }];
      })
    : [];
  if (fromList.length > 0) return fromList;
  if (!milestoneEffects || typeof milestoneEffects !== "object") return [];
  return Object.entries(milestoneEffects as Record<string, boolean>)
    .filter(([key, value]) => key.trim() && value)
    .map(([milestone, value]) => ({ milestone, value: Boolean(value) }));
}

function toMetricEffectsList(effects: unknown, list: unknown) {
  const fromList = Array.isArray(list)
    ? list.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as { metric?: string; value?: number; note?: string };
        if (!row.metric?.trim() || row.value == null) return [];
        return [
          {
            metric: row.metric.trim(),
            value: row.value,
            note: row.note?.trim() || undefined,
          },
        ];
      })
    : [];
  if (fromList.length > 0) return fromList;
  if (!effects || typeof effects !== "object") return [];
  return Object.entries(effects as Record<string, number>)
    .filter(([, value]) => typeof value === "number")
    .map(([metric, value]) => ({ metric, value, note: undefined }));
}

function checkDuplicateKeys(
  items: Record<string, unknown>[],
  label: string,
  readKey: (item: Record<string, unknown>) => string,
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const key = readKey(item);
    if (!key) {
      errors.push(`${label} 存在缺少标识的记录`);
      continue;
    }
    if (seen.has(key)) errors.push(`${label} 标识重复：${key}`);
    seen.add(key);
  }
  return errors;
}

function mergeTaskSlugs(
  existing: { slug: string; prerequisiteTaskSlugs?: string[] }[],
  packTasks: Record<string, unknown>[],
): { slug: string; prerequisiteTaskSlugs?: string[] }[] {
  const packMap = new Map(
    packTasks.map((task) => [
      readSlug(task),
      toSlugArray(task.prerequisiteTaskSlugs),
    ]),
  );
  const merged = existing.map((task) =>
    packMap.has(task.slug)
      ? { slug: task.slug, prerequisiteTaskSlugs: packMap.get(task.slug) }
      : task,
  );
  for (const task of packTasks) {
    const slug = readSlug(task);
    if (!slug || merged.some((item) => item.slug === slug)) continue;
    merged.push({ slug, prerequisiteTaskSlugs: toSlugArray(task.prerequisiteTaskSlugs) });
  }
  return merged;
}

function detectPrerequisiteCycles(
  tasks: { slug: string; prerequisiteTaskSlugs?: string[] }[],
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const task of tasks) {
    const map = buildPrerequisiteTaskMap(tasks, task.slug, task.prerequisiteTaskSlugs || []);
    const cycle = findPrerequisiteCyclePath(task.slug, map);
    if (!cycle) continue;
    const key = cycle.join("->");
    if (seen.has(key)) continue;
    seen.add(key);
    errors.push(formatPrerequisiteCycleIssue(cycle));
  }
  return errors;
}

export function parseContentPack(raw: unknown):
  | { ok: true; pack: ParsedContentPack }
  | { ok: false; errors: string[] } {
  const parsed = ContentPackSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }
  return { ok: true, pack: parsed.data };
}

export async function validateContentPack(raw: unknown): Promise<ContentPackReport> {
  const parsed = parseContentPack(raw);
  if (!parsed.ok) {
    return {
      ok: false,
      packId: "",
      name: "",
      version: "",
      counts: emptyCounts(),
      summary: emptySummary(),
      errors: parsed.errors,
      warnings: [],
    };
  }

  const pack = parsed.pack;
  const errors: string[] = [];
  const warnings: string[] = [];

  errors.push(
    ...checkDuplicateKeys(pack.artifactDefinitions, "成果物", readSlug),
    ...checkDuplicateKeys(pack.areas, "沙盘区域", readSlug),
    ...checkDuplicateKeys(pack.mapLocations, "地图地点", readSlug),
    ...checkDuplicateKeys(
      pack.npcs,
      "NPC",
      (item) => readSlug(item) || String(item.name || "").trim(),
    ),
    ...checkDuplicateKeys(pack.storyEntries, "剧情入口", readSlug),
    ...checkDuplicateKeys(pack.taskTemplates, "任务模板", readSlug),
    ...checkDuplicateKeys(pack.eventTemplates, "事件模板", readSlug),
    ...checkDuplicateKeys(pack.locationActions, "地点行动", readSlug),
  );

  const studio = await loadContentStudioData();

  const artifactSlugs = new Set([
    ...studio.artifactDefinitions.map((item) => item.slug),
    ...pack.artifactDefinitions.map((item) => readSlug(item)).filter(Boolean),
  ]);
  const areaNames = new Set([
    ...studio.areas.map((item) => item.name),
    ...pack.areas.map((item) => String(item.name || "").trim()).filter(Boolean),
  ]);
  const locationSlugs = new Set([
    ...studio.mapLocations.map((item) => item.id),
    ...pack.mapLocations.map((item) => readSlug(item)).filter(Boolean),
  ]);
  const npcNames = new Set([
    ...studio.npcs.map((item) => item.name),
    ...pack.npcs.map((item) => String(item.name || "").trim()).filter(Boolean),
  ]);
  const storySlugs = new Set([
    ...studio.storyEntries.map((item) => item.slug),
    ...pack.storyEntries.map((item) => readSlug(item)).filter(Boolean),
  ]);
  const taskSlugs = new Set([
    ...studio.taskTemplates.map((item) => item.slug),
    ...pack.taskTemplates.map((item) => readSlug(item)).filter(Boolean),
  ]);

  for (const item of pack.artifactDefinitions) {
    if (!readSlug(item)) errors.push("成果物缺少 slug");
    if (!String(item.name || "").trim()) errors.push(`成果物 ${readSlug(item) || "?"} 缺少 name`);
  }

  for (const item of pack.areas) {
    if (!readSlug(item)) errors.push("沙盘区域缺少 slug");
    if (!String(item.name || "").trim()) errors.push(`沙盘区域 ${readSlug(item) || "?"} 缺少 name`);
  }

  for (const item of pack.mapLocations) {
    const slug = readSlug(item);
    if (!slug) errors.push("地图地点缺少 slug");
    if (!String(item.name || "").trim()) errors.push(`地图地点 ${slug || "?"} 缺少 name`);
    for (const areaName of toNameArray(item.relatedAreaNames)) {
      if (!areaNames.has(areaName)) {
        errors.push(`地图地点 ${slug} 关联区域不存在：${areaName}`);
      }
    }
  }

  for (const item of pack.npcs) {
    if (!String(item.name || "").trim()) errors.push("NPC 缺少 name");
    if (!String(item.type || "").trim()) errors.push(`NPC ${String(item.name || "?")} 缺少 type`);
  }

  for (const item of pack.storyEntries) {
    const slug = readSlug(item);
    if (!slug) errors.push("剧情入口缺少 slug");
    if (!String(item.title || "").trim()) errors.push(`剧情 ${slug || "?"} 缺少 title`);
    if (!String(item.inkFile || "").trim()) errors.push(`剧情 ${slug || "?"} 缺少 inkFile`);
    for (const locSlug of toSlugArray(item.relatedLocationSlugs)) {
      if (!locationSlugs.has(locSlug)) {
        errors.push(`剧情 ${slug} 关联地点不存在：${locSlug}`);
      }
    }
    for (const taskSlug of toSlugArray(item.relatedTaskSlugs)) {
      if (!taskSlugs.has(taskSlug)) {
        errors.push(`剧情 ${slug} 关联任务不存在：${taskSlug}`);
      }
    }
  }

  for (const item of pack.taskTemplates) {
    const slug = readSlug(item);
    if (!slug) errors.push("任务模板缺少 slug");
    if (!String(item.title || "").trim()) errors.push(`任务 ${slug || "?"} 缺少 title`);
    if (!String(item.area || "").trim()) errors.push(`任务 ${slug || "?"} 缺少 area`);
    if (!String(item.inkFile || "").trim()) errors.push(`任务 ${slug || "?"} 缺少 inkFile`);

    for (const npc of toNpcList(item.npcList)) {
      if (!npcNames.has(npc)) errors.push(`任务 ${slug} 协同对象不存在：${npc}`);
    }
    for (const prereq of toSlugArray(item.prerequisiteTaskSlugs)) {
      if (prereq === slug) errors.push(`任务 ${slug} 不能将自身设为前置任务`);
      else if (!taskSlugs.has(prereq)) errors.push(`任务 ${slug} 前置任务不存在：${prereq}`);
    }
    for (const input of toInputArtifacts(item.inputArtifacts)) {
      if (!artifactSlugs.has(input.artifactSlug)) {
        errors.push(`任务 ${slug} 输入成果物不存在：${input.artifactSlug}`);
      }
    }
    for (const output of toOutputArtifacts(item.outputArtifacts)) {
      if (!artifactSlugs.has(output.artifactSlug)) {
        errors.push(`任务 ${slug} 产出成果物不存在：${output.artifactSlug}`);
      }
    }
    const storySlug = String(item.storySlug || "").trim();
    if (storySlug && !storySlugs.has(storySlug)) {
      errors.push(`任务 ${slug} 剧情入口不存在：${storySlug}`);
    }
  }

  errors.push(
    ...detectPrerequisiteCycles(
      mergeTaskSlugs(
        studio.taskTemplates.map((task) => ({
          slug: task.slug,
          prerequisiteTaskSlugs: task.prerequisiteTaskSlugs,
        })),
        pack.taskTemplates,
      ),
    ),
  );

  for (const item of pack.eventTemplates) {
    const slug = readSlug(item);
    if (!slug) errors.push("事件模板缺少 slug");
    if (!String(item.title || "").trim()) errors.push(`事件 ${slug || "?"} 缺少 title`);
    if (!String(item.inkFile || "").trim()) errors.push(`事件 ${slug || "?"} 缺少 inkFile`);

    for (const taskSlug of toSlugArray(item.triggerTaskSlugs)) {
      if (!taskSlugs.has(taskSlug)) errors.push(`事件 ${slug} 触发任务不存在：${taskSlug}`);
    }
    for (const effect of toTaskEffects(item.taskEffects)) {
      if (!taskSlugs.has(effect.taskSlug)) {
        errors.push(`事件 ${slug} 任务效果指向不存在的任务：${effect.taskSlug}`);
      }
    }
    const storySlug = String(item.storySlug || "").trim();
    if (storySlug && !storySlugs.has(storySlug)) {
      errors.push(`事件 ${slug} 剧情入口不存在：${storySlug}`);
    }
  }

  for (const item of pack.locationActions) {
    const slug = readSlug(item);
    if (!slug) errors.push("地点行动缺少 slug");
    if (!String(item.label || "").trim()) errors.push(`地点行动 ${slug || "?"} 缺少 label`);
    const locationSlug = String(item.locationSlug || item.locationId || "").trim();
    if (!locationSlug) errors.push(`地点行动 ${slug || "?"} 缺少 locationSlug/locationId`);
    else if (!locationSlugs.has(locationSlug)) {
      errors.push(`地点行动 ${slug} 所属地点不存在：${locationSlug}`);
    }
    for (const taskSlug of toSlugArray(item.triggerTaskSlugs)) {
      if (!taskSlugs.has(taskSlug)) {
        errors.push(`地点行动 ${slug} 触发任务不存在：${taskSlug}`);
      }
    }
  }

  if (pack.taskTemplates.length === 0 && pack.storyEntries.length === 0) {
    warnings.push("内容包未包含任务或剧情，导入后流程编排页可能无可见变化");
  }

  return baseReport(pack, errors, warnings);
}

async function upsertBySlug(
  payload: Payload,
  req: PayloadRequest,
  collection: string,
  slug: string,
  data: Record<string, unknown>,
): Promise<"created" | "updated"> {
  const found = await payload.find({
    collection: collection as "task-templates",
    where: { slug: { equals: slug } },
    limit: 1,
    req,
  });
  const doc = found.docs[0];
  if (doc) {
    await payload.update({ collection, id: doc.id, data, req });
    return "updated";
  }
  await payload.create({ collection, data, req });
  return "created";
}

async function upsertNpc(
  payload: Payload,
  req: PayloadRequest,
  data: Record<string, unknown>,
): Promise<"created" | "updated"> {
  const slug = typeof data.slug === "string" ? data.slug.trim() : "";
  const name = typeof data.name === "string" ? data.name.trim() : "";

  let found;
  if (slug) {
    found = await payload.find({
      collection: "npcs",
      where: { slug: { equals: slug } },
      limit: 1,
      req,
    });
  } else if (name) {
    found = await payload.find({
      collection: "npcs",
      where: { name: { equals: name } },
      limit: 1,
      req,
    });
  } else {
    throw new Error("NPC 缺少 slug 或 name");
  }

  const doc = found.docs[0];
  if (doc) {
    await payload.update({ collection: "npcs", id: doc.id, data, req });
    return "updated";
  }
  await payload.create({ collection: "npcs", data, req });
  return "created";
}

function toPayloadArtifact(item: Record<string, unknown>) {
  return {
    slug: readSlug(item),
    name: String(item.name || "").trim(),
    artifactType: item.artifactType || "document",
    stage: item.stage,
    description: item.description,
    reusable: item.reusable ?? false,
    versioned: item.versioned ?? true,
    expires: item.expires ?? 0,
    defaultStatus: item.defaultStatus || "draft",
    allowedStatuses: Array.isArray(item.allowedStatuses)
      ? item.allowedStatuses
      : (item.allowedStatuses as unknown),
    sourceNpcNames: toNameArray(item.sourceNpcNames).map((name) => ({ name })),
    sourceLocationSlugs: toSlugArray(item.sourceLocationSlugs).map((slug) => ({ slug })),
    tags: toTagArray(item.tags).map((tag) => ({ tag })),
    enabled: item.enabled !== false,
  };
}

function toPayloadArea(item: Record<string, unknown>) {
  return {
    slug: readSlug(item),
    name: String(item.name || "").trim(),
    shortName: item.shortName,
    sandtableRegionId: item.sandtableRegionId || "owner_side",
    sandtableZoneId: item.sandtableZoneId || "management",
    description: item.description || "",
    stage: item.stage,
    category: item.category || "management",
    riskTags: toTagArray(item.riskTags).map((tag) => ({ tag })),
    unlockStage: item.unlockStage || "INITIATION",
    unlockMilestones: Array.isArray(item.unlockMilestones)
      ? item.unlockMilestones
      : toSlugArray(item.unlockMilestones).map((milestone) => ({ milestone })),
    relatedLocationSlugs: toSlugArray(item.relatedLocationSlugs).map((slug) => ({ slug })),
    visibleWhenLocked: item.visibleWhenLocked ?? false,
    sortOrder: item.sortOrder ?? 0,
    enabled: item.enabled !== false,
  };
}

function toPayloadMapLocation(item: Record<string, unknown>) {
  return {
    slug: readSlug(item),
    name: String(item.name || "").trim(),
    sandtableRegionId: item.sandtableRegionId || "owner_side",
    sandtableZoneId: item.sandtableZoneId || "management",
    type: item.type || "owner_office",
    group: item.group || "建设主体",
    description: item.description || String(item.name || "").trim(),
    category: item.category || "management",
    unlockStage: item.unlockStage || "INITIATION",
    unlockMilestones: Array.isArray(item.unlockMilestones)
      ? item.unlockMilestones
      : toSlugArray(item.unlockMilestones).map((milestone) => ({ milestone })),
    relatedTaskSlugs: toSlugArray(item.relatedTaskSlugs).map((slug) => ({ slug })),
    relatedAreaNames: toNameArray(item.relatedAreaNames).map((name) => ({ name })),
    relatedNpcNames: toNameArray(item.relatedNpcNames).map((name) => ({ name })),
    riskTags: toTagArray(item.riskTags).map((tag) => ({ tag })),
    achievementHooks: Array.isArray(item.achievementHooks)
      ? item.achievementHooks
      : [],
    sortOrder: item.sortOrder ?? 0,
    enabled: item.enabled !== false,
  };
}

function toPayloadNpc(item: Record<string, unknown>) {
  return {
    slug: readSlug(item) || undefined,
    excelId: item.excelId,
    name: String(item.name || "").trim(),
    title: item.title,
    organization: item.organization,
    residentRegion: item.residentRegion,
    sandtableRegionId: item.sandtableRegionId,
    level: item.level,
    faction: item.faction,
    type: item.type || "consultant",
    description: item.description || item.taskFunction || "",
    taskFunction: item.taskFunction || item.description,
    personality: item.personality,
    agenda: item.agenda,
    category: item.category || "management",
    unlockStage: item.unlockStage || "INITIATION",
    enabled: item.enabled !== false,
  };
}

function toPayloadStoryEntry(item: Record<string, unknown>) {
  return {
    slug: readSlug(item),
    title: String(item.title || "").trim(),
    description: item.description,
    storyType: item.storyType || "task_story",
    status: item.status || "draft",
    inkFile: String(item.inkFile || "").trim(),
    compiledFile: item.compiledFile,
    startKnot: item.startKnot,
    stage: item.stage,
    relatedLocationSlugs: toSlugArray(item.relatedLocationSlugs).map((slug) => ({ slug })),
    relatedTaskSlugs: toSlugArray(item.relatedTaskSlugs).map((slug) => ({ slug })),
    relatedEventSlugs: toSlugArray(item.relatedEventSlugs).map((slug) => ({ slug })),
    relatedNpcNames: toNameArray(item.relatedNpcNames).map((name) => ({ name })),
    tags: toTagArray(item.tags).map((tag) => ({ tag })),
    previewText: item.previewText,
    estimatedMinutes: item.estimatedMinutes,
    sortOrder: item.sortOrder ?? 0,
    enabled: item.enabled !== false,
  };
}

function toPayloadTaskTemplate(item: Record<string, unknown>, pack: ParsedContentPack) {
  const slug = readSlug(item);
  return {
    category: item.category || "mainline",
    slug,
    title: String(item.title || "").trim(),
    description: item.description,
    rarity: item.rarity || "R",
    stage: item.stage,
    sourceType: item.sourceType || "content_pack",
    sourceName: item.sourceName || pack.name,
    area: String(item.area || "").trim(),
    npcList: toNpcList(item.npcList).map((npc) => ({ npc })),
    requiredJobs: Array.isArray(item.requiredJobs)
      ? item.requiredJobs.map((job) =>
          typeof job === "string" ? { job } : (job as { job: string }),
        )
      : [],
    requiredCount: item.requiredCount ?? 1,
    deadlineHours: item.deadlineHours,
    inkFile: String(item.inkFile || "").trim(),
    storySlug: item.storySlug,
    baseSuccessRate: item.baseSuccessRate ?? 60,
    triggerBroadcast: item.triggerBroadcast ?? false,
    resolutionMode: item.resolutionMode,
    minResolveCount: item.minResolveCount,
    successEffects: item.successEffects,
    failEffects: item.failEffects,
    choiceEffects: item.choiceEffects,
    milestoneEffects: item.milestoneEffects,
    milestoneEffectList: toMilestoneEffectList(item.milestoneEffects, item.milestoneEffectList),
    successMetricEffects: toMetricEffectsList(item.successEffects, item.successMetricEffects),
    failMetricEffects: toMetricEffectsList(item.failEffects, item.failMetricEffects),
    inputArtifacts: toInputArtifacts(item.inputArtifacts),
    outputArtifacts: toOutputArtifacts(item.outputArtifacts),
    prerequisiteTaskSlugs: toSlugArray(item.prerequisiteTaskSlugs).map((s) => ({ slug: s })),
    requiredMilestones: Array.isArray(item.requiredMilestones)
      ? item.requiredMilestones
      : toSlugArray(item.requiredMilestones).map((milestone) => ({ milestone })),
    blockPolicy: item.blockPolicy || "hard_block",
    enabled: item.enabled !== false,
  };
}

function toPayloadEventTemplate(item: Record<string, unknown>) {
  return {
    category: item.category || "risk",
    slug: readSlug(item),
    title: String(item.title || "").trim(),
    description: item.description,
    rarity: item.rarity || "R",
    area: item.area,
    npcList: toNpcList(item.npcList).map((npc) => ({ npc })),
    eventType: item.eventType,
    storySlug: item.storySlug,
    inkFile: String(item.inkFile || "").trim(),
    recommendedJobs: Array.isArray(item.recommendedJobs)
      ? item.recommendedJobs.map((job) =>
          typeof job === "string" ? { job } : (job as { job: string }),
        )
      : [],
    baseSuccessRate: item.baseSuccessRate ?? 60,
    triggerBroadcast: item.triggerBroadcast ?? false,
    triggerStage: item.triggerStage,
    triggerLocationSlugs: toSlugArray(item.triggerLocationSlugs).map((slug) => ({ slug })),
    triggerAreaNames: toNameArray(item.triggerAreaNames).map((name) => ({ name })),
    triggerNpcNames: toNameArray(item.triggerNpcNames).map((name) => ({ name })),
    riskTags: toTagArray(item.riskTags).map((tag) => ({ tag })),
    unlockMilestones: Array.isArray(item.unlockMilestones)
      ? item.unlockMilestones
      : toSlugArray(item.unlockMilestones).map((milestone) => ({ milestone })),
    minDay: item.minDay,
    maxDay: item.maxDay,
    weight: item.weight ?? 10,
    onceOnly: item.onceOnly ?? false,
    cooldownDays: item.cooldownDays ?? 0,
    triggerTaskSlugs: toSlugArray(item.triggerTaskSlugs).map((slug) => ({ slug })),
    resultText: item.resultText,
    noTaskText: item.noTaskText,
    artifactEffects: toOutputArtifacts(item.artifactEffects),
    taskEffects: toTaskEffects(item.taskEffects),
    metricEffectsList: toMetricEffectsList(item.metricEffects, item.metricEffectsList),
    enabled: item.enabled !== false,
  };
}

function toPayloadLocationAction(item: Record<string, unknown>) {
  return {
    slug: readSlug(item),
    label: String(item.label || "").trim(),
    description: item.description || "",
    locationSlug: String(item.locationSlug || item.locationId || "").trim(),
    unlockStage: item.unlockStage || "INITIATION",
    unlockMilestones: Array.isArray(item.unlockMilestones)
      ? item.unlockMilestones
      : toSlugArray(item.unlockMilestones).map((milestone) => ({ milestone })),
    triggerTaskSlugs: toSlugArray(item.triggerTaskSlugs).map((slug) => ({ slug })),
    storySlug: item.storySlug,
    relatedNpcNames: toNameArray(item.relatedNpcNames).map((name) => ({ name })),
    riskTags: toTagArray(item.riskTags).map((tag) => ({ tag })),
    staminaCost: item.staminaCost,
    spiritCost: item.spiritCost,
    minLevel: item.minLevel,
    minReputation: item.minReputation,
    resultText: item.resultText,
    noTaskText: item.noTaskText,
    sortOrder: item.sortOrder ?? 0,
    enabled: item.enabled !== false,
  };
}

function refreshContentPackCaches() {
  clearStoryEntryCache();
  bustContentOrchestrationCache();
  bustOpsDataCache();
  revalidatePath("/ops/project-flow");
  revalidatePath("/ops/content-studio");
  revalidatePath("/ops/content-orchestration");
}

export async function importContentPack(
  raw: unknown,
  mode: "upsert" = "upsert",
): Promise<ContentPackReport> {
  if (mode !== "upsert") {
    return {
      ok: false,
      packId: "",
      name: "",
      version: "",
      counts: emptyCounts(),
      summary: emptySummary(),
      errors: [`暂不支持导入模式：${mode}`],
      warnings: [],
    };
  }

  const report = await validateContentPack(raw);
  if (!report.ok) return report;

  const parsed = parseContentPack(raw);
  if (!parsed.ok) return report;
  const pack = parsed.pack;

  const ctx = await getOpsPayloadContext();
  const summary = emptySummary();

  try {
    for (const item of pack.artifactDefinitions) {
      const slug = readSlug(item);
      const action = await upsertBySlug(
        ctx.payload,
        ctx.req,
        PAYLOAD_COLLECTION.artifactDefinitions,
        slug,
        toPayloadArtifact(item),
      );
      summary.artifactDefinitions[action]++;
    }

    for (const item of pack.areas) {
      const slug = readSlug(item);
      const action = await upsertBySlug(
        ctx.payload,
        ctx.req,
        PAYLOAD_COLLECTION.areas,
        slug,
        toPayloadArea(item),
      );
      summary.areas[action]++;
    }

    for (const item of pack.mapLocations) {
      const slug = readSlug(item);
      const action = await upsertBySlug(
        ctx.payload,
        ctx.req,
        PAYLOAD_COLLECTION.mapLocations,
        slug,
        toPayloadMapLocation(item),
      );
      summary.mapLocations[action]++;
    }

    for (const item of pack.npcs) {
      const action = await upsertNpc(ctx.payload, ctx.req, toPayloadNpc(item));
      summary.npcs[action]++;
    }

    for (const item of pack.storyEntries) {
      const slug = readSlug(item);
      const action = await upsertBySlug(
        ctx.payload,
        ctx.req,
        PAYLOAD_COLLECTION.storyEntries,
        slug,
        toPayloadStoryEntry(item),
      );
      summary.storyEntries[action]++;
    }

    for (const item of pack.taskTemplates) {
      const slug = readSlug(item);
      const action = await upsertBySlug(
        ctx.payload,
        ctx.req,
        PAYLOAD_COLLECTION.taskTemplates,
        slug,
        toPayloadTaskTemplate(item, pack),
      );
      summary.taskTemplates[action]++;
    }

    for (const item of pack.eventTemplates) {
      const slug = readSlug(item);
      const action = await upsertBySlug(
        ctx.payload,
        ctx.req,
        PAYLOAD_COLLECTION.eventTemplates,
        slug,
        toPayloadEventTemplate(item),
      );
      summary.eventTemplates[action]++;
    }

    for (const item of pack.locationActions) {
      const slug = readSlug(item);
      const action = await upsertBySlug(
        ctx.payload,
        ctx.req,
        PAYLOAD_COLLECTION.locationActions,
        slug,
        toPayloadLocationAction(item),
      );
      summary.locationActions[action]++;
    }

    if (ctx.transactionStarted) await ctx.commitTransaction(ctx.req);
    refreshContentPackCaches();

    return {
      ...report,
      ok: true,
      summary,
      errors: [],
    };
  } catch (error) {
    if (ctx.transactionStarted) await ctx.killTransaction(ctx.req);
    return {
      ...report,
      ok: false,
      summary,
      errors: [error instanceof Error ? error.message : "导入内容包失败"],
    };
  }
}
