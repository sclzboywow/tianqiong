import { LOCATION_ACTIONS } from "@/data/locationActions";
import { getTaskTemplates } from "@/game/contentLoader";
import {
  buildDependencyContext,
  evaluateTaskTemplateDependencies,
} from "@/game/dependencyEngine";
import type { TaskTemplateData } from "@/game/types";

const SEASON_ID = process.env.SEASON_ID || "season-1";

export type ActionTaskPreview = {
  slug: string;
  title: string;
  available: boolean;
  blockingReasons: string[];
  missingArtifacts: {
    slug: string;
    name: string;
    currentStatus: string;
    requiredStatus: string;
  }[];
  suggestedActions: { label: string; locationId: string; actionId: string }[];
};

export type ActionDependencyPreview = {
  actionId: string;
  taskPreviews: ActionTaskPreview[];
  hasBlockers: boolean;
  allAvailable: boolean;
};

function findProducingActions(artifactSlug: string, templates: TaskTemplateData[]) {
  const producers = templates.filter((template) =>
    (template.outputArtifacts || []).some((item) => item.artifactSlug === artifactSlug),
  );
  const suggestions: { label: string; locationId: string; actionId: string }[] = [];

  for (const template of producers) {
    for (const action of LOCATION_ACTIONS) {
      if ((action.triggerTaskSlugs || []).includes(template.slug)) {
        suggestions.push({
          label: action.label,
          locationId: action.locationId,
          actionId: action.id,
        });
      }
    }
  }

  const seen = new Set<string>();
  return suggestions.filter((item) => {
    const key = `${item.locationId}:${item.actionId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function buildActionDependencyPreview(
  actionId: string,
  triggerTaskSlugs: string[],
): Promise<ActionDependencyPreview> {
  const templates = await getTaskTemplates();
  const context = await buildDependencyContext(SEASON_ID);
  const taskPreviews: ActionTaskPreview[] = [];

  for (const slug of triggerTaskSlugs) {
    const template = templates.find((item) => item.slug === slug);
    if (!template) {
      taskPreviews.push({
        slug,
        title: slug,
        available: false,
        blockingReasons: [`任务模板不存在: ${slug}`],
        missingArtifacts: [],
        suggestedActions: [],
      });
      continue;
    }

    const dep = await evaluateTaskTemplateDependencies(template, context);
    const missingArtifacts = dep.missingArtifacts.map((item) => ({
      slug: item.slug,
      name: item.name,
      currentStatus: item.actual ?? "未产出",
      requiredStatus: item.required,
    }));

    const suggestedActions = missingArtifacts.flatMap((item) =>
      findProducingActions(item.slug, templates),
    );

    taskPreviews.push({
      slug: template.slug,
      title: template.title,
      available: dep.available,
      blockingReasons: dep.blockingReasons,
      missingArtifacts,
      suggestedActions: suggestedActions.slice(0, 5),
    });
  }

  return {
    actionId,
    taskPreviews,
    hasBlockers: taskPreviews.some((item) => !item.available),
    allAvailable: taskPreviews.length > 0 && taskPreviews.every((item) => item.available),
  };
}

export async function buildLocationActionDependencyPreviews(
  actionIds: { id: string; triggerTaskSlugs: string[] }[],
): Promise<Record<string, ActionDependencyPreview>> {
  const map: Record<string, ActionDependencyPreview> = {};
  for (const action of actionIds) {
    map[action.id] = await buildActionDependencyPreview(action.id, action.triggerTaskSlugs);
  }
  return map;
}
