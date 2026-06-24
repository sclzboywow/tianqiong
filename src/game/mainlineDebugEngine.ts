import { prisma } from "@/prisma/client";
import { CONSTRUCTION_PROJECT_MAINLINE_TASKS, CONSTRUCTION_MAINLINE_TASK_SLUGS } from "@/data/constructionProjectMainlineTasks";
import { initializeProjectForSeed, getProjectState, parseMilestones, checkStageGate } from "@/game/projectEngine";
import {
  spawnTasksFromTemplates,
  filterTemplatesForCurrentStage,
  createTaskFromTemplateSlug,
  joinTask,
  resolveChoice,
} from "@/game/taskEngine";
import { getTaskTemplates } from "@/game/contentLoader";
import { normalizeStageId, PROJECT_STAGES, MILESTONE_LABELS } from "@/game/projectStages";
import {
  buildDependencyContext,
  evaluateTaskTemplateDependencies,
} from "@/game/dependencyEngine";
import {
  buildArtifactStatusMap,
  getProjectArtifacts,
  upsertArtifactStatus,
} from "@/game/artifactEngine";
import { getProjectOverview } from "@/game/projectOverview";
import { loadArtifactDefinitions } from "@/game/artifactLoader";
import { resolveAllowedStatuses } from "@/data/artifactDefinitions";
import { getMetricDisplayName } from "@/game/contentDisplayLabels";
import type { ProjectStageId } from "@/game/projectStages";
import type { TaskTemplateData } from "@/game/types";

const SEASON_ID = process.env.SEASON_ID || "season-1";

export const MAINLINE_TASK_SLUGS = CONSTRUCTION_MAINLINE_TASK_SLUGS;

export const MAINLINE_TASKS_BY_STAGE = PROJECT_STAGES.reduce(
  (acc, stage) => {
    acc[stage.id] = CONSTRUCTION_PROJECT_MAINLINE_TASKS.filter(
      (t) => t.category === "mainline" && t.stage === stage.id,
    ).map((t) => t.slug);
    return acc;
  },
  {} as Record<ProjectStageId, string[]>,
);

async function pickDebugUserId(explicitUserId?: string): Promise<string> {
  if (explicitUserId) return explicitUserId;
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) throw new Error("无用户，请先注册一名玩家");
  return user.id;
}

export async function resetMainlineDebugState() {
  await prisma.task.deleteMany({ where: { seasonId: SEASON_ID } });
  await prisma.projectArtifact.deleteMany({ where: { seasonId: SEASON_ID } });

  const project = await initializeProjectForSeed(SEASON_ID);
  const templates = await getTaskTemplates();
  const stageTemplates = filterTemplatesForCurrentStage(
    templates,
    normalizeStageId(project.currentStage),
  );
  await spawnTasksFromTemplates(stageTemplates);

  return {
    currentStage: project.currentStage,
    spawnedTasks: stageTemplates.length,
    taskSlugs: stageTemplates.map((t) => t.slug),
  };
}

export async function getMainlineDebugStatus() {
  const project = await getProjectState(SEASON_ID);
  const overview = await getProjectOverview();
  const templates = await getTaskTemplates();
  const context = await buildDependencyContext(SEASON_ID);
  const artifactMap = await buildArtifactStatusMap(SEASON_ID);
  const definitions = await loadArtifactDefinitions();

  const tasks = await prisma.task.findMany({
    where: { seasonId: SEASON_ID },
    orderBy: { createdAt: "asc" },
  });

  const mainlineTemplates = CONSTRUCTION_PROJECT_MAINLINE_TASKS.filter(
    (t) => t.category === "mainline",
  );

  const mainlineByStage: Record<
    string,
    Array<{
      slug: string;
      title: string;
      stage: string;
      runtimeStatus: string | null;
      taskId: string | null;
      available: boolean;
      blockingReasons: string[];
      missingArtifacts: { slug: string; name: string; required: string; actual: string | null }[];
    }>
  > = {};

  for (const template of mainlineTemplates) {
    const dep = await evaluateTaskTemplateDependencies(template, context);
    const runtime = tasks.find((t) => t.templateId === template.slug);
    const stage = template.stage || "INITIATION";
    if (!mainlineByStage[stage]) mainlineByStage[stage] = [];
    mainlineByStage[stage].push({
      slug: template.slug,
      title: template.title,
      stage,
      runtimeStatus: runtime?.status ?? null,
      taskId: runtime?.id ?? null,
      available: dep.available,
      blockingReasons: dep.blockingReasons,
      missingArtifacts: dep.missingArtifacts,
    });
  }

  const permitTemplate = templates.find(
    (t) => t.slug === "submit_construction_permit_application",
  );
  let permitDebug = null;
  if (permitTemplate) {
    const dep = await evaluateTaskTemplateDependencies(permitTemplate, context);
    permitDebug = {
      slug: permitTemplate.slug,
      title: permitTemplate.title,
      available: dep.available,
      blockingReasons: dep.blockingReasons,
      missingArtifacts: dep.missingArtifacts,
      inputArtifacts: (permitTemplate.inputArtifacts || []).map((item) => {
        const definition = definitions.find((def) => def.slug === item.artifactSlug);
        return {
          slug: item.artifactSlug,
          name: definition?.name || item.artifactSlug,
          minStatus: item.minStatus,
          currentStatus: artifactMap[item.artifactSlug] ?? null,
        };
      }),
    };
  }

  const milestones = project ? parseMilestones(project) : {};
  const gate = project ? checkStageGate(project) : null;
  const gateBlockingReasons = gate
    ? [
        ...gate.missingMilestones.map((k) => `关键节点「${MILESTONE_LABELS[k] || k}」未达成`),
        ...gate.failedMetrics.map((m) => `指标未达标：${getMetricDisplayName(m)}`),
      ]
    : [];

  return {
    seasonId: SEASON_ID,
    project,
    overview,
    milestones,
    stageGate: gate
      ? {
          canAdvance: gate.canAdvance,
          stageGateStatus: project?.stageGateStatus,
          missingMilestones: gate.missingMilestones,
          failedMetrics: gate.failedMetrics,
          blockingReasons: gateBlockingReasons,
        }
      : null,
    artifacts: definitions.map((def) => ({
      slug: def.slug,
      name: def.name,
      stage: def.stage,
      defaultStatus: def.defaultStatus,
      currentStatus: artifactMap[def.slug] ?? null,
      allowedStatusOptions: resolveAllowedStatuses(def).map((status) => ({
        status: status.status,
        label: status.label || status.status,
      })),
    })),
    mainlineByStage,
    permitDebug,
  };
}

