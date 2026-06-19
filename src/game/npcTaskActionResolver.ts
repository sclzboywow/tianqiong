import type { ProjectState, Task } from "@prisma/client";
import { getNpcProfileById } from "@/data/npcProfiles";
import {
  getNpcTaskActions,
  type NpcTaskActionDefinition,
  type NpcTaskActionType,
} from "@/data/npcTaskActions";
import { NPC_TASK_REQUIREMENTS } from "@/data/npcTaskRequirements";
import { getLocationDisplayNameById } from "./locationDisplayName";
import { tryResolveNpcPresence, type NpcPresenceStatus } from "./npcPresenceResolver";
import {
  resolveNpcTaskRequirement,
  type ResolvedNpcTaskRequirement,
} from "./npcTaskRequirementResolver";

export type { NpcTaskActionType };

export type ResolvedNpcTaskAction = {
  id: string;
  taskSlug: string;
  taskTitle: string;
  type: NpcTaskActionType;
  label: string;
  sortOrder: number;
  enabled: boolean;
  completed: boolean;
  reason?: string;
  successLog?: string;
  targetLocationId?: string;
};

const PRESENCE_LABELS: Record<NpcPresenceStatus, string> = {
  present: "在场",
  reachable: "可联络",
  away: "不在场",
  locked: "未解锁",
};

function getNpcName(npcId: string): string {
  return getNpcProfileById(npcId)?.name ?? npcId;
}

function dependenciesMet(
  action: NpcTaskActionDefinition,
  completedActionIds: Set<string>,
): boolean {
  return (action.dependsOnActionIds ?? []).every((id) => completedActionIds.has(id));
}

function evaluateNpcAction(params: {
  action: NpcTaskActionDefinition;
  currentLocationId: string;
  project: ProjectState;
  tasks: Task[];
}): { ok: boolean; reason?: string } {
  const npcId = params.action.targetNpcId;
  if (!npcId) return { ok: true };

  const presence = tryResolveNpcPresence({
    npcId,
    currentLocationId: params.currentLocationId,
    project: params.project,
    tasks: params.tasks,
  });

  if (!presence) return { ok: true };

  const name = getNpcName(npcId);

  if (params.action.type === "contact_npc") {
    if (presence.status === "present" || presence.status === "reachable") {
      return { ok: true };
    }
    const where = presence.currentLocationId
      ? getLocationDisplayNameById(presence.currentLocationId)
      : "其他地点";
    return {
      ok: false,
      reason: `${name}当前不在场（${PRESENCE_LABELS[presence.status]}），通常在：${where}`,
    };
  }

  if (params.action.type === "invite_npc") {
    if (presence.status === "present" && params.currentLocationId === presence.currentLocationId) {
      return { ok: false, reason: `${name}已在当前地点，无需邀请。` };
    }
    if (presence.status === "locked") {
      return { ok: false, reason: `${name}尚未解锁。` };
    }
    return { ok: true };
  }

  return { ok: true };
}

