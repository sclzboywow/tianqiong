import { TASK_TEMPLATES } from "@/data/taskTemplates";
import type { TaskTemplateData, ResolutionMode, TaskBlockPolicy, ArtifactRequirement, ArtifactEffect } from "./types";
import type { ProjectStageId } from "./projectStages";
import { inferMinResolveCount, inferResolutionMode } from "./taskEngine";
import { resolveTaskTemplateEffects, type TaskTemplateEffectDoc } from "./taskTemplateEffectMapper";

function mapArtifactRequirements(raw: unknown): ArtifactRequirement[] {
  if (!Array.isArray(raw)) return [];
  const results: ArtifactRequirement[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { artifactSlug?: string; minStatus?: string; quantity?: number };
    if (!row.artifactSlug?.trim()) continue;
    results.push({
      artifactSlug: row.artifactSlug.trim(),
      minStatus: row.minStatus?.trim() || undefined,
      quantity: row.quantity ?? undefined,
    });
  }
  return results;
}

function mapArtifactEffects(raw: unknown): ArtifactEffect[] {
  if (!Array.isArray(raw)) return [];
  const results: ArtifactEffect[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { artifactSlug?: string; status?: string; versionBump?: boolean };
    if (!row.artifactSlug?.trim() || !row.status?.trim()) continue;
    results.push({
      artifactSlug: row.artifactSlug.trim(),
      status: row.status.trim(),
      versionBump: row.versionBump ?? undefined,
    });
  }
  return results;
}

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
    npcList:
      (doc.npcList as { npc: string }[] | null)?.map((item) => item.npc).filter(Boolean) || [],
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
    inputArtifacts: mapArtifactRequirements(doc.inputArtifacts),
    outputArtifacts: mapArtifactEffects(doc.outputArtifacts),
    prerequisiteTaskSlugs:
      (doc.prerequisiteTaskSlugs as { slug: string }[] | null)
        ?.map((item) => item.slug)
        .filter(Boolean) || [],
    requiredMilestones:
      (doc.requiredMilestones as { milestone: string }[] | null)
        ?.map((item) => item.milestone)
        .filter(Boolean) || [],
    blockPolicy: (doc.blockPolicy as TaskBlockPolicy | undefined) ?? "hard_block",
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
