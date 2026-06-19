import type { Payload } from "payload";
import { TASK_TEMPLATES } from "@/data/taskTemplates";
import { ARTIFACT_DEFINITIONS } from "@/data/artifactDefinitions";
import { AREAS, ITEMS, DAILY_REPORT_TEMPLATES } from "@/data/content";
import { NPC_PROFILES } from "@/data/npcProfiles";
import { buildNpcProfilePayloadData } from "@/lib/npcProfilePayload";
import { ACHIEVEMENTS } from "@/data/achievements";
import { MAP_LOCATIONS } from "@/data/locations";
import { getMapLocationSandtablePlacement } from "@/data/mapLocationSandtable";
import { LOCATION_ACTIONS } from "@/data/locationActions";
import { CONSTRUCTION_PROJECT_EVENTS } from "@/data/constructionProjectEvents";
import type { TaskTemplateData, EventTemplateData, ArtifactDefinitionData } from "@/game/types";
import {
  choiceEffectsToRows,
  metricEffectsToRows,
  milestoneEffectsToRows,
} from "@/game/taskTemplateEffectMapper";
import { inferMinResolveCount, inferResolutionMode } from "@/game/taskEngine";
import {
  inferAchievementCategory,
  inferAreaCategory,
  inferAreaUnlockStage,
  inferItemCategory,
  inferMapLocationCategory,
  inferTaskCategory,
} from "@/payload/contentCategories";

export type CollectionSeedStats = {
  created: number;
  updated: number;
  skipped: number;
};

export type PayloadSeedStats = {
  npcs: CollectionSeedStats;
  areas: CollectionSeedStats;
  storyEntries: CollectionSeedStats;
  artifactDefinitions: CollectionSeedStats;
  taskTemplates: CollectionSeedStats;
  eventTemplates: CollectionSeedStats;
  items: CollectionSeedStats;
  achievements: CollectionSeedStats;
  dailyReportTemplates: CollectionSeedStats;
  mapLocations: CollectionSeedStats;
  locationActions: CollectionSeedStats;
};

export type SeedPayloadOptions = {
  overwrite?: boolean;
};

function emptyCollectionStats(): CollectionSeedStats {
  return { created: 0, updated: 0, skipped: 0 };
}

function emptySeedStats(): PayloadSeedStats {
  return {
    npcs: emptyCollectionStats(),
    areas: emptyCollectionStats(),
    storyEntries: emptyCollectionStats(),
    artifactDefinitions: emptyCollectionStats(),
    taskTemplates: emptyCollectionStats(),
    eventTemplates: emptyCollectionStats(),
    items: emptyCollectionStats(),
    achievements: emptyCollectionStats(),
    dailyReportTemplates: emptyCollectionStats(),
    mapLocations: emptyCollectionStats(),
    locationActions: emptyCollectionStats(),
  };
}

async function applySeedRecord(
  stats: CollectionSeedStats,
  overwrite: boolean,
  exists: boolean,
  onCreate: () => Promise<unknown>,
  onUpdate: () => Promise<unknown>,
) {
  if (!exists) {
    await onCreate();
    stats.created++;
    return;
  }
  if (overwrite) {
    await onUpdate();
    stats.updated++;
    return;
  }
  stats.skipped++;
}

function buildArtifactDefinitionPayloadData(definition: ArtifactDefinitionData) {
  return {
    slug: definition.slug,
    name: definition.name,
    artifactType: definition.artifactType,
    stage: definition.stage,
    description: definition.description,
    reusable: definition.reusable ?? false,
    versioned: definition.versioned ?? true,
    expires: definition.expires ?? 0,
    defaultStatus: definition.defaultStatus || "draft",
    allowedStatuses: (definition.allowedStatuses || []).map((item) => ({
      status: item.status,
      label: item.label,
    })),
    sourceNpcNames: (definition.sourceNpcNames || []).map((name) => ({ name })),
    sourceLocationSlugs: (definition.sourceLocationSlugs || []).map((slug) => ({ slug })),
    tags: (definition.tags || []).map((tag) => ({ tag })),
    enabled: definition.enabled ?? true,
  };
}

