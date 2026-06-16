import type { ProjectState } from "@prisma/client";
import type { AreaData, NpcData } from "@/data/content";
import { parseMilestones } from "./projectEngine";
import {
  PROJECT_STAGES,
  MILESTONE_LABELS,
  getStageConfig,
  normalizeStageId,
  type ProjectStageId,
} from "./projectStages";

export type UnlockableContent = {
  name: string;
  unlockStage?: ProjectStageId;
  unlockMilestones?: string[];
  relatedLocationSlugs?: string[];
  visibleWhenLocked?: boolean;
};

export type RelatedContentDisplayItem = {
  name: string;
  description?: string;
  preview: boolean;
};

export function hasReachedStage(
  currentStage: string | null | undefined,
  requiredStage: ProjectStageId,
): boolean {
  const currentIndex = PROJECT_STAGES.findIndex((s) => s.id === normalizeStageId(currentStage));
  const requiredIndex = PROJECT_STAGES.findIndex((s) => s.id === requiredStage);
  if (currentIndex < 0 || requiredIndex < 0) return false;
  return currentIndex >= requiredIndex;
}

export function isContentUnlocked(content: UnlockableContent, projectState: ProjectState): boolean {
  const requiredStage = content.unlockStage || "INITIATION";
  if (!hasReachedStage(projectState.currentStage, requiredStage)) return false;

  const milestones = parseMilestones(projectState);
  if (content.unlockMilestones?.some((key) => !milestones[key])) return false;

  return true;
}

export function getUnlockRequirementLabels(content: UnlockableContent): string[] {
  const requirements: string[] = [];
  const stageConfig = getStageConfig(content.unlockStage || "INITIATION");
  if (stageConfig) {
    requirements.push(`进入「${stageConfig.name}」阶段`);
  }
  if (content.unlockMilestones?.length) {
    for (const key of content.unlockMilestones) {
      requirements.push(`完成关键节点「${MILESTONE_LABELS[key] || key}」`);
    }
  }
  return requirements;
}

export function filterUnlockedNpcs(npcs: NpcData[], projectState: ProjectState): NpcData[] {
  return npcs.filter((npc) => isContentUnlocked(npc as UnlockableContent, projectState));
}

export function filterUnlockedAreas(areas: AreaData[], projectState: ProjectState): AreaData[] {
  return areas.filter((area) => isContentUnlocked(area as UnlockableContent, projectState));
}

export function resolveRelatedContentForDisplay<T extends UnlockableContent & { description?: string }>(
  names: string[] | undefined,
  catalog: T[],
  projectState: ProjectState,
): RelatedContentDisplayItem[] {
  const items: RelatedContentDisplayItem[] = [];

  for (const name of names || []) {
    const content = catalog.find((item) => item.name === name);
    if (!content) continue;

    if (isContentUnlocked(content, projectState)) {
      items.push({ name: content.name, description: content.description, preview: false });
    } else if (content.visibleWhenLocked) {
      items.push({ name: content.name, preview: true });
    }
  }

  return items;
}
