import type {
  CleanupItem,
  ContentOrchestrationData,
  OrchestrationStage,
} from "./contentOrchestrationLoader";

type HealthInput = Pick<
  ContentOrchestrationData,
  | "stages"
  | "cleanup"
  | "allTasks"
  | "allActions"
  | "allEvents"
  | "allStoryEntries"
  | "terminalTask"
  | "artifacts"
>;

export function buildOrchestrationHealth(input: HealthInput): {
  errors: string[];
  warnings: string[];
  summary: string;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input.cleanup.clean) {
    const remaining = [
      ...input.cleanup.oldTasks,
      ...input.cleanup.oldEvents,
      ...input.cleanup.oldStoryEntries,
      ...input.cleanup.oldLocationActions,
      ...input.cleanup.oldInkFiles,
      ...input.cleanup.oldStageTasks,
      ...input.cleanup.oldStageStoryEntries,
    ].filter((item: CleanupItem) => item.found);
    errors.push(`旧主线数据残留 ${remaining.length} 项`);
  }

  for (const item of input.cleanup.oldStageTasks) {
    if (item.found) {
      errors.push(`旧阶段主线任务仍存在: ${item.slug}${item.detail ? ` (${item.detail})` : ""}`);
    }
  }

  for (const stage of input.stages) {
    warnings.push(...stage.warnings);
  }

  for (const action of input.allActions) {
    if (action.risks.length > 0) {
      for (const risk of action.risks) {
        warnings.push(`[地点行动 ${action.slug}] ${risk}`);
      }
    }
  }

  for (const event of input.allEvents) {
    if (event.risks.length > 0) {
      for (const risk of event.risks) {
        const level = risk.includes("旧 Chapter1") ? "error" : "warn";
        if (level === "error") errors.push(`[事件 ${event.slug}] ${risk}`);
        else warnings.push(`[事件 ${event.slug}] ${risk}`);
      }
    }
  }

  for (const entry of input.allStoryEntries) {
    if (entry.risks.length > 0) {
      for (const risk of entry.risks) {
        warnings.push(`[StoryEntry ${entry.slug}] ${risk}`);
      }
    }
  }

  const terminal = input.terminalTask;
  if (terminal) {
    const required = [
      "approval_reply",
      "planning_condition",
      "drawing_review_certificate",
      "construction_contract",
      "supervision_contract",
      "quality_safety_supervision",
      "funding_certificate",
    ];
    const missing = required.filter((slug) => !terminal.inputArtifacts.includes(slug));
    if (missing.length > 0) {
      errors.push(`终局任务缺少输入成果物: ${missing.join(", ")}`);
    }
    for (const slug of required) {
      const artifact = input.artifacts.find((a) => a.slug === slug);
      if (!artifact || artifact.producedBy.length === 0) {
        errors.push(`终局依赖成果物 ${slug} 无产出任务`);
      }
    }
  } else {
    errors.push("未找到终局任务 submit_construction_permit_application");
  }

  const mainlineWithoutStory = input.allTasks.filter(
    (t) => t.category === "mainline" && !t.relatedStorySlug && !t.storyEntryDocId,
  );
  for (const task of mainlineWithoutStory) {
    warnings.push(`主线任务 ${task.slug} 缺少 StoryEntry 关联`);
  }

  const summary =
    errors.length === 0
      ? warnings.length === 0
        ? "编排健康：无错误与警告"
        : `编排基本健康：${warnings.length} 条警告`
      : `发现 ${errors.length} 个错误、${warnings.length} 条警告`;

  return { errors, warnings, summary };
}

export function countStageStats(stage: OrchestrationStage) {
  return {
    tasks: stage.tasks.length,
    corrections: stage.correctionTasks.length,
    artifacts: stage.artifacts.length,
    actions: stage.actions.length,
    events: stage.events.filter((e) => e.kind === "construction").length,
  };
}
