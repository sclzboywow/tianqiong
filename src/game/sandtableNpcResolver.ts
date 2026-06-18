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

export type { LocationNpcRole };

export type SandtableNpcRef = {
  npcId: string;
  name: string;
  title: string;
  level: NpcLevel;
  role: LocationNpcRole;
  agenda?: string;
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

function sortNpcRefs(refs: SandtableNpcRef[]): SandtableNpcRef[] {
  return [...refs].sort((a, b) => {
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
}): { relatedNpcs: SandtableNpcRef[]; relatedNpcNames: string[] } {
  const { locationId, regionId, fallbackNpcNames = [] } = params;
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

  const relatedNpcs = sortNpcRefs(dedupeRefs(refs));
  const relatedNpcNames = relatedNpcs.map((ref) => ref.name);

  return { relatedNpcs, relatedNpcNames };
}
