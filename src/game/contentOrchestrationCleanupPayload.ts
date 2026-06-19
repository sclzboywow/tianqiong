export type CleanupPayloadRecord = {
  id?: string | number;
  slug: string;
  enabled: boolean;
  category?: string;
};

export type OrchestrationCleanupPayload = {
  taskTemplates: CleanupPayloadRecord[];
  eventTemplates: CleanupPayloadRecord[];
  storyEntries: CleanupPayloadRecord[];
  locationActions: CleanupPayloadRecord[];
};

export type OrchestrationCleanupPayloadResult = {
  payload: OrchestrationCleanupPayload;
  payloadCheckAvailable: boolean;
};

const PAYLOAD_LIMIT = 1000;

const EMPTY_PAYLOAD: OrchestrationCleanupPayload = {
  taskTemplates: [],
  eventTemplates: [],
  storyEntries: [],
  locationActions: [],
};

function mapEnabled(doc: Record<string, unknown>): boolean {
  const value = doc.enabled;
  if (value === false || value === 0) return false;
  return true;
}

function mapTaskRecord(doc: Record<string, unknown>): CleanupPayloadRecord | null {
  const slug = doc.slug;
  if (!slug) return null;
  return {
    id: doc.id as string | number | undefined,
    slug: String(slug),
    enabled: mapEnabled(doc),
    category: doc.category ? String(doc.category) : undefined,
  };
}

function mapSlugRecord(doc: Record<string, unknown>): CleanupPayloadRecord | null {
  const slug = doc.slug;
  if (!slug) return null;
  return {
    id: doc.id as string | number | undefined,
    slug: String(slug),
    enabled: mapEnabled(doc),
  };
}

async function loadFallbackPayload(): Promise<OrchestrationCleanupPayload> {
  const { getTaskTemplates } = await import("./contentLoader");
  const { getEventTemplates } = await import("./eventTemplateLoader");
  const { getStoryEntries } = await import("./storyEntryLoader");
  const { getLocationActions } = await import("./locationActionLoader");

  const [taskTemplates, eventTemplates, storyEntries, locationActions] = await Promise.all([
    getTaskTemplates(),
    getEventTemplates(),
    getStoryEntries(),
    getLocationActions(),
  ]);

  return {
    taskTemplates: taskTemplates.map((doc) => ({
      slug: doc.slug,
      enabled: true,
      category: doc.category,
    })),
    eventTemplates: eventTemplates
      .filter((doc) => doc.slug)
      .map((doc) => ({
        slug: String(doc.slug),
        enabled: doc.enabled ?? true,
      })),
    storyEntries: storyEntries.map((doc) => ({
      slug: doc.slug,
      enabled: doc.enabled ?? true,
    })),
    locationActions: locationActions.map((doc) => ({
      slug: doc.id,
      enabled: true,
    })),
  };
}

/** 直接从 Payload 拉取 cleanup 所需全量 slug（含 disabled），不走 enabled=true 的通用 content loaders。 */
export async function loadOrchestrationCleanupPayload(): Promise<OrchestrationCleanupPayloadResult> {
  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });

    const [tasks, events, stories, actions] = await Promise.all([
      payload.find({ collection: "task-templates", limit: PAYLOAD_LIMIT, depth: 0 }),
      payload.find({ collection: "event-templates", limit: PAYLOAD_LIMIT, depth: 0 }),
      payload.find({ collection: "story-entries", limit: PAYLOAD_LIMIT, depth: 0 }),
      payload.find({ collection: "location-actions", limit: PAYLOAD_LIMIT, depth: 0 }),
    ]);

    return {
      payloadCheckAvailable: true,
      payload: {
        taskTemplates: tasks.docs
          .map((doc) => mapTaskRecord(doc as Record<string, unknown>))
          .filter((row): row is CleanupPayloadRecord => row != null),
        eventTemplates: events.docs
          .map((doc) => mapSlugRecord(doc as Record<string, unknown>))
          .filter((row): row is CleanupPayloadRecord => row != null),
        storyEntries: stories.docs
          .map((doc) => mapSlugRecord(doc as Record<string, unknown>))
          .filter((row): row is CleanupPayloadRecord => row != null),
        locationActions: actions.docs
          .map((doc) => mapSlugRecord(doc as Record<string, unknown>))
          .filter((row): row is CleanupPayloadRecord => row != null),
      },
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[orchestration-cleanup] Payload cleanup check unavailable, falling back to enabled-only loaders",
        error,
      );
    }
    try {
      return {
        payloadCheckAvailable: false,
        payload: await loadFallbackPayload(),
      };
    } catch (fallbackError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[orchestration-cleanup] Fallback loaders also failed", fallbackError);
      }
      return {
        payloadCheckAvailable: false,
        payload: EMPTY_PAYLOAD,
      };
    }
  }
}
