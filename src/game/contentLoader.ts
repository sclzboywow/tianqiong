import { TASK_TEMPLATES } from "@/data/taskTemplates";
import type { TaskTemplateData } from "./types";

export async function getTaskTemplates(): Promise<TaskTemplateData[]> {
  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "task-templates",
      where: { enabled: { equals: true } },
      limit: 100,
    });

    if (result.docs.length === 0) return TASK_TEMPLATES;

    return result.docs.map((doc) => ({
      slug: doc.slug as string,
      title: doc.title as string,
      description: doc.description as string | undefined,
      rarity: doc.rarity as string,
      sourceType: doc.sourceType as string,
      sourceName: doc.sourceName as string | undefined,
      area: doc.area as string,
      requiredJobs: (doc.requiredJobs as { job: string }[] | null)?.map((j) => j.job) || [],
      requiredCount: doc.requiredCount as number | undefined,
      deadlineHours: doc.deadlineHours as number | undefined,
      inkFile: doc.inkFile as string,
      baseSuccessRate: doc.baseSuccessRate as number | undefined,
      successEffects: doc.successEffects as TaskTemplateData["successEffects"],
      failEffects: doc.failEffects as TaskTemplateData["failEffects"],
      choiceEffects: doc.choiceEffects as TaskTemplateData["choiceEffects"],
      triggerBroadcast: doc.triggerBroadcast as boolean | undefined,
    }));
  } catch {
    return TASK_TEMPLATES;
  }
}
