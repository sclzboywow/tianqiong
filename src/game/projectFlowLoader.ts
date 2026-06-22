import { loadContentStudioData } from "./contentStudioLoader";
import { MILESTONE_LABELS, PROJECT_STAGES } from "./projectStages";
import type { EventTemplateData, TaskTemplateData } from "./types";
import { CONSTRUCTION_PROJECT_MAINLINE_TASKS } from "@/data/constructionProjectMainlineTasks";
import {
  buildDependencyContext,
  evaluateTaskTemplateDependencies,
} from "./dependencyEngine";
import { getProjectState } from "./projectEngine";
import { buildContentHealthCheckFromStudioData } from "./contentHealthCheck";
import { LEGACY_NPC_NAME_ALIASES } from "@/data/npcProfiles";

export type ProjectFlowEventCard = EventTemplateData & {
  businessType: string;
  payloadDocId?: string | number;
};

export type ProjectFlowTask = TaskTemplateData & {
  payloadDocId?: string | number;
  locationNames: { slug: string; name: string }[];
  actionSlugs: {
    slug: string;
    label: string;
    description: string;
    payloadDocId?: string | number;
  }[];
  npcNames: string[];
  inputArtifactLabels: { slug: string; name: string; status?: string }[];
  outputArtifactLabels: { slug: string; name: string; status?: string }[];
  milestoneLabels: { key: string; label: string }[];
  stories: {
    slug: string;
    title: string;
    description?: string;
    inkFile: string;
    payloadDocId?: string | number;
  }[];
  events: ProjectFlowEventCard[];
  configurationIssues: string[];
  runtime: {
    available: boolean;
    blockingReasons: string[];
  };
};

export type ProjectFlowData = {
  stages: {
    id: string;
    name: string;
    description: string;
    requiredMilestones: { key: string; label: string }[];
    tasks: ProjectFlowTask[];
    events: ProjectFlowEventCard[];
  }[];
  options: {
    locations: { slug: string; name: string }[];
    npcs: { name: string; description: string }[];
    artifacts: {
      slug: string;
      name: string;
      defaultStatus: string;
      allowedStatuses: string[];
    }[];
    milestones: { key: string; label: string }[];
    tasks: { slug: string; title: string }[];
  };
  summary: {
    tasks: number;
    issues: number;
    events: number;
    blockedTasks: number;
    healthFailures: number;
    healthWarnings: number;
    currentStage?: string;
  };
};

function eventBusinessType(event: EventTemplateData): string {
  const text =
    `${event.eventType || ""} ${event.title} ${event.description || ""} ${(event.riskTags || []).join(" ")}`.toLowerCase();
  if (
    text.includes("材料") ||
    text.includes("material") ||
    text.includes("补正")
  )
    return "材料补正";
  if (
    text.includes("审批") ||
    text.includes("退回") ||
    text.includes("approval")
  )
    return "审批退回";
  if (text.includes("规划") || text.includes("planning")) return "规划冲突";
  if (text.includes("设计") || text.includes("design")) return "设计修改";
  if (
    text.includes("招采") ||
    text.includes("合同") ||
    text.includes("procurement")
  )
    return "招采风险";
  if (
    text.includes("验收") ||
    text.includes("整改") ||
    text.includes("acceptance")
  )
    return "验收整改";
  if (
    text.includes("施工") ||
    text.includes("安全") ||
    text.includes("质量") ||
    text.includes("construction")
  )
    return "施工风险";
  return "流程事件";
}

