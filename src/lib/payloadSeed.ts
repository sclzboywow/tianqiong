import type { Payload } from "payload";
import { TASK_TEMPLATES } from "@/data/taskTemplates";
import { NPCS, AREAS, ITEMS, DAILY_REPORT_TEMPLATES } from "@/data/content";
import { ACHIEVEMENTS } from "@/data/achievements";
import type { TaskTemplateData } from "@/game/types";
import { inferMinResolveCount, inferResolutionMode } from "@/game/taskEngine";

function buildTaskTemplatePayloadData(template: TaskTemplateData) {
  const resolutionMode = template.resolutionMode ?? inferResolutionMode(template.rarity);
  return {
    slug: template.slug,
    title: template.title,
    description: template.description,
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

export async function seedPayloadCollections(payload: Payload, templates: TaskTemplateData[] = TASK_TEMPLATES) {
  const stats = {
    npcs: 0,
    areas: 0,
    taskTemplates: 0,
    taskTemplatesUpdated: 0,
    eventTemplates: 0,
    items: 0,
    achievements: 0,
    dailyReportTemplates: 0,
  };

  for (const npc of NPCS) {
    const existing = await payload.find({ collection: "npcs", where: { name: { equals: npc.name } } });
    if (!existing.docs.length) {
      await payload.create({
        collection: "npcs",
        data: {
          name: npc.name,
          type: npc.type,
          description: npc.description,
          defaultRelation: npc.defaultRelation,
          quotes: npc.quotes.map((q) => ({ quote: q })),
          relatedMetrics: npc.relatedMetrics.map((m) => ({ metric: m })),
          enabled: true,
        },
      });
      stats.npcs++;
    }
  }

  for (const area of AREAS) {
    const existing = await payload.find({ collection: "areas", where: { name: { equals: area.name } } });
    if (!existing.docs.length) {
      await payload.create({
        collection: "areas",
        data: {
          name: area.name,
          description: area.description,
          stage: area.stage,
          riskTags: area.riskTags.map((t) => ({ tag: t })),
          enabled: true,
        },
      });
      stats.areas++;
    }
  }

  for (const template of templates) {
    const existing = await payload.find({
      collection: "task-templates",
      where: { slug: { equals: template.slug } },
    });
    const data = buildTaskTemplatePayloadData(template);

    if (!existing.docs.length) {
      await payload.create({
        collection: "task-templates",
        data,
      });
      stats.taskTemplates++;
    } else {
      await payload.update({
        collection: "task-templates",
        id: existing.docs[0].id,
        data,
      });
      stats.taskTemplatesUpdated++;
    }
  }

  for (const template of templates) {
    const existing = await payload.find({
      collection: "event-templates",
      where: { inkFile: { equals: template.inkFile } },
    });
    if (!existing.docs.length) {
      await payload.create({
        collection: "event-templates",
        data: {
          title: template.title,
          rarity: template.rarity,
          area: template.area,
          npcList: template.sourceName ? [{ npc: template.sourceName }] : [],
          eventType: template.sourceType,
          inkFile: template.inkFile,
          recommendedJobs: (template.requiredJobs || []).map((j) => ({ job: j })),
          baseSuccessRate: template.baseSuccessRate || 60,
          triggerBroadcast: template.triggerBroadcast || false,
          enabled: true,
        },
      });
      stats.eventTemplates++;
    }
  }

  for (const item of ITEMS) {
    const existing = await payload.find({ collection: "items", where: { slug: { equals: item.slug } } });
    if (!existing.docs.length) {
      await payload.create({ collection: "items", data: { ...item, enabled: true } });
      stats.items++;
    }
  }

  for (const achievement of ACHIEVEMENTS) {
    const existing = await payload.find({
      collection: "achievements",
      where: { slug: { equals: achievement.slug } },
    });
    if (!existing.docs.length) {
      await payload.create({
        collection: "achievements",
        data: {
          slug: achievement.slug,
          name: achievement.name,
          description: achievement.description,
          conditionType: achievement.conditionType,
          conditionValue: achievement.conditionValue,
          rewardConfig: achievement.rewardConfig || {},
          broadcastEnabled: achievement.broadcastEnabled || false,
          enabled: true,
        },
      });
      stats.achievements++;
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

  return stats;
}
