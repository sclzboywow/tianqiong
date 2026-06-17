import type {
  StoryEntryData,
  StoryEntryStatus,
  StoryEntryType,
} from "./types";
import type { ProjectStageId } from "./projectStages";

export type { StoryEntryData, StoryEntryStatus, StoryEntryType };

function mapPayloadDoc(doc: Record<string, unknown>): StoryEntryData {
  return {
    slug: String(doc.slug || ""),
    title: String(doc.title || ""),
    description: doc.description ? String(doc.description) : undefined,
    storyType: (doc.storyType as StoryEntryType) || "task_story",
    status: (doc.status as StoryEntryStatus) || "draft",
    inkFile: String(doc.inkFile || ""),
    compiledFile: doc.compiledFile ? String(doc.compiledFile) : undefined,
    startKnot: doc.startKnot ? String(doc.startKnot) : undefined,
    stage: doc.stage ? (doc.stage as ProjectStageId) : undefined,
    relatedLocationSlugs:
      (doc.relatedLocationSlugs as { slug: string }[] | null)
        ?.map((item) => item.slug)
        .filter(Boolean) || [],
    relatedTaskSlugs:
      (doc.relatedTaskSlugs as { slug: string }[] | null)
        ?.map((item) => item.slug)
        .filter(Boolean) || [],
    relatedEventSlugs:
      (doc.relatedEventSlugs as { slug: string }[] | null)
        ?.map((item) => item.slug)
        .filter(Boolean) || [],
    relatedNpcNames:
      (doc.relatedNpcNames as { name: string }[] | null)
        ?.map((item) => item.name)
        .filter(Boolean) || [],
    tags: (doc.tags as { tag: string }[] | null)?.map((item) => item.tag).filter(Boolean) || [],
    previewText: doc.previewText ? String(doc.previewText) : undefined,
    estimatedMinutes: doc.estimatedMinutes as number | undefined,
    sortOrder: doc.sortOrder as number | undefined,
    enabled: doc.enabled !== false,
    payloadDocId: doc.id as string | number,
  };
}

let cachedEntries: StoryEntryData[] | null = null;

export async function getStoryEntries(): Promise<StoryEntryData[]> {
  if (cachedEntries) return cachedEntries;
  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "story-entries",
      where: { enabled: { equals: true } },
      limit: 500,
      sort: "sortOrder",
    });
    cachedEntries = result.docs
      .map((doc) => mapPayloadDoc(doc as Record<string, unknown>))
      .filter((entry) => entry.slug.trim().length > 0);
    return cachedEntries;
  } catch {
    return [];
  }
}

export async function getStoryEntryBySlug(slug: string): Promise<StoryEntryData | null> {
  const entries = await getStoryEntries();
  return entries.find((entry) => entry.slug === slug) ?? null;
}

export async function resolveInkFileFromStorySlug(
  storySlug?: string,
  fallbackInkFile?: string,
): Promise<string | null> {
  if (storySlug?.trim()) {
    const entry = await getStoryEntryBySlug(storySlug.trim());
    if (entry?.inkFile) return entry.inkFile;
    return null;
  }
  return fallbackInkFile?.trim() || null;
}

export function clearStoryEntryCache() {
  cachedEntries = null;
}
