import type { ProjectState, Task } from "@prisma/client";
import { getNpcProfileById } from "@/data/npcProfiles";
import { getNpcPresenceRule } from "@/data/npcPresenceRules";
import {
  getNpcTaskRequirement,
  NPC_TASK_REQUIREMENTS,
  type NpcTaskRequirement,
} from "@/data/npcTaskRequirements";
import { getLocationDisplayNameById } from "./locationDisplayName";
import { tryResolveNpcPresence, type NpcPresenceStatus } from "./npcPresenceResolver";

export type { NpcTaskRequirement };

export type ResolvedNpcTaskRequirement = {
  taskSlug: string;
  taskTitle: string;
  locationId: string;
  canProgress: boolean;
  primaryNpcId: string;
  primaryNpcName: string;
  primaryStatus?: NpcPresenceStatus;
  missingNpcIds: string[];
  reachableNpcIds: string[];
  presentNpcIds: string[];
  message: string;
  hintWhenBlocked?: string;
};

const PRESENCE_LABELS: Record<NpcPresenceStatus, string> = {
  present: "在场",
  reachable: "可联络",
  away: "不在场",
  locked: "未解锁",
};

type PresenceRequirement = NpcPresenceStatus | "reachable" | "any";

function satisfiesPresence(
  status: NpcPresenceStatus | undefined,
  required: PresenceRequirement,
  hasRule: boolean,
): boolean {
  if (!hasRule) return true;
  if (required === "any") return true;
  if (!status) return false;
  if (required === "reachable") return status === "present" || status === "reachable";
  return status === required;
}

function getNpcName(npcId: string): string {
  return getNpcProfileById(npcId)?.name ?? npcId;
}

function formatSupportSummary(
  npcIds: string[],
  statuses: Map<string, NpcPresenceStatus | undefined>,
): string {
  if (npcIds.length === 0) return "";
  return npcIds
    .map((npcId) => {
      const name = getNpcName(npcId);
      const status = statuses.get(npcId);
      if (!status) return `${name}（相关）`;
      return `${name}${PRESENCE_LABELS[status]}`;
    })
    .join("、");
}

function buildProgressMessage(params: {
  requirement: NpcTaskRequirement;
  atCompletionLocation: boolean;
  primaryOk: boolean;
  primaryStatus?: NpcPresenceStatus;
  primaryHint?: string;
  supportSummary: string;
  canProgress: boolean;
}): string {
  const { requirement, atCompletionLocation, primaryOk, primaryStatus, primaryHint, supportSummary, canProgress } =
    params;

  if (canProgress) {
    return `主责 NPC 已到位，协同人员可联络，可推进任务。${supportSummary ? `协同：${supportSummary}` : ""}`;
  }

  if (!atCompletionLocation) {
    const target = getLocationDisplayNameById(requirement.locationId);
    return `此任务需在${target}推进。${requirement.hintWhenBlocked ?? ""}`;
  }

  const primaryName = getNpcName(requirement.primaryNpcId);
  const parts: string[] = [];

  if (!primaryOk && primaryStatus) {
    if (primaryStatus === "away") {
      parts.push(`需要找：${primaryName}。当前不在场`);
      if (primaryHint) parts.push(primaryHint);
    } else if (primaryStatus === "reachable") {
      parts.push(`需要找：${primaryName}。当前可联络，但需到场`);
    } else if (primaryStatus === "locked") {
      parts.push(`${primaryName}尚未解锁`);
    } else {
      parts.push(`需要找：${primaryName}。状态：${PRESENCE_LABELS[primaryStatus]}`);
    }
  }

  if (supportSummary) {
    parts.push(`协同：${supportSummary}`);
  }

  if (requirement.hintWhenBlocked) {
    parts.push(`建议：${requirement.hintWhenBlocked}`);
  }

  return parts.join("。");
}