function buildTaskTemplatePayloadData(template: TaskTemplateData) {
  const resolutionMode = template.resolutionMode ?? inferResolutionMode(template.rarity);
  return {
    slug: template.slug,
    title: template.title,
    description: template.description,
    category: inferTaskCategory(template),
    rarity: template.rarity,
    stage: template.stage,
    resolutionMode,
    minResolveCount: inferMinResolveCount(
      resolutionMode,
      template.requiredCount,
      template.minResolveCount,
    ),
    milestoneEffects: template.milestoneEffects || {},
    sourceType: template.sourceType,
    sourceName: template.sourceName,
    area: template.area,
    requiredJobs: (template.requiredJobs || []).map((j) => ({ job: j })),
    requiredCount: template.requiredCount || 1,
    deadlineHours: template.deadlineHours,
    successEffects: template.successEffects || {},
    failEffects: template.failEffects || {},
    choiceEffects: template.choiceEffects || {},
    successMetricEffects: metricEffectsToRows(template.successEffects),
    failMetricEffects: metricEffectsToRows(template.failEffects),
    milestoneEffectList: milestoneEffectsToRows(template.milestoneEffects),
    choiceEffectList: choiceEffectsToRows(template.choiceEffects),
    storySlug: template.storySlug || template.inkFile,
    inkFile: template.inkFile,
    baseSuccessRate: template.baseSuccessRate || 60,
    triggerBroadcast: template.triggerBroadcast || false,
    inputArtifacts: (template.inputArtifacts || []).map((item) => ({
      artifactSlug: item.artifactSlug,
      minStatus: item.minStatus,
      quantity: item.quantity ?? 1,
    })),
    outputArtifacts: (template.outputArtifacts || []).map((item) => ({
      artifactSlug: item.artifactSlug,
      status: item.status,
      versionBump: item.versionBump ?? false,
    })),
    prerequisiteTaskSlugs: (template.prerequisiteTaskSlugs || []).map((slug) => ({ slug })),
    requiredMilestones: (template.requiredMilestones || []).map((milestone) => ({ milestone })),
    blockPolicy: template.blockPolicy || "hard_block",
    enabled: true,
  };
}

function inferEventTriggerLocationSlugs(taskSlug: string): string[] {
  const slugs = new Set<string>();
  for (const action of LOCATION_ACTIONS) {
    if ((action.triggerTaskSlugs || []).includes(taskSlug)) {
      slugs.add(action.locationId);
    }
  }
  return [...slugs];
}

const areaNames = new Set(AREAS.map((area) => area.name));

function inferEventTriggerAreaNames(template: Pick<TaskTemplateData, "area" | "slug">): string[] {
  if (template.area && areaNames.has(template.area)) return [template.area];

  const names = new Set<string>();
  for (const location of MAP_LOCATIONS) {
    if ((location.relatedTaskSlugs || []).includes(template.slug)) {
      for (const name of location.relatedAreaNames || []) {
        if (areaNames.has(name)) names.add(name);
      }
    }
  }

  return [...names];
}

function buildEventTemplatePayloadData(template: TaskTemplateData) {
  const eventSlug = `evt_${template.slug}`;
  const triggerAreaNames = inferEventTriggerAreaNames(template);
  return {
    slug: eventSlug,
    title: template.title,
    description: template.description,
    category: inferTaskCategory(template),
    rarity: template.rarity,
    area: template.area,
    npcList: template.sourceName ? [{ npc: template.sourceName }] : [],
    eventType: template.sourceType,
    inkFile: template.inkFile,
    storySlug: template.storySlug || template.inkFile,
    recommendedJobs: (template.requiredJobs || []).map((j) => ({ job: j })),
    baseSuccessRate: template.baseSuccessRate || 60,
    triggerBroadcast: template.triggerBroadcast || false,
    triggerStage: template.stage,
    triggerLocationSlugs: inferEventTriggerLocationSlugs(template.slug).map((slug) => ({ slug })),
    triggerAreaNames: triggerAreaNames.map((name) => ({ name })),
    triggerNpcNames: template.sourceName ? [{ name: template.sourceName }] : [],
    riskTags: [],
    unlockMilestones: [],
    weight: 10,
    onceOnly: false,
    cooldownDays: 0,
    triggerTaskSlugs: [{ slug: template.slug }],
    enabled: true,
  };
}

