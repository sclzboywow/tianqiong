import { prisma } from "../src/prisma/client";
import { ensureProjectState } from "../src/game/projectEngine";
import { spawnTasksFromTemplates } from "../src/game/taskEngine";
import { TASK_TEMPLATES } from "../src/data/taskTemplates";
import { NPCS, AREAS, ITEMS, DAILY_REPORT_TEMPLATES } from "../src/data/content";
import { ACHIEVEMENTS } from "../src/data/achievements";

async function seedPayload() {
  try {
    const { getPayload } = await import("payload");
    const config = (await import("../payload.config")).default;
    const payload = await getPayload({ config });

    for (const npc of NPCS) {
      const existing = await payload.find({
        collection: "npcs",
        where: { name: { equals: npc.name } },
      });
      if (existing.docs.length === 0) {
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
      }
    }

    for (const area of AREAS) {
      const existing = await payload.find({
        collection: "areas",
        where: { name: { equals: area.name } },
      });
      if (existing.docs.length === 0) {
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
      }
    }

    for (const template of TASK_TEMPLATES) {
      const existing = await payload.find({
        collection: "task-templates",
        where: { slug: { equals: template.slug } },
      });
      if (existing.docs.length === 0) {
        await payload.create({
          collection: "task-templates",
          data: {
            slug: template.slug,
            title: template.title,
            description: template.description,
            rarity: template.rarity,
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
          },
        });
      }
    }

    for (const item of ITEMS) {
      const existing = await payload.find({
        collection: "items",
        where: { slug: { equals: item.slug } },
      });
      if (existing.docs.length === 0) {
        await payload.create({
          collection: "items",
          data: { ...item, enabled: true },
        });
      }
    }

    for (const achievement of ACHIEVEMENTS) {
      const existing = await payload.find({
        collection: "achievements",
        where: { slug: { equals: achievement.slug } },
      });
      if (existing.docs.length === 0) {
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
      }
    }

    for (const report of DAILY_REPORT_TEMPLATES) {
      const existing = await payload.find({
        collection: "daily-report-templates",
        where: { title: { equals: report.title } },
      });
      if (existing.docs.length === 0) {
        await payload.create({
          collection: "daily-report-templates",
          data: { ...report, enabled: true },
        });
      }
    }

    for (const template of TASK_TEMPLATES) {
      const existing = await payload.find({
        collection: "event-templates",
        where: { inkFile: { equals: template.inkFile } },
      });
      if (existing.docs.length === 0) {
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
      }
    }

    console.log("Payload seed completed");
  } catch (error) {
    console.warn("Payload seed skipped or partial:", error);
  }
}

async function main() {
  await ensureProjectState();
  await spawnTasksFromTemplates(TASK_TEMPLATES);
  await seedPayload();
  console.log("Game seed completed");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
