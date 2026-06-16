import { NextResponse } from "next/server";
import { ensureProjectState } from "@/game/projectEngine";
import { spawnTasksFromTemplates } from "@/game/taskEngine";
import { getTaskTemplates } from "@/game/contentLoader";
import { NPCS, AREAS, ITEMS, DAILY_REPORT_TEMPLATES } from "@/data/content";
import { ACHIEVEMENTS } from "@/data/achievements";

export async function POST() {
  try {
    await ensureProjectState();
    const templates = await getTaskTemplates();
    await spawnTasksFromTemplates(templates);

    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });

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
      }
    }

    for (const template of templates) {
      const existing = await payload.find({
        collection: "task-templates",
        where: { slug: { equals: template.slug } },
      });
      if (!existing.docs.length) {
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
      const existing = await payload.find({ collection: "items", where: { slug: { equals: item.slug } } });
      if (!existing.docs.length) {
        await payload.create({ collection: "items", data: { ...item, enabled: true } });
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
      }
    }

    for (const report of DAILY_REPORT_TEMPLATES) {
      const existing = await payload.find({
        collection: "daily-report-templates",
        where: { title: { equals: report.title } },
      });
      if (!existing.docs.length) {
        await payload.create({ collection: "daily-report-templates", data: { ...report, enabled: true } });
      }
    }

    return NextResponse.json({
      ok: true,
      tasks: templates.length,
      stats: {
        npcs: NPCS.length,
        areas: AREAS.length,
        taskTemplates: templates.length,
        items: ITEMS.length,
        achievements: ACHIEVEMENTS.length,
        dailyReportTemplates: DAILY_REPORT_TEMPLATES.length,
      },
      message: "初始化完成。请刷新 /admin 并在左侧 Collections 查看数据。",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Seed failed" },
      { status: 500 },
    );
  }
}