function buildStoryEntryPayloadData(template: TaskTemplateData, storyType: "task_story" | "event_story") {
  const storySlug = template.storySlug || template.inkFile;
  const eventSlug = `evt_${template.slug}`;
  return {
    slug: storySlug,
    title: template.title,
    description: template.description,
    storyType,
    status: "published",
    inkFile: template.inkFile,
    compiledFile: `${template.inkFile}.json`,
    stage: template.stage,
    relatedTaskSlugs: [{ slug: template.slug }],
    relatedEventSlugs: storyType === "event_story" ? [{ slug: eventSlug }] : [],
    enabled: true,
    sortOrder: 0,
  };
}

function buildManualEventPayloadData(
  event: Partial<EventTemplateData>,
  options: { forceDisabled?: boolean } = {},
) {
  const triggerAreaNames = event.area && areaNames.has(event.area) ? [event.area] : [];
  const enabled = options.forceDisabled ? false : (event.enabled ?? true);
  return {
    slug: event.slug,
    title: event.title,
    description: event.description,
    category: options.forceDisabled ? "legacy" : "mainline",
    rarity: event.rarity || "R",
    area: event.area,
    inkFile: event.inkFile,
    storySlug: event.storySlug,
    triggerStage: event.triggerStage,
    triggerLocationSlugs: (event.triggerLocationSlugs || []).map((slug) => ({ slug })),
    triggerTaskSlugs: (event.triggerTaskSlugs || []).map((slug) => ({ slug })),
    triggerAreaNames: triggerAreaNames.map((name) => ({ name })),
    riskTags: (event.riskTags || []).map((tag) => ({ tag })),
    weight: event.weight ?? 10,
    onceOnly: event.onceOnly ?? false,
    cooldownDays: event.cooldownDays ?? 0,
    enabled,
    artifactEffects: (event.artifactEffects || []).map((item) => ({
      artifactSlug: item.artifactSlug,
      status: item.status,
      versionBump: item.versionBump ?? false,
    })),
    taskEffects: (event.taskEffects || [])
      .filter((item) => item.action === "spawn")
      .map((item) => ({
        action: "spawn" as const,
        taskSlug: item.taskSlug,
      })),
    metricEffectsList: event.metricEffects
      ? metricEffectsToRows(event.metricEffects)
      : [],
  };
}

function buildUnlockPayloadData(content: {
  unlockStage?: string;
  unlockMilestones?: string[];
  relatedLocationSlugs?: string[];
  visibleWhenLocked?: boolean;
}) {
  return {
    unlockStage: content.unlockStage || "INITIATION",
    unlockMilestones: (content.unlockMilestones || []).map((milestone) => ({ milestone })),
    relatedLocationSlugs: (content.relatedLocationSlugs || []).map((slug) => ({ slug })),
    visibleWhenLocked: content.visibleWhenLocked ?? false,
  };
}

