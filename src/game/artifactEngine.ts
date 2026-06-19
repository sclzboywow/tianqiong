import type { ProjectArtifact } from "@prisma/client";
import { prisma } from "@/prisma/client";
import type {
  ArtifactDefinitionData,
  ArtifactEffect,
  ProjectArtifactRecord,
} from "./types";
import { getArtifactDefinitionBySlug, loadArtifactDefinitions } from "./artifactLoader";
import { formatAllowedStatusLabel, resolveAllowedStatuses } from "@/data/artifactDefinitions";

export type ArtifactLogSource = {
  sourceType: "task" | "event" | "system";
  sourceId?: string;
  note?: string;
};

export function getStatusOrdinal(definition: ArtifactDefinitionData, status: string): number {
  const statuses = resolveAllowedStatuses(definition).map((item) => item.status);
  const index = statuses.indexOf(status);
  return index >= 0 ? index : -1;
}

export function isStatusAtLeast(
  definition: ArtifactDefinitionData,
  actual: string | null | undefined,
  minRequired?: string,
): boolean {
  const required = minRequired || definition.defaultStatus || "draft";
  if (!actual) return false;
  const actualOrd = getStatusOrdinal(definition, actual);
  const requiredOrd = getStatusOrdinal(definition, required);
  if (actualOrd < 0 || requiredOrd < 0) return actual === required;
  return actualOrd >= requiredOrd;
}

function parseMetadata(raw: string | null): Record<string, unknown> | undefined {
  if (!raw?.trim()) return undefined;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function toRecord(row: ProjectArtifact): ProjectArtifactRecord {
  return {
    id: row.id,
    seasonId: row.seasonId,
    artifactSlug: row.artifactSlug,
    status: row.status,
    version: row.version,
    metadata: parseMetadata(row.metadata),
    producedAt: row.producedAt,
    updatedAt: row.updatedAt,
    expiresAt: row.expiresAt,
  };
}

export async function getProjectArtifacts(seasonId: string): Promise<Map<string, ProjectArtifactRecord>> {
  const rows = await prisma.projectArtifact.findMany({ where: { seasonId } });
  const map = new Map<string, ProjectArtifactRecord>();
  for (const row of rows) {
    map.set(row.artifactSlug, toRecord(row));
  }
  return map;
}

export async function getArtifactStatus(seasonId: string, slug: string): Promise<string | null> {
  const row = await prisma.projectArtifact.findUnique({
    where: { seasonId_artifactSlug: { seasonId, artifactSlug: slug } },
  });
  return row?.status ?? null;
}

export async function writeArtifactLog(params: {
  seasonId: string;
  artifactSlug: string;
  fromStatus?: string | null;
  toStatus: string;
  source: ArtifactLogSource;
}) {
  await prisma.projectArtifactLog.create({
    data: {
      seasonId: params.seasonId,
      artifactSlug: params.artifactSlug,
      fromStatus: params.fromStatus ?? null,
      toStatus: params.toStatus,
      sourceType: params.source.sourceType,
      sourceId: params.source.sourceId,
      note: params.source.note,
    },
  });
}

function resolveExpiresAt(definition: ArtifactDefinitionData | undefined): Date | null {
  const days = definition?.expires ?? 0;
  if (!days || days <= 0) return null;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}

export async function upsertArtifactStatus(
  seasonId: string,
  slug: string,
  status: string,
  opts?: {
    source?: ArtifactLogSource;
    metadata?: Record<string, unknown>;
    versionBump?: boolean;
  },
): Promise<ProjectArtifactRecord> {
  const definition = await getArtifactDefinitionBySlug(slug);
  if (!definition) {
    throw new Error(`成果物定义不存在: ${slug}`);
  }

  const allowed = resolveAllowedStatuses(definition).map((item) => item.status);
  if (!allowed.includes(status)) {
    throw new Error(`成果物 ${slug} 不允许状态 ${status}`);
  }

  const existing = await prisma.projectArtifact.findUnique({
    where: { seasonId_artifactSlug: { seasonId, artifactSlug: slug } },
  });

  if (existing && !definition.reusable && existing.status === status) {
    return toRecord(existing);
  }

  const fromStatus = existing?.status ?? null;
  const statusChanged = fromStatus !== status;
  let nextVersion = existing?.version ?? 1;
  if (existing && statusChanged && (opts?.versionBump || definition.versioned)) {
    nextVersion = existing.version + 1;
  } else if (!existing) {
    nextVersion = 1;
  }

  const metadataJson = opts?.metadata ? JSON.stringify(opts.metadata) : existing?.metadata ?? null;
  const expiresAt = resolveExpiresAt(definition);

  const row = existing
    ? await prisma.projectArtifact.update({
        where: { id: existing.id },
        data: {
          status,
          version: nextVersion,
          metadata: metadataJson,
          expiresAt: expiresAt ?? existing.expiresAt,
        },
      })
    : await prisma.projectArtifact.create({
        data: {
          seasonId,
          artifactSlug: slug,
          status,
          version: 1,
          metadata: metadataJson,
          expiresAt,
        },
      });

  if (fromStatus !== status) {
    await writeArtifactLog({
      seasonId,
      artifactSlug: slug,
      fromStatus,
      toStatus: status,
      source: opts?.source ?? { sourceType: "system" },
    });
  }

  return toRecord(row);
}

export async function applyArtifactEffects(
  seasonId: string,
  effects: ArtifactEffect[] | undefined,
  source: ArtifactLogSource,
): Promise<ProjectArtifactRecord[]> {
  if (!effects?.length) return [];

  const applied: ProjectArtifactRecord[] = [];
  for (const effect of effects) {
    if (!effect.artifactSlug?.trim()) continue;
    const record = await upsertArtifactStatus(seasonId, effect.artifactSlug, effect.status, {
      source,
      metadata: effect.metadata,
      versionBump: effect.versionBump,
    });
    applied.push(record);
  }
  return applied;
}

export async function getArtifactStatusLabel(slug: string, status: string | null): Promise<string> {
  if (!status) return "未产出";
  const definition = await getArtifactDefinitionBySlug(slug);
  if (!definition) return status;
  return formatAllowedStatusLabel(definition, status);
}

export async function buildArtifactStatusMap(seasonId: string): Promise<Record<string, string | null>> {
  const artifacts = await getProjectArtifacts(seasonId);
  const map: Record<string, string | null> = {};
  const definitions = await loadArtifactDefinitions();
  for (const def of definitions) {
    map[def.slug] = artifacts.get(def.slug)?.status ?? null;
  }
  return map;
}
