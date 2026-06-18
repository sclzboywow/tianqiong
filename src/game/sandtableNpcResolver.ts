import type { ProjectState, Task } from "@prisma/client";
import type { LocationRegionId } from "./locationSandtablePresentationEngine";
import {
  getNpcProfileById,
  LEGACY_NPC_NAME_ALIASES,
  type NpcLevel,
} from "@/data/npcProfiles";
import {
  getNpcAssignmentsByLocationId,
  type LocationNpcRole,
} from "@/data/locationNpcAssignments";
import { getDefaultNpcIdsByRegion } from "@/data/regionNpcDefaults";
import { tryResolveNpcPresence, type NpcPresenceStatus } from "./npcPresenceResolver";

export type { LocationNpcRole, NpcPresenceStatus };

export type SandtableNpcRef = {
  npcId: string;
  name: string;
  title: string;
  level: NpcLevel;
  role: LocationNpcRole;
  agenda?: string;
  presenceStatus?: NpcPresenceStatus;
  currentLocationId?: string;
  homeLocationId?: string;
  presenceReason?: string;
  presenceHint?: string;
};

export const NPC_ROLE_LABELS: Record<LocationNpcRole, string> = {
  primary: "主责",
  support: "协同",
  regulator: "监管",
  blocker: "阻力",
  temporary: "临时",
};

const LEVEL_ORDER: Record<NpcLevel, number> = {
  S: 0,
  A: 1,
  B: 2,
  C: 3,
};

const ROLE_ORDER: Record<LocationNpcRole, number> = {
  primary: 0,
  regulator: 1,
  support: 2,
  blocker: 3,
  temporary: 4,
};

const PRESENCE_ORDER: Record<NpcPresenceStatus, number> = {
  present: 0,
  reachable: 1,
  away: 2,
  locked: 3,
};

function slugifyLegacyName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w\u4e00-\u9fff-]/g, "")
    .toLowerCase();
}

function profileToRef(
  npcId: string,
  role: LocationNpcRole,
  levelOverride?: NpcLevel,
): SandtableNpcRef | undefined {
  const profile = getNpcProfileById(npcId);
  if (!profile) return undefined;

  return {
    npcId: profile.id,
    name: profile.name,
    title: profile.title,
    level: levelOverride ?? profile.level,
    role,
    agenda: profile.agenda,
  };
}

function fallbackNameToRef(name: string): SandtableNpcRef {
  const aliasId = LEGACY_NPC_NAME_ALIASES[name];
  if (aliasId) {
    const fromAlias = profileToRef(aliasId, "support");
    if (fromAlias) return fromAlias;
  }

  const slug = slugifyLegacyName(name) || "unknown";
  return {
    npcId: `legacy_${slug}`,
    name,
    title: name,
    level: "C",
    role: "support",
  };
}

function applyPresence(
  ref: SandtableNpcRef,
  params: {
    locationId: string;
    project: ProjectState;
    tasks: Task[];
    activeEventSlugs?: string[];
  },
): SandtableNpcRef {
  const presence = tryResolveNpcPresence({
    npcId: ref.npcId,
    currentLocationId: params.locationId,
    project: params.project,
    tasks: params.tasks,
    activeEventSlugs: params.activeEventSlugs,
  });

  if (!presence) return ref;

  return {
    ...ref,
    presenceStatus: presence.status,
    currentLocationId: presence.currentLocationId,
    homeLocationId: presence.homeLocationId,
    presenceReason: presence.reason,
    presenceHint: presence.hint,
  };
}

function sortNpcRefs(refs: SandtableNpcRef[]): SandtableNpcRef[] {
  return [...refs].sort((a, b) => {
    const presenceA = a.presenceStatus ? PRESENCE_ORDER[a.presenceStatus] : 99;
    const presenceB = b.presenceStatus ? PRESENCE_ORDER[b.presenceStatus] : 99;
    if (presenceA !== presenceB) return presenceA - presenceB;

    const levelDiff = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
    if (levelDiff !== 0) return levelDiff;
    return ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
  });
}

function dedupeRefs(refs: SandtableNpcRef[]): SandtableNpcRef[] {
  const seen = new Set<string>();
  const result: SandtableNpcRef[] = [];
  for (const ref of refs) {
    const key = `${ref.npcId}-${ref.role}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(ref);
  }
  return result;
}

export function buildSandtableNpcRefs(params: {
  locationId: string;
  regionId: LocationRegionId;
  zoneId: string;
  fallbackNpcNames?: string[];
  project?: ProjectState;
  tasks?: Task[];
  activeEventSlugs?: string[];
}): { relatedNpcs: SandtableNpcRef[]; relatedNpcNames: string[] } {
  const { locationId, regionId, fallbackNpcNames = [], project, tasks, activeEventSlugs } = params;
  let refs: SandtableNpcRef[] = [];

  const assignments = getNpcAssignmentsByLocationId(locationId);
  if (assignments.length > 0) {
    refs = assignments
      .map((assignment) => profileToRef(assignment.npcId, assignment.role, assignment.level))
      .filter(Boolean) as SandtableNpcRef[];
  } else {
    const defaultIds = getDefaultNpcIdsByRegion(regionId);
    refs = defaultIds
      .map((npcId) => profileToRef(npcId, "support"))
      .filter(Boolean) as SandtableNpcRef[];
  }

  if (refs.length === 0 && fallbackNpcNames.length > 0) {
    refs = fallbackNpcNames.map(fallbackNameToRef);
  }

  if (project && tasks) {
    refs = refs.map((ref) =>
      applyPresence(ref, { locationId, project, tasks, activeEventSlugs }),
    );
  }

  const relatedNpcs = sortNpcRefs(dedupeRefs(refs));
  const relatedNpcNames = relatedNpcs.map((ref) => ref.name);

  return { relatedNpcs, relatedNpcNames };
}

export function countNpcPresence(npcs: SandtableNpcRef[]): {
  presentNpcCount: number;
  reachableNpcCount: number;
  awayNpcCount: number;
} {
  let presentNpcCount = 0;
  let reachableNpcCount = 0;
  let awayNpcCount = 0;

  for (const npc of npcs) {
    if (npc.presenceStatus === "present") presentNpcCount += 1;
    else if (npc.presenceStatus === "reachable") reachableNpcCount += 1;
    else if (npc.presenceStatus === "away") awayNpcCount += 1;
  }

  return { presentNpcCount, reachableNpcCount, awayNpcCount };
}
