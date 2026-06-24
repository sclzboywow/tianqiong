import type { TaskTemplateData, DependencyContext, DependencyEvaluationResult } from "./types";
import { getArtifactDefinitionBySlug } from "./artifactLoader";
import { isStatusAtLeast, getArtifactStatusLabel } from "./artifactEngine";
import { parseMilestones } from "./projectEngine";
import { prisma } from "@/prisma/client";
import { MILESTONE_LABELS } from "./projectStages";
import { getTaskTemplates } from "./contentLoader";

let taskTitleCache: Map<string, string> | null = null;

async function getTaskTitle(slug: string): Promise<string> {
  if (!taskTitleCache) {
    const templates = await getTaskTemplates();
    taskTitleCache = new Map(
      templates.map((template) => [template.slug, template.title?.trim() || template.slug]),
    );
  }
  return taskTitleCache.get(slug) || slug;
}

export function clearDependencyTaskTitleCache() {
  taskTitleCache = null;
}

export async function buildDependencyContext(seasonId: string): Promise<DependencyContext> {
  const project = await prisma.projectState.findUnique({ where: { seasonId } });

  const taskRows = await prisma.task.findMany({
    where: { seasonId, status: "COMPLETED" },
    select: { templateId: true },
  });

  const artifactRows = await prisma.projectArtifact.findMany({ where: { seasonId } });
  const artifactStatuses: Record<string, string | null> = {};
  for (const row of artifactRows) {
    artifactStatuses[row.artifactSlug] = row.status;
  }

  return {
    seasonId,
    completedTaskSlugs: taskRows.map((row) => row.templateId),
    milestones: project ? parseMilestones(project) : {},
    artifactStatuses,
  };
}

export async function evaluateTaskTemplateDependencies(
  template: TaskTemplateData,
  context: DependencyContext,
): Promise<DependencyEvaluationResult> {
  const missingArtifacts: DependencyEvaluationResult["missingArtifacts"] = [];
  const missingTasks: string[] = [];
  const missingMilestones: string[] = [];
  const blockingReasons: string[] = [];

  for (const req of template.inputArtifacts || []) {
    const slug = req.artifactSlug?.trim();
    if (!slug) continue;

    const definition = await getArtifactDefinitionBySlug(slug);
    const name = definition?.name || slug;
    const minStatus = req.minStatus || definition?.defaultStatus || "draft";
    const actual = context.artifactStatuses[slug] ?? null;

    if (!definition || !isStatusAtLeast(definition, actual, minStatus)) {
      const actualLabel = await getArtifactStatusLabel(slug, actual);
      const requiredLabel = await getArtifactStatusLabel(slug, minStatus);
      missingArtifacts.push({
        slug,
        name,
        required: requiredLabel,
        actual: actualLabel,
      });
      blockingReasons.push(
        `缺少成果物「${name}」（当前：${actualLabel}，需要：${requiredLabel}）`,
      );
    }
  }

  for (const taskSlug of template.prerequisiteTaskSlugs || []) {
    const slug = taskSlug.trim();
    if (!slug) continue;
    if (!context.completedTaskSlugs.includes(slug)) {
      missingTasks.push(slug);
      const title = await getTaskTitle(slug);
      blockingReasons.push(`前置任务「${title}」尚未完成`);
    }
  }

  for (const milestone of template.requiredMilestones || []) {
    const key = milestone.trim();
    if (!key) continue;
    if (context.milestones[key]) continue;
    missingMilestones.push(key);
    const label = MILESTONE_LABELS[key] || key;
    blockingReasons.push(`关键节点「${label}」尚未达成`);
  }

  const hardBlock = (template.blockPolicy ?? "hard_block") === "hard_block";
  const hasBlockers =
    missingArtifacts.length > 0 || missingTasks.length > 0 || missingMilestones.length > 0;

  return {
    available: hardBlock ? !hasBlockers : true,
    missingArtifacts,
    missingTasks,
    missingMilestones,
    blockingReasons,
  };
}

export async function isTaskTemplateAvailable(
  template: TaskTemplateData,
  seasonId: string,
): Promise<DependencyEvaluationResult> {
  const context = await buildDependencyContext(seasonId);
  return evaluateTaskTemplateDependencies(template, context);
}