function resolveSingleAction(params: {
  action: NpcTaskActionDefinition;
  requirement?: ResolvedNpcTaskRequirement;
  currentLocationId: string;
  project: ProjectState;
  tasks: Task[];
  completedActionIds: Set<string>;
}): ResolvedNpcTaskAction {
  const { action, requirement, completedActionIds } = params;
  const completed = completedActionIds.has(action.id);
  const taskTitle = requirement?.taskTitle ?? action.taskSlug;

  if (completed) {
    return {
      id: action.id,
      taskSlug: action.taskSlug,
      taskTitle,
      type: action.type,
      label: action.label,
      sortOrder: action.sortOrder,
      enabled: false,
      completed: true,
      successLog: action.successLog,
      targetLocationId: action.targetLocationId,
    };
  }

  if (!dependenciesMet(action, completedActionIds)) {
    return {
      id: action.id,
      taskSlug: action.taskSlug,
      taskTitle,
      type: action.type,
      label: action.label,
      sortOrder: action.sortOrder,
      enabled: false,
      completed: false,
      reason: "请先完成前置动作",
      successLog: action.successLog,
      targetLocationId: action.targetLocationId,
    };
  }

  if (action.requiresCanProgress && !requirement?.canProgress) {
    return {
      id: action.id,
      taskSlug: action.taskSlug,
      taskTitle,
      type: action.type,
      label: action.label,
      sortOrder: action.sortOrder,
      enabled: false,
      completed: false,
      reason: requirement?.message ?? "NPC 条件尚未满足",
      successLog: action.successLog,
      targetLocationId: action.targetLocationId,
    };
  }

  if (action.type === "go_to_location") {
    return {
      id: action.id,
      taskSlug: action.taskSlug,
      taskTitle,
      type: action.type,
      label: action.label,
      sortOrder: action.sortOrder,
      enabled: true,
      completed: false,
      successLog: action.successLog,
      targetLocationId: action.targetLocationId,
    };
  }

  const npcCheck = evaluateNpcAction(params);
  if (!npcCheck.ok) {
    return {
      id: action.id,
      taskSlug: action.taskSlug,
      taskTitle,
      type: action.type,
      label: action.label,
      sortOrder: action.sortOrder,
      enabled: false,
      completed: false,
      reason: npcCheck.reason,
      successLog: action.successLog,
      targetLocationId: action.targetLocationId,
    };
  }

  return {
    id: action.id,
    taskSlug: action.taskSlug,
    taskTitle,
    type: action.type,
    label: action.label,
    sortOrder: action.sortOrder,
    enabled: true,
    completed: false,
    successLog: action.successLog,
    targetLocationId: action.targetLocationId,
  };
}

export function resolveNpcTaskActionsForTask(params: {
  taskSlug: string;
  currentLocationId: string;
  project: ProjectState;
  tasks: Task[];
  completedActionIds?: string[];
}): ResolvedNpcTaskAction[] {
  const definitions = getNpcTaskActions({
    taskSlug: params.taskSlug,
    locationId: params.currentLocationId,
  });
  if (definitions.length === 0) return [];

  const requirement = resolveNpcTaskRequirement({
    taskSlug: params.taskSlug,
    currentLocationId: params.currentLocationId,
    project: params.project,
    tasks: params.tasks,
  });

  const completed = new Set(params.completedActionIds ?? []);

  return definitions.map((action) =>
    resolveSingleAction({
      action,
      requirement,
      currentLocationId: params.currentLocationId,
      project: params.project,
      tasks: params.tasks,
      completedActionIds: completed,
    }),
  );
}

export function resolveNpcTaskActionsForLocation(params: {
  currentLocationId: string;
  taskSlugs: string[];
  project: ProjectState;
  tasks: Task[];
  completedActionIds?: string[];
}): { taskSlug: string; taskTitle: string; actions: ResolvedNpcTaskAction[] }[] {
  const activeSlugs = new Set(
    params.tasks
      .filter((task) => task.status === "PENDING" || task.status === "IN_PROGRESS")
      .map((task) => task.templateId),
  );

  const configuredSlugs = NPC_TASK_REQUIREMENTS.map((item) => item.taskSlug);

  return configuredSlugs
    .filter((taskSlug) => params.taskSlugs.includes(taskSlug) && activeSlugs.has(taskSlug))
    .map((taskSlug) => {
      const actions = resolveNpcTaskActionsForTask({
        taskSlug,
        currentLocationId: params.currentLocationId,
        project: params.project,
        tasks: params.tasks,
        completedActionIds: params.completedActionIds,
      });
      if (actions.length === 0) return undefined;
      return {
        taskSlug,
        taskTitle: actions[0]?.taskTitle ?? taskSlug,
        actions,
      };
    })
    .filter(Boolean) as { taskSlug: string; taskTitle: string; actions: ResolvedNpcTaskAction[] }[];
}
