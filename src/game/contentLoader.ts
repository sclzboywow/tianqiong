import { TASK_TEMPLATES } from "@/data/taskTemplates";
import type { TaskTemplateData, ResolutionMode } from "./types";
import type { ProjectStageId } from "./projectStages";
import { inferMinResolveCount, inferResolutionMode } from "./taskEngine";
import { resolveTaskTemplateEffects, type TaskTemplateEffectDoc } from "./taskTemplateEffectMapper";

function mapPayloadDoc(doc: Record<string, unknown>): TaskTemplateData {
  const rarity = doc.rarity as string;
  const resolutionMode = (doc.resolutionMode as ResolutionMode | undefined) ?? inferResolutionMode(rarity);
  const requiredCount = doc.requiredCount as number | undefined;

  const effects = resolveTaskTemplateEffects(doc as TaskTemplateEffectDoc);

  return {
    slug: doc.slug as string,
    title: doc.title as string,
    description: doc.description as string | undefined,
    rarity,
    sourceType: doc.sourceType as string,
    sourceName: doc.sourceName as string | undefined,
    area: doc.area as string,
    stage: doc.stage as ProjectStageId | undefined,
    requiredJobs: (doc.requiredJobs as { job: string }[] | null)?.map((j) => j.job) || [],
    requiredCount,
    deadlineHours: doc.deadlineHours as number | undefined,
    inkFile: doc.inkFile as string,
    storySlug: doc.storySlug as string | undefined,
    baseSuccessRate: doc.baseSuccessRate as number | undefined,
    successEffects: effects.successEffects,
    failEffects: effects.failEffects,
    choiceEffects: effects.choiceEffects,
    milestoneEffects: effects.milestoneEffects,
    resolutionMode,
    minResolveCount: inferMinResolveCount(
      resolutionMode,
      requiredCount,
      doc.minResolveCount as number | undefined,
    ),
    triggerBroadcast: doc.triggerBroadcast as boolean | undefined,
    category: doc.category as string | undefined,
  };
}

export async function getTaskTemplates(): Promise<TaskTemplateData[]> {
  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "task-templates",
      where: { enabled: { equals: true } },
      limit: 200,
    });

    if (result.docs.length === 0) return TASK_TEMPLATES;

    return result.docs.map((doc) => mapPayloadDoc(doc as Record<string, unknown>));
  } catch {
    return TASK_TEMPLATES;
  }
}