export function resolveNpcTaskRequirement(params: {
  taskSlug: string;
  currentLocationId: string;
  project: ProjectState;
  tasks: Task[];
  activeEventSlugs?: string[];
}): ResolvedNpcTaskRequirement | undefined {
  const requirement = getNpcTaskRequirement(params.taskSlug);
  if (!requirement) return undefined;

  const displayLocations = [
    requirement.locationId,
    ...(requirement.hintLocationIds ?? []),
  ];
  if (!displayLocations.includes(params.currentLocationId)) {
    return undefined;
  }

  const presenceParams = {
    currentLocationId: params.currentLocationId,
    project: params.project,
    tasks: params.tasks,
    activeEventSlugs: params.activeEventSlugs,
  };

  const primaryPresence = tryResolveNpcPresence({
    ...presenceParams,
    npcId: requirement.primaryNpcId,
  });
  const hasPrimaryRule = Boolean(getNpcPresenceRule(requirement.primaryNpcId));
  const primaryRequired = requirement.requiredPrimaryPresence ?? "present";
  const primaryOk = satisfiesPresence(
    primaryPresence?.status,
    primaryRequired,
    hasPrimaryRule,
  );

  const supportIds = requirement.supportNpcIds ?? [];
  const supportRequired = requirement.requiredSupportPresence ?? "reachable";
  const supportStatuses = new Map<string, NpcPresenceStatus | undefined>();
  const missingNpcIds: string[] = [];
  const reachableNpcIds: string[] = [];
  const presentNpcIds: string[] = [];
  let supportAllOk = true;

  for (const npcId of supportIds) {
    const presence = tryResolveNpcPresence({ ...presenceParams, npcId });
    const hasRule = Boolean(getNpcPresenceRule(npcId));
    supportStatuses.set(npcId, presence?.status);

    if (presence?.status === "present") presentNpcIds.push(npcId);
    else if (presence?.status === "reachable") reachableNpcIds.push(npcId);

    if (!satisfiesPresence(presence?.status, supportRequired, hasRule)) {
      supportAllOk = false;
      missingNpcIds.push(npcId);
    }
  }

  if (primaryPresence?.status === "present") {
    presentNpcIds.unshift(requirement.primaryNpcId);
  } else if (primaryPresence?.status === "reachable") {
    reachableNpcIds.unshift(requirement.primaryNpcId);
  } else if (!primaryOk && hasPrimaryRule) {
    missingNpcIds.unshift(requirement.primaryNpcId);
  }

  const atCompletionLocation = params.currentLocationId === requirement.locationId;
  const canProgress = atCompletionLocation && primaryOk && supportAllOk;

  const taskTitle =
    requirement.taskTitle ??
    requirement.taskSlug;

  return {
    taskSlug: requirement.taskSlug,
    taskTitle,
    locationId: requirement.locationId,
    canProgress,
    primaryNpcId: requirement.primaryNpcId,
    primaryNpcName: getNpcName(requirement.primaryNpcId),
    primaryStatus: primaryPresence?.status,
    missingNpcIds: [...new Set(missingNpcIds)],
    reachableNpcIds: [...new Set(reachableNpcIds)],
    presentNpcIds: [...new Set(presentNpcIds)],
    hintWhenBlocked: requirement.hintWhenBlocked,
    message: buildProgressMessage({
      requirement,
      atCompletionLocation,
      primaryOk,
      primaryStatus: primaryPresence?.status,
      primaryHint: primaryPresence?.hint,
      supportSummary: formatSupportSummary(supportIds, supportStatuses),
      canProgress,
    }),
  };
}

export function resolveNpcTaskRequirementsForLocation(params: {
  currentLocationId: string;
  taskSlugs: string[];
  project: ProjectState;
  tasks: Task[];
  activeEventSlugs?: string[];
}): ResolvedNpcTaskRequirement[] {
  const activeSlugs = new Set(
    params.tasks
      .filter((task) => task.status === "PENDING" || task.status === "IN_PROGRESS")
      .map((task) => task.templateId),
  );

  return NPC_TASK_REQUIREMENTS.filter((requirement) => {
    if (!params.taskSlugs.includes(requirement.taskSlug)) return false;
    if (!activeSlugs.has(requirement.taskSlug)) return false;
    const displayLocations = [
      requirement.locationId,
      ...(requirement.hintLocationIds ?? []),
    ];
    return displayLocations.includes(params.currentLocationId);
  })
    .map((requirement) =>
      resolveNpcTaskRequirement({
        taskSlug: requirement.taskSlug,
        currentLocationId: params.currentLocationId,
        project: params.project,
        tasks: params.tasks,
        activeEventSlugs: params.activeEventSlugs,
      }),
    )
    .filter(Boolean) as ResolvedNpcTaskRequirement[];
}

export function getNpcTaskRequirementBySlug(taskSlug: string): NpcTaskRequirement | undefined {
  return getNpcTaskRequirement(taskSlug);
}
