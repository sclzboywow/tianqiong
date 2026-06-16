import type { Payload } from "payload";
import { TASK_TEMPLATES } from "@/data/taskTemplates";
import { NPCS, AREAS, ITEMS, DAILY_REPORT_TEMPLATES } from "@/data/content";
import { ACHIEVEMENTS } from "@/data/achievements";
import { MAP_LOCATIONS } from "@/data/locations";
import type { TaskTemplateData } from "@/game/types";
import { inferMinResolveCount, inferResolutionMode } from "@/game/taskEngine";
import {
  inferAchievementCategory,
  inferAreaCategory,
  inferItemCategory,
  inferMapLocationCategory,
  inferNpcCategory,
  inferTaskCategory,
} from "@/payload/contentCategories";

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
    inkFile: template.inkFile,
    baseSuccessRate: template.baseSuccessRate || 60,
    triggerBroadcast: template.triggerBroadcast || false,
    enabled: true,
  };
}

function buildEventTemplatePayloadData(template: TaskTemplateData) {
  return {
    title: template.title,
    category: inferTaskCategory(template),
    rarity: template.rarity,
    area: template.area,
    npcList: template.sourceName ? [{ npc: template.sourceName }] : [],
    eventType: template.sourceType,
    inkFile: template.inkFile,
    recommendedJobs: (template.requiredJobs || []).map((j) => ({ job: j })),
    baseSuccessRate: template.baseSuccessRate || 60,
    triggerBroadcast: template.triggerBroadcast || false,
    enabled: true,
  };
}

export async function seedPayloadCollections(payload: Payload, templates: TaskTemplateData[] = TASK_TEMPLATES) {
  const stats = {
    npcs: 0,
    npcsUpdated: 0,
    areas: 0,
    areasUpdated: 0,
    taskTemplates: 0,
    taskTemplatesUpdated: 0,
    eventTemplates: 0,
    eventTemplatesUpdated: 0,
    items: 0,
    itemsUpdated: 0,
    achievements: 0,
    achievementsUpdated: 0,
    dailyReportTemplates: 0,
    mapLocations: 0,
    mapLocationsUpdated: 0,
  };

  for (const npc of NPCS) {
    const category = inferNpcCategory(npc.type, (npc as { category?: string }).category);
    const data = {
      name: npc.name,
      category,
      type: npc.type,
      description: npc.description,
      defaultRelation: npc.defaultRelation,
      quotes: npc.quotes.map((q) => ({ quote: q })),
      relatedMetrics: npc.relatedMetrics.map((m) => ({ metric: m })),
      enabled: true,
    };
    const existing = await payload.find({ collection: "npcs", where: { name: { equals: npc.name } } });
    if (!existing.docs.length) {
      await payload.create({ collection: "npcs", data });
      stats.npcs++;
    } else {
      await payload.update({ collection: "npcs", id: existing.docs[0].id, data });
      stats.npcsUpdated++;
    }
  }

  for (const area of AREAS) {
    const category = inferAreaCategory(area.name, area.stage, (area as { category?: string }).category);
    const data = {
      name: area.name,
      category,
      description: area.description,
      stage: area.stage,
      riskTags: area.riskTags.map((t) => ({ tag: t })),
      enabled: true,
    };
    const existing = await payload.find({ collection: "areas", where: { name: { equals: area.name } } });
    if (!existing.docs.length) {
      await payload.create({ collection: "areas", data });
      stats.areas++;
    } else {
      await payload.update({ collection: "areas", id: existing.docs[0].id, data });
      stats.areasUpdated++;
    }
  }

  for (const template of templates) {
    const data = buildTaskTemplatePayloadData(template);
    const existing = await payload.find({
      collection: "task-templates",
      where: { slug: { equals: template.slug } },
    });

    if (!existing.docs.length) {
      await payload.create({ collection: "task-templates", data });
      stats.taskTemplates++;
    } else {
      await payload.update({ collection: "task-templates", id: existing.docs[0].id, data });
      stats.taskTemplatesUpdated++;
    }
  }

  for (const template of templates) {
    const data = buildEventTemplatePayloadData(template);
    const existing = await payload.find({
      collection: "event-templates",
      where: { inkFile: { equals: template.inkFile } },
    });
    if (!existing.docs.length) {
      await payload.create({ collection: "event-templates", data });
      stats.eventTemplates++;
    } else {
      await payload.update({ collection: "event-templates", id: existing.docs[0].id, data });
      stats.eventTemplatesUpdated++;
    }
  }

  for (const item of ITEMS) {
    const category = inferItemCategory(item.effectType, (item as { category?: string }).category);
    const data = { ...item, category, enabled: true };
    const existing = await payload.find({ collection: "items", where: { slug: { equals: item.slug } } });
    if (!existing.docs.length) {
      await payload.create({ collection: "items", data });
      stats.items++;
    } else {
      await payload.update({ collection: "items", id: existing.docs[0].id, data });
      stats.itemsUpdated++;
    }
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
    if (!existing.docs.length) {
      await payload.create({ collection: "achievements", data });
      stats.achievements++;
    } else {
      await payload.update({ collection: "achievements", id: existing.docs[0].id, data });
      stats.achievementsUpdated++;
    }
  }

  for (const report of DAILY_REPORT_TEMPLATES) {
    const existing = await payload.find({
      collection: "daily-report-templates",
      where: { title: { equals: report.title } },
    });
    if (!existing.docs.length) {
      await payload.create({ collection: "daily-report-templates", data: { ...report, enabled: true } });
      stats.dailyReportTemplates++;
    }
  }

  for (const [index, loc] of MAP_LOCATIONS.entries()) {
    const category = inferMapLocationCategory(loc.group);
    const data = {
      slug: loc.id,
      name: loc.name,
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
    if (!existing.docs.length) {
      await payload.create({ collection: "map-locations", data });
      stats.mapLocations++;
    } else {
      await payload.update({ collection: "map-locations", id: existing.docs[0].id, data });
      stats.mapLocationsUpdated++;
    }
  }

  return stats;
}
