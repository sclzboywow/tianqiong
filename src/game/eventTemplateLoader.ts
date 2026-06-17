import type { EventTemplateData } from "./types";
import type { ProjectStageId } from "./projectStages";

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
    enabled: doc.enabled !== false,
    payloadDocId: doc.id as string | number,
  };
}

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
  } catch {
    return [];
  }
}