export async function completeMainlineTaskBySlug(taskSlug: string, userId?: string) {
  const debugUserId = await pickDebugUserId(userId);
  const templates = await getTaskTemplates();
  const template = templates.find((t) => t.slug === taskSlug);
  if (!template) throw new Error(`任务模板不存在: ${taskSlug}`);

  let task = await prisma.task.findFirst({
    where: {
      seasonId: SEASON_ID,
      templateId: taskSlug,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
  });

  if (!task) {
    const created = await createTaskFromTemplateSlug(taskSlug);
    if (!created?.task) {
      const reasons = created?.dependencyReasons?.join("；") || "无法生成任务";
      throw new Error(`任务未生成: ${reasons}`);
    }
    task = created.task;
  }

  await joinTask(task.id, debugUserId);
  await prisma.task.update({
    where: { id: task.id },
    data: { baseSuccessRate: 100 },
  });

  const choiceId =
    template.choiceEffects && "steady_push" in template.choiceEffects
      ? "steady_push"
      : Object.keys(template.choiceEffects || {})[0] || "immediate_fix";

  const prevForceSuccess = process.env.CHAPTER1_FLOW_TEST;
  process.env.CHAPTER1_FLOW_TEST = "1";
  let result;
  try {
    result = await resolveChoice(task.id, debugUserId, choiceId);
  } finally {
    if (prevForceSuccess === undefined) {
      delete process.env.CHAPTER1_FLOW_TEST;
    } else {
      process.env.CHAPTER1_FLOW_TEST = prevForceSuccess;
    }
  }

  let project = await getProjectState(SEASON_ID);

  const stage = normalizeStageId(project?.currentStage);
  const stageSlugs = CONSTRUCTION_PROJECT_MAINLINE_TASKS.filter(
    (item) => item.category === "mainline" && item.stage === stage,
  ).map((item) => item.slug);
  for (const slug of stageSlugs) {
    await createTaskFromTemplateSlug(slug);
  }

  project = await getProjectState(SEASON_ID);
  const artifacts = await getProjectArtifacts(SEASON_ID);

  return {
    taskSlug,
    choiceId,
    result,
    currentStage: project?.currentStage,
    milestones: project ? parseMilestones(project) : {},
    constructionPermit: artifacts.get("construction_permit") ?? null,
  };
}

export async function grantMainlineArtifact(slug: string, status: string) {
  const record = await upsertArtifactStatus(SEASON_ID, slug, status, {
    source: { sourceType: "system", note: "mainline-debug grant" },
  });
  return record;
}

export async function clearMainlineArtifacts() {
  const deleted = await prisma.projectArtifact.deleteMany({ where: { seasonId: SEASON_ID } });
  return { deleted: deleted.count };
}

export async function getMainlineAdvanceCheck() {
  const project = await getProjectState(SEASON_ID);
  if (!project) throw new Error("项目不存在");

  const stage = normalizeStageId(project.currentStage);
  const slugs = MAINLINE_TASKS_BY_STAGE[stage] || [];
  const tasks = await prisma.task.findMany({
    where: { seasonId: SEASON_ID, templateId: { in: slugs } },
  });

  const completed = slugs.filter((slug) =>
    tasks.some((t) => t.templateId === slug && t.status === "COMPLETED"),
  );
  const gate = checkStageGate(project);
  const gateBlockingReasons = [
    ...gate.missingMilestones.map((k) => `关键节点「${MILESTONE_LABELS[k] || k}」未达成`),
    ...gate.failedMetrics.map((m) => `指标未达标: ${m}`),
  ];

  return {
    currentStage: stage,
    stageProgress: project.stageProgress,
    mainlineTotal: slugs.length,
    mainlineCompleted: completed.length,
    allMainlineCompleted: completed.length === slugs.length && slugs.length > 0,
    canAdvanceStage: gate.canAdvance,
    stageGateStatus: project.stageGateStatus,
    missingMilestones: gate.missingMilestones,
    failedMetrics: gate.failedMetrics,
    blockingReasons: gateBlockingReasons,
    pendingSlugs: slugs.filter(
      (slug) => !tasks.some((t) => t.templateId === slug && t.status === "COMPLETED"),
    ),
  };
}

export function getMainlineTemplate(slug: string): TaskTemplateData | undefined {
  return CONSTRUCTION_PROJECT_MAINLINE_TASKS.find((t) => t.slug === slug);
}
