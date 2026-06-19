import type { ArtifactDefinitionData, ArtifactStatusEntry } from "./types";
import {
  ARTIFACT_DEFINITIONS,
  getStaticArtifactDefinitionBySlug,
  resolveAllowedStatuses,
} from "@/data/artifactDefinitions";
import type { ArtifactType } from "./types";
import type { ProjectStageId } from "./projectStages";

const ARTIFACT_TYPE_VALUES = new Set<ArtifactType>([
  "document",
  "deliverable",
  "permit",
  "report",
  "decision",
  "asset",
]);

function mapAllowedStatuses(raw: unknown): ArtifactStatusEntry[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const entries: ArtifactStatusEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { status?: string; label?: string };
    if (!row.status?.trim()) continue;
    entries.push({ status: row.status.trim(), label: row.label?.trim() });
  }
  return entries.length > 0 ? entries : undefined;
}

function normalizeDefinition(definition: ArtifactDefinitionData): ArtifactDefinitionData {
  return {
    ...definition,
    defaultStatus: definition.defaultStatus || "draft",
    allowedStatuses: resolveAllowedStatuses(definition),
  };
}

function mapPayloadDoc(doc: Record<string, unknown>): ArtifactDefinitionData {
  const raw: ArtifactDefinitionData = {
    slug: String(doc.slug || ""),
    name: String(doc.name || ""),
    artifactType: (ARTIFACT_TYPE_VALUES.has(doc.artifactType as ArtifactType)
      ? doc.artifactType
      : "document") as ArtifactType,
    stage: doc.stage ? (String(doc.stage) as ProjectStageId) : undefined,
    description: doc.description ? String(doc.description) : undefined,
    reusable: Boolean(doc.reusable),
    versioned: doc.versioned !== false,
    expires: doc.expires === null || doc.expires === undefined ? 0 : Number(doc.expires),
    defaultStatus: doc.defaultStatus ? String(doc.defaultStatus) : "draft",
    allowedStatuses: mapAllowedStatuses(doc.allowedStatuses),
    sourceNpcNames:
      (doc.sourceNpcNames as { name: string }[] | null)?.map((item) => item.name).filter(Boolean) ||
      [],
    sourceLocationSlugs:
      (doc.sourceLocationSlugs as { slug: string }[] | null)
        ?.map((item) => item.slug)
        .filter(Boolean) || [],
    tags: (doc.tags as { tag: string }[] | null)?.map((item) => item.tag).filter(Boolean) || [],
    enabled: doc.enabled !== false,
    payloadDocId: doc.id as string | number,
  };
  return normalizeDefinition(raw);
}

let cachedDefinitions: ArtifactDefinitionData[] | null = null;

export function clearArtifactDefinitionCache() {
  cachedDefinitions = null;
}

export async function loadArtifactDefinitions(): Promise<ArtifactDefinitionData[]> {
  if (cachedDefinitions) return cachedDefinitions;

  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "artifact-definitions",
      where: { enabled: { equals: true } },
      limit: 500,
    });

    if (result.docs.length === 0) {
      cachedDefinitions = ARTIFACT_DEFINITIONS.map(normalizeDefinition);
      return cachedDefinitions;
    }

    cachedDefinitions = result.docs
      .map((doc) => mapPayloadDoc(doc as Record<string, unknown>))
      .filter((item) => item.slug.trim().length > 0);
    return cachedDefinitions;
  } catch {
    cachedDefinitions = ARTIFACT_DEFINITIONS.map(normalizeDefinition);
    return cachedDefinitions;
  }
}

export async function getArtifactDefinitionBySlug(
  slug: string,
): Promise<ArtifactDefinitionData | undefined> {
  const definitions = await loadArtifactDefinitions();
  const found = definitions.find((item) => item.slug === slug);
  if (found) return found;
  const fallback = getStaticArtifactDefinitionBySlug(slug);
  return fallback ? normalizeDefinition(fallback) : undefined;
}
