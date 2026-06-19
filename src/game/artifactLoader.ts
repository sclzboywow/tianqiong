import { ARTIFACT_DEFINITIONS, getStaticArtifactDefinitionBySlug } from "@/data/artifactDefinitions";
import type { ArtifactDefinitionData, ArtifactStatusEntry, ArtifactType } from "./types";
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

function mapPayloadDoc(doc: Record<string, unknown>): ArtifactDefinitionData {
  return {
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
}

let cachedDefinitions: ArtifactDefinitionData[] | null = null;

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
      cachedDefinitions = ARTIFACT_DEFINITIONS;
      return cachedDefinitions;
    }

    cachedDefinitions = result.docs
      .map((doc) => mapPayloadDoc(doc as Record<string, unknown>))
      .filter((item) => item.slug.trim().length > 0);
    return cachedDefinitions;
  } catch {
    cachedDefinitions = ARTIFACT_DEFINITIONS;
    return cachedDefinitions;
  }
}

export async function getArtifactDefinitionBySlug(
  slug: string,
): Promise<ArtifactDefinitionData | undefined> {
  const definitions = await loadArtifactDefinitions();
  return definitions.find((item) => item.slug === slug) ?? getStaticArtifactDefinitionBySlug(slug);
}

export function clearArtifactDefinitionCache() {
  cachedDefinitions = null;
}
