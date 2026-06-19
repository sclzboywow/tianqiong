import type { ProjectState, Task } from "@prisma/client";
import type { ProjectStageId } from "./projectStages";
import { normalizeStageId } from "./projectStages";
import { hasReachedStage } from "./projectStageOrder";
import {
  getNpcPresenceRule,
  type NpcTemporaryPresenceRule,
} from "@/data/npcPresenceRules";

export type NpcPresenceStatus = "present" | "reachable" | "away" | "locked";

export type ResolvedNpcPresence = {
  npcId: string;
  status: NpcPresenceStatus;
  currentLocationId?: string;
  homeLocationId?: string;
  reason?: string;
  hint?: string;
};

const TERMINAL_TASK_STATUSES = new Set(["COMPLETED", "FAILED", "EXPIRED"]);

function isActiveTask(task: Task, slug: string): boolean {
  return task.templateId === slug && !TERMINAL_TASK_STATUSES.has(task.status);
}

function hasActiveTaskSlugs(tasks: Task[], slugs: string[]): boolean {
  if (slugs.length === 0) return false;
  return slugs.some((slug) => tasks.some((task) => isActiveTask(task, slug)));
}

function hasActiveEvents(activeEventSlugs: string[], slugs: string[]): boolean {
  if (slugs.length === 0) return false;
  const active = new Set(activeEventSlugs);
  return slugs.some((slug) => active.has(slug));
}

function resolveTemporaryLocation(params: {
  rules: NpcTemporaryPresenceRule[];
  currentStage: ProjectStageId;
  tasks: Task[];
  activeEventSlugs: string[];
}): { locationId: string; reason: string } | undefined {
  const matched = params.rules
    .filter((rule) => {
      if (rule.fromStage && !hasReachedStage(params.currentStage, rule.fromStage)) {
        return false;
      }
      const taskMatch = rule.taskSlugs?.length
        ? hasActiveTaskSlugs(params.tasks, rule.taskSlugs)
        : false;
      const eventMatch = rule.eventSlugs?.length
        ? hasActiveEvents(params.activeEventSlugs, rule.eventSlugs)
        : false;
      if (rule.taskSlugs?.length || rule.eventSlugs?.length) {
        return taskMatch || eventMatch;
      }
      return false;
    })
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

  const winner = matched[0];
  if (!winner) return undefined;
  return { locationId: winner.locationId, reason: winner.reason };
}

export function tryResolveNpcPresence(params: {
  npcId: string;
  currentLocationId: string;
  project: ProjectState;
  tasks: Task[];
  activeEventSlugs?: string[];
}): ResolvedNpcPresence | undefined {
  const rule = getNpcPresenceRule(params.npcId);
  if (!rule) return undefined;
  return resolveNpcPresence(params);
}

export function resolveNpcPresence(params: {
  npcId: string;
  currentLocationId: string;
  project: ProjectState;
  tasks: Task[];
  activeEventSlugs?: string[];
}): ResolvedNpcPresence {
  const rule = getNpcPresenceRule(params.npcId);
  if (!rule) {
    throw new Error(`Missing NPC presence rule: ${params.npcId}`);
  }

  const currentStage = normalizeStageId(params.project.currentStage);
  if (rule.appearStage && !hasReachedStage(currentStage, rule.appearStage)) {
    return {
      npcId: params.npcId,
      status: "locked",
      homeLocationId: rule.homeLocationId,
      hint: rule.awayHint,
    };
  }

  const temporary = resolveTemporaryLocation({
    rules: rule.temporaryLocations ?? [],
    currentStage,
    tasks: params.tasks,
    activeEventSlugs: params.activeEventSlugs ?? [],
  });

  const resolvedLocationId = temporary?.locationId ?? rule.homeLocationId;

  if (params.currentLocationId === resolvedLocationId) {
    return {
      npcId: params.npcId,
      status: "present",
      currentLocationId: resolvedLocationId,
      homeLocationId: rule.homeLocationId,
      reason: temporary?.reason,
    };
  }

  if (rule.reachableWhenAway) {
    return {
      npcId: params.npcId,
      status: "reachable",
      currentLocationId: resolvedLocationId,
      homeLocationId: rule.homeLocationId,
      reason: temporary?.reason,
      hint: rule.awayHint,
    };
  }

  return {
    npcId: params.npcId,
    status: "away",
    currentLocationId: resolvedLocationId,
    homeLocationId: rule.homeLocationId,
    reason: temporary?.reason,
    hint: rule.awayHint,
  };
}
