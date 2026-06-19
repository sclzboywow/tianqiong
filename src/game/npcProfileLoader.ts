import {
  NPC_PROFILES,
  setRuntimeNpcProfileOverrides,
  type NpcFaction,
  type NpcLevel,
  type NpcProfile,
} from "@/data/npcProfiles";
import type { LocationRegionId } from "./locationSandtablePresentationEngine";

function readArrayItems(
  value: unknown,
  key: "item" | "tag",
): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((row) => (row as Record<string, unknown>)?.[key])
    .filter((item): item is string => typeof item === "string" && item.length > 0);
  return items.length > 0 ? items : undefined;
}

function mapPayloadDocToNpcProfile(
  doc: Record<string, unknown>,
  base?: NpcProfile,
): NpcProfile | undefined {
  const id = (doc.slug as string) || base?.id;
  if (!id) return undefined;

  const name = (doc.name as string) || base?.name;
  if (!name) return undefined;

  return {
    id,
    excelId: (doc.excelId as string) || base?.excelId || "",
    name,
    title: (doc.title as string) || base?.title || "",
    organization: (doc.organization as string) || base?.organization || "",
    faction: ((doc.faction as NpcFaction) || base?.faction || "other") as NpcFaction,
    level: ((doc.level as NpcLevel) || base?.level || "C") as NpcLevel,
    residentRegion: (doc.residentRegion as string) || base?.residentRegion || "",
    sandtableRegionId:
      (doc.sandtableRegionId as LocationRegionId | undefined) || base?.sandtableRegionId,
    description: (doc.description as string) || base?.description || "",
    personality: (doc.personality as string) || base?.personality,
    agenda: (doc.agenda as string) || base?.agenda,
    helpsWith: readArrayItems(doc.helpsWith, "item") ?? base?.helpsWith,
    blocksWhen: readArrayItems(doc.blocksWhen, "item") ?? base?.blocksWhen,
    riskTags: readArrayItems(doc.riskTags, "tag") ?? base?.riskTags,
    appearStages: base?.appearStages,
    payloadCategory: (doc.category as string) || base?.payloadCategory || "",
    payloadType: (doc.type as string) || base?.payloadType || "",
  };
}

function mergeStaticWithPayloadDocs(docs: Record<string, unknown>[]): Record<string, NpcProfile> {
  const merged = new Map<string, NpcProfile>();
  for (const profile of NPC_PROFILES) {
    merged.set(profile.id, { ...profile });
  }

  for (const doc of docs) {
    const slug = doc.slug as string | undefined;
    if (!slug) continue;
    const profile = mapPayloadDocToNpcProfile(doc, merged.get(slug));
    if (profile) merged.set(slug, profile);
  }

  return Object.fromEntries(merged);
}

function computeRevisionFromDocs(docs: Record<string, unknown>[]): string {
  let maxUpdated = 0;
  for (const doc of docs) {
    const raw = doc.updatedAt;
    if (!raw) continue;
    const ts = new Date(raw as string).getTime();
    if (Number.isFinite(ts) && ts > maxUpdated) maxUpdated = ts;
  }
  return `${docs.length}-${maxUpdated}`;
}

function staticOnlyRecord(): Record<string, NpcProfile> {
  return Object.fromEntries(NPC_PROFILES.map((profile) => [profile.id, { ...profile }]));
}

async function fetchPayloadNpcDocs(): Promise<Record<string, unknown>[]> {
  const { getPayload } = await import("payload");
  const config = (await import("@payload-config")).default;
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "npcs",
    where: { enabled: { equals: true } },
    limit: 300,
  });
  return result.docs as Record<string, unknown>[];
}

async function loadNpcProfilesFromPayload(): Promise<{
  profiles: Record<string, NpcProfile>;
  revision: string;
}> {
  try {
    const docs = await fetchPayloadNpcDocs();
    const profiles = mergeStaticWithPayloadDocs(docs);
    return { profiles, revision: computeRevisionFromDocs(docs) };
  } catch {
    const profiles = staticOnlyRecord();
    return { profiles, revision: "static-0" };
  }
}

/** 必须先于沙盘构建调用，确保 getNpcProfileById 读到 Payload 合并结果 */
export async function ensureMergedNpcProfiles(): Promise<{
  profiles: Record<string, NpcProfile>;
  revision: string;
}> {
  const payload = await loadNpcProfilesFromPayload();
  setRuntimeNpcProfileOverrides(payload.profiles);
  return payload;
}

export async function buildMergedNpcProfileRecord(): Promise<Record<string, NpcProfile>> {
  const { profiles } = await loadNpcProfilesFromPayload();
  return profiles;
}

export async function getNpcProfileRevision(): Promise<string> {
  const { revision } = await loadNpcProfilesFromPayload();
  return revision;
}

export async function loadFreshNpcProfilesPayload(): Promise<{
  revision: string;
  profiles: Record<string, NpcProfile>;
}> {
  const payload = await loadNpcProfilesFromPayload();
  setRuntimeNpcProfileOverrides(payload.profiles);
  return { revision: payload.revision, profiles: payload.profiles };
}
