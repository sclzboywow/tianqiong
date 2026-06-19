import type { EventTemplateData, EventTaskEffect } from "./types";
import type { ProjectStageId } from "./projectStages";
import type { MetricEffectRow } from "./taskTemplateEffectMapper";
import type { MetricEffects } from "./types";

function metricEffectsFromRows(rows: MetricEffectRow[]): MetricEffects {
  const effects: MetricEffects = {};
  for (const row of rows) {
    if (row.metric?.trim() && row.value !== undefined && row.value !== null) {
      effects[row.metric as keyof MetricEffects] = row.value;
    }
  }
  return effects;
}

function mapArtifactEffects(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { artifactSlug?: string; status?: string; versionBump?: boolean };
      if (!row.artifactSlug?.trim() || !row.status?.trim()) return null;
      return {
        artifactSlug: row.artifactSlug.trim(),
        status: row.status.trim(),
        versionBump: row.versionBump ?? undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => !!item);
}

function mapTaskEffects(raw: unknown): EventTaskEffect[] {
  if (!Array.isArray(raw)) return [];
  const results: EventTaskEffect[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { action?: string; taskSlug?: string };
    if (row.action !== "spawn" || !row.taskSlug?.trim()) continue;
    results.push({ action: "spawn", taskSlug: row.taskSlug.trim() });
  }
  return results;
}

function mapPayloadDoc(doc: Record<string, unknown>): EventTemplateData {
  return {
    slug: String(doc.slug || ""),
    title: String(doc.title || ""),
    description: doc.description ? String(doc.description) : undefined,
    rarity: String(doc.rarity || ""),
    area: doc.area ? String(doc.area) : undefined,
    eventType: doc.eventType ? String(doc.eventType) : undefined,
    inkFile: String(doc.inkFile || ""),
    storySlug: doc.storySlug ? String(doc.storySlug) : undefined,
    npcList:
      (doc.npcList as { npc: string }[] | null)?.map((item) => item.npc).filter(Boolean) || [],
    recommendedJobs:
      (doc.recommendedJobs as { job: string }[] | null)?.map((item) => item.job).filter(Boolean) ||
      [],
    baseSuccessRate: doc.baseSuccessRate as number | undefined,
    triggerBroadcast: doc.triggerBroadcast as boolean | undefined,
    triggerStage: doc.triggerStage ? (doc.triggerStage as ProjectStageId) : undefined,
    triggerLocationSlugs:
      (doc.triggerLocationSlugs as { slug: string }[] | null)
        ?.map((item) => item.slug)
        .filter(Boolean) || [],
    triggerAreaNames:
      (doc.triggerAreaNames as { name: string }[] | null)
        ?.map((item) => item.name)
        .filter(Boolean) || [],
    triggerNpcNames:
      (doc.triggerNpcNames as { name: string }[] | null)
        ?.map((item) => item.name)
        .filter(Boolean) || [],
    riskTags:
      (doc.riskTags as { tag: string }[] | null)?.map((item) => item.tag).filter(Boolean) || [],
    unlockMilestones:
      (doc.unlockMilestones as { milestone: string }[] | null)
        ?.map((item) => item.milestone)
        .filter(Boolean) || [],
    minDay: doc.minDay as number | undefined,
    maxDay: doc.maxDay as number | undefined,
    weight: doc.weight as number | undefined,
    onceOnly: doc.onceOnly as boolean | undefined,
    cooldownDays: doc.cooldownDays as number | undefined,
    triggerTaskSlugs:
      (doc.triggerTaskSlugs as { slug: string }[] | null)
        ?.map((item) => item.slug)
        .filter(Boolean) || [],
    resultText: doc.resultText ? String(doc.resultText) : undefined,
    noTaskText: doc.noTaskText ? String(doc.noTaskText) : undefined,
    artifactEffects: mapArtifactEffects(doc.artifactEffects),
    taskEffects: mapTaskEffects(doc.taskEffects),
    metricEffects: metricEffectsFromRows((doc.metricEffectsList as MetricEffectRow[] | null) || []),
    enabled: doc.enabled !== false,
    payloadDocId: doc.id as string | number,
  };
}

/** 事件模板仅以 Payload 为数据源，不再回退 SQLite。 */
export async function getEventTemplates(): Promise<EventTemplateData[]> {
  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "event-templates",
      where: { enabled: { equals: true } },
      limit: 500,
    });

    return result.docs
      .map((doc) => mapPayloadDoc(doc as Record<string, unknown>))
      .filter((event) => event.slug.trim().length > 0);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[eventTemplateLoader] Payload 加载失败，事件模板不可用:", error);
    }
    return [];
  }
}
