import { normalizeStageId, type ProjectStageId } from "./projectStages";

export const PROJECT_STAGE_ORDER: ProjectStageId[] = [
  "INITIATION",
  "APPROVAL",
  "DESIGN",
  "PROCUREMENT",
  "CONSTRUCTION",
  "ACCEPTANCE",
  "OPENING",
];

export function getProjectStageIndex(stage: ProjectStageId): number {
  return PROJECT_STAGE_ORDER.indexOf(stage);
}

export function hasReachedStage(current: ProjectStageId, required?: ProjectStageId): boolean {
  if (!required) return true;
  const currentId = normalizeStageId(current);
  return getProjectStageIndex(currentId) >= getProjectStageIndex(required);
}