export async function loadProjectFlowData(): Promise<ProjectFlowData> {
  const [studio, project] = await Promise.all([
    loadContentStudioData(),
    getProjectState(),
  ]);
  const dependencyContext = await buildDependencyContext(
    project?.seasonId || process.env.SEASON_ID || "season-1",
  );
  const healthReport = buildContentHealthCheckFromStudioData(studio);
  const taskSlugSet = new Set(studio.taskTemplates.map((task) => task.slug));
  const mainlineSlugSet = new Set(
    CONSTRUCTION_PROJECT_MAINLINE_TASKS.filter(
      (task) => task.category === "mainline",
    ).map((task) => task.slug),
  );
  const artifactMap = new Map(
    studio.artifactDefinitions.map((artifact) => [artifact.slug, artifact]),
  );
  const locationMap = new Map(
    studio.mapLocations.map((location) => [location.id, location]),
  );
  const npcSet = new Set(studio.npcs.map((npc) => npc.name));

  const eventCards: ProjectFlowEventCard[] = studio.eventTemplates.map(
    (event) => ({
      ...event,
      businessType: eventBusinessType(event),
      payloadDocId: studio.eventTemplateDocIds[event.slug],
    }),
  );

  const tasks = await Promise.all(
    studio.taskTemplates
      .filter(
        (task) =>
          task.category === "mainline" || mainlineSlugSet.has(task.slug),
      )
      .map(async (task): Promise<ProjectFlowTask> => {
        const actions = studio.locationActions.filter((action) =>
          (action.triggerTaskSlugs || []).includes(task.slug),
        );
        const locations = [
          ...new Set([
            ...actions.map((action) => action.locationId),
            ...studio.mapLocations
              .filter((location) =>
                (location.relatedTaskSlugs || []).includes(task.slug),
              )
              .map((location) => location.id),
          ]),
        ];
        const stories = studio.storyEntries.filter(
          (story) =>
            story.slug === task.storySlug ||
            (story.relatedTaskSlugs || []).includes(task.slug),
        );
        const events = eventCards.filter(
          (event) =>
            (event.triggerTaskSlugs || []).includes(task.slug) ||
            (event.taskEffects || []).some(
              (effect) => effect.taskSlug === task.slug,
            ),
        );
        const inputArtifactLabels = (task.inputArtifacts || []).map((item) => ({
          slug: item.artifactSlug,
          name: artifactMap.get(item.artifactSlug)?.name || item.artifactSlug,
          status: item.minStatus,
        }));
        const outputArtifactLabels = (task.outputArtifacts || []).map(
          (item) => ({
            slug: item.artifactSlug,
            name: artifactMap.get(item.artifactSlug)?.name || item.artifactSlug,
            status: item.status,
          }),
        );
        const milestoneLabels = Object.keys(task.milestoneEffects || {}).map(
          (key) => ({
            key,
            label: MILESTONE_LABELS[key] || key,
          }),
        );
        const relatedNpcNames = [
          ...new Set([
            ...(task.npcList || []),
            ...actions.flatMap((action) => action.relatedNpcNames || []),
            ...events.flatMap((event) => event.triggerNpcNames || []),
          ]),
        ];
        const issues: string[] = [];
        if (actions.length === 0) issues.push("尚未配置地点行动入口");
        if (stories.length === 0) issues.push("尚未关联剧情片段");
        if (locations.some((slug) => !locationMap.has(slug)))
          issues.push("引用了不存在的办理地点");
        if (
          relatedNpcNames.some(
            (name) => !npcSet.has(name) && !LEGACY_NPC_NAME_ALIASES[name],
          )
        )
          issues.push("引用了不存在的协同对象");
        if (
          [...inputArtifactLabels, ...outputArtifactLabels].some(
            (item) => !artifactMap.has(item.slug),
          )
        ) {
          issues.push("引用了未定义的成果物");
        }
        if (
          (task.prerequisiteTaskSlugs || []).some(
            (slug) => !taskSlugSet.has(slug),
          )
        ) {
          issues.push("引用了不存在的前置流程任务");
        }
        if (milestoneLabels.some((item) => !MILESTONE_LABELS[item.key]))
          issues.push("包含未知关键节点");
        const runtime = await evaluateTaskTemplateDependencies(
          task,
          dependencyContext,
        );

        return {
          ...task,
          payloadDocId: studio.taskTemplateDocIds[task.slug],
          locationNames: locations.map((slug) => ({
            slug,
            name: locationMap.get(slug)?.name || slug,
          })),
          actionSlugs: actions.map((action) => ({
            slug: action.id,
            label: action.label,
            description: action.description,
            payloadDocId: studio.locationActionDocIds[action.id],
          })),
          npcNames: relatedNpcNames,
          inputArtifactLabels,
          outputArtifactLabels,
          milestoneLabels,
          stories: stories.map((story) => ({
            slug: story.slug,
            title: story.title,
            description: story.description,
            inkFile: story.inkFile,
            payloadDocId: studio.storyEntryDocIds[story.slug],
          })),
          events,
          configurationIssues: issues,
          runtime: {
            available: runtime.available,
            blockingReasons: runtime.blockingReasons,
          },
        };
      }),
  );

  const stages = PROJECT_STAGES.map((stage) => ({
    id: stage.id,
    name: stage.name,
    description: stage.description,
    requiredMilestones: stage.requiredMilestones.map((key) => ({
      key,
      label: MILESTONE_LABELS[key] || key,
    })),
    tasks: tasks.filter((task) => task.stage === stage.id),
    events: eventCards.filter((event) => event.triggerStage === stage.id),
  }));

  return {
    stages,
    options: {
      locations: studio.mapLocations.map((location) => ({
        slug: location.id,
        name: location.name,
      })),
      npcs: [
        ...studio.npcs.map((npc) => ({
          name: npc.name,
          description: npc.description,
        })),
        ...Object.keys(LEGACY_NPC_NAME_ALIASES)
          .filter((name) => !studio.npcs.some((npc) => npc.name === name))
          .map((name) => ({ name, description: "兼容岗位 / 单位别名" })),
      ],
      artifacts: studio.artifactDefinitions.map((artifact) => ({
        slug: artifact.slug,
        name: artifact.name,
        defaultStatus: artifact.defaultStatus || "draft",
        allowedStatuses: (artifact.allowedStatuses || []).map(
          (status) => status.status,
        ),
      })),
      milestones: Object.entries(MILESTONE_LABELS).map(([key, label]) => ({
        key,
        label,
      })),
      tasks: studio.taskTemplates.map((task) => ({
        slug: task.slug,
        title: task.title,
      })),
    },
    summary: {
      tasks: tasks.length,
      issues: tasks.reduce(
        (sum, task) => sum + task.configurationIssues.length,
        0,
      ),
      events: eventCards.length,
      blockedTasks: tasks.filter((task) => !task.runtime.available).length,
      healthFailures: healthReport.failCount,
      healthWarnings: healthReport.warnCount,
      currentStage: project?.currentStage,
    },
  };
}

export async function loadProjectFlowNode(slug: string): Promise<{
  node: ProjectFlowTask;
  options: ProjectFlowData["options"];
  stageName: string;
  stageId: string;
} | null> {
  const data = await loadProjectFlowData();
  for (const stage of data.stages) {
    const node = stage.tasks.find((task) => task.slug === slug);
    if (node) {
      return {
        node,
        options: data.options,
        stageName: stage.name,
        stageId: stage.id,
      };
    }
  }
  return null;
}