export async function seedPayloadCollections(
  payload: Payload,
  templates: TaskTemplateData[] = TASK_TEMPLATES,
  options: SeedPayloadOptions = {},
) {
  const overwrite = options.overwrite ?? false;
  const stats = emptySeedStats();

  for (const profile of NPC_PROFILES) {
    const data = buildNpcProfilePayloadData(profile);
    const existing = await payload.find({
      collection: "npcs",
      where: { slug: { equals: profile.id } },
      limit: 1,
    });
    const doc = existing.docs[0];
    await applySeedRecord(
      stats.npcs,
      overwrite,
      Boolean(doc),
      () => payload.create({ collection: "npcs", data }),
      () => payload.update({ collection: "npcs", id: doc.id, data }),
    );
  }

  for (const area of AREAS) {
    const category = inferAreaCategory(area.name, area.stage, area.category);
    const data = {
      slug: area.slug,
      name: area.name,
      shortName: area.shortName,
      sandtableRegionId: area.sandtableRegionId,
      sandtableZoneId: area.sandtableZoneId,
      category,
      description: area.description,
      stage: area.stage,
      riskTags: area.riskTags.map((t) => ({ tag: t })),
      sortOrder: area.sortOrder,
      ...buildUnlockPayloadData({
        unlockStage: area.unlockStage || inferAreaUnlockStage(area.name, area.stage),
        unlockMilestones: area.unlockMilestones,
        relatedLocationSlugs: area.relatedLocationSlugs,
        visibleWhenLocked: area.visibleWhenLocked,
      }),
      enabled: true,
    };
    const existing = await payload.find({ collection: "areas", where: { slug: { equals: area.slug } } });
    const doc = existing.docs[0];
    await applySeedRecord(
      stats.areas,
      overwrite,
      Boolean(doc),
      () => payload.create({ collection: "areas", data }),
      () => payload.update({ collection: "areas", id: doc.id, data }),
    );
  }

  for (const definition of ARTIFACT_DEFINITIONS) {
    const data = buildArtifactDefinitionPayloadData(definition);
    const existing = await payload.find({
      collection: "artifact-definitions",
      where: { slug: { equals: definition.slug } },
    });
    const doc = existing.docs[0];
    await applySeedRecord(
      stats.artifactDefinitions,
      overwrite,
      Boolean(doc),
      () => payload.create({ collection: "artifact-definitions", data }),
      () => payload.update({ collection: "artifact-definitions", id: doc.id, data }),
    );
  }

  for (const template of templates) {
    const data = buildStoryEntryPayloadData(template, "task_story");
    const existing = await payload.find({
      collection: "story-entries",
      where: { slug: { equals: data.slug } },
    });
    const doc = existing.docs[0];
    await applySeedRecord(
      stats.storyEntries,
      overwrite,
      Boolean(doc),
      () => payload.create({ collection: "story-entries", data }),
      () => payload.update({ collection: "story-entries", id: doc.id, data }),
    );
  }

  for (const template of templates) {
    const data = buildTaskTemplatePayloadData(template);
    const existing = await payload.find({
      collection: "task-templates",
      where: { slug: { equals: template.slug } },
    });
    const doc = existing.docs[0];
    await applySeedRecord(
      stats.taskTemplates,
      overwrite,
      Boolean(doc),
      () => payload.create({ collection: "task-templates", data }),
      () => payload.update({ collection: "task-templates", id: doc.id, data }),
    );
  }

  for (const template of templates) {
    const data = buildEventTemplatePayloadData(template);
    const existing = await payload.find({
      collection: "event-templates",
      where: { slug: { equals: data.slug } },
    });
    const doc = existing.docs[0];
    await applySeedRecord(
      stats.eventTemplates,
      overwrite,
      Boolean(doc),
      () => payload.create({ collection: "event-templates", data }),
      () => payload.update({ collection: "event-templates", id: doc.id, data }),
    );
  }

  for (const event of CONSTRUCTION_PROJECT_EVENTS) {
    if (!event.slug) continue;
    const data = buildManualEventPayloadData(event);
    const existing = await payload.find({
      collection: "event-templates",
      where: { slug: { equals: event.slug } },
    });
    const doc = existing.docs[0];
    await applySeedRecord(
      stats.eventTemplates,
      overwrite,
      Boolean(doc),
      () => payload.create({ collection: "event-templates", data }),
      () => payload.update({ collection: "event-templates", id: doc.id, data }),
    );
  }

  for (const item of ITEMS) {
    const category = inferItemCategory(item.effectType, (item as { category?: string }).category);
    const data = { ...item, category, enabled: true };
    const existing = await payload.find({ collection: "items", where: { slug: { equals: item.slug } } });
    const doc = existing.docs[0];
    await applySeedRecord(
      stats.items,
      overwrite,
      Boolean(doc),
      () => payload.create({ collection: "items", data }),
      () => payload.update({ collection: "items", id: doc.id, data }),
    );
  }

  for (const achievement of ACHIEVEMENTS) {
    const category = inferAchievementCategory(achievement);
    const data = {
      slug: achievement.slug,
      name: achievement.name,
      category,
      description: achievement.description,
      conditionType: achievement.conditionType,
      conditionValue: achievement.conditionValue,
      rewardConfig: achievement.rewardConfig || {},
      broadcastEnabled: achievement.broadcastEnabled || false,
      enabled: true,
    };
    const existing = await payload.find({
      collection: "achievements",
      where: { slug: { equals: achievement.slug } },
    });
    const doc = existing.docs[0];
    await applySeedRecord(
      stats.achievements,
      overwrite,
      Boolean(doc),
      () => payload.create({ collection: "achievements", data }),
      () => payload.update({ collection: "achievements", id: doc.id, data }),
    );
  }

  for (const report of DAILY_REPORT_TEMPLATES) {
    const existing = await payload.find({
      collection: "daily-report-templates",
      where: { title: { equals: report.title } },
    });
    const doc = existing.docs[0];
    await applySeedRecord(
      stats.dailyReportTemplates,
      overwrite,
      Boolean(doc),
      () =>
        payload.create({
          collection: "daily-report-templates",
          data: { ...report, enabled: true },
        }),
      () =>
        payload.update({
          collection: "daily-report-templates",
          id: doc.id,
          data: { ...report, enabled: true },
        }),
    );
  }

  for (const [index, loc] of MAP_LOCATIONS.entries()) {
    const category = inferMapLocationCategory(loc.group);
    const placement = getMapLocationSandtablePlacement(loc.id);
    const data = {
      slug: loc.id,
      name: loc.name,
      sandtableRegionId: placement.regionId,
      sandtableZoneId: placement.zoneId,
      type: loc.type,
      group: loc.group,
      category,
      description: loc.description,
      unlockStage: loc.unlockStage,
      unlockMilestones: (loc.unlockMilestones || []).map((milestone) => ({ milestone })),
      relatedTaskSlugs: (loc.relatedTaskSlugs || []).map((slug) => ({ slug })),
      relatedAreaNames: (loc.relatedAreaNames || []).map((name) => ({ name })),
      relatedNpcNames: (loc.relatedNpcNames || []).map((name) => ({ name })),
      riskTags: (loc.riskTags || []).map((tag) => ({ tag })),
      achievementHooks: (loc.achievementHooks || []).map((hook) => ({ hook })),
      sortOrder: index,
      enabled: true,
    };
    const existing = await payload.find({
      collection: "map-locations",
      where: { slug: { equals: loc.id } },
    });
    const doc = existing.docs[0];
    await applySeedRecord(
      stats.mapLocations,
      overwrite,
      Boolean(doc),
      () => payload.create({ collection: "map-locations", data }),
      () => payload.update({ collection: "map-locations", id: doc.id, data }),
    );
  }

  for (const [index, action] of LOCATION_ACTIONS.entries()) {
    const data = {
      slug: action.id,
      label: action.label,
      description: action.description,
      locationSlug: action.locationId,
      unlockStage: action.unlockStage || "INITIATION",
      unlockMilestones: (action.unlockMilestones || []).map((milestone) => ({ milestone })),
      triggerTaskSlugs: (action.triggerTaskSlugs || []).map((slug) => ({ slug })),
      relatedNpcNames: (action.relatedNpcNames || []).map((name) => ({ name })),
      riskTags: (action.riskTags || []).map((tag) => ({ tag })),
      staminaCost: action.staminaCost,
      spiritCost: action.spiritCost,
      minLevel: action.minLevel,
      minReputation: action.minReputation,
      resultText: action.resultText,
      noTaskText: action.noTaskText,
      sortOrder: index,
      enabled: true,
    };
    const existing = await payload.find({
      collection: "location-actions",
      where: { slug: { equals: action.id } },
    });
    const doc = existing.docs[0];
    await applySeedRecord(
      stats.locationActions,
      overwrite,
      Boolean(doc),
      () => payload.create({ collection: "location-actions", data }),
      () => payload.update({ collection: "location-actions", id: doc.id, data }),
    );
  }

  return stats;
}
