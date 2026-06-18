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

/** 合并静态 npcProfiles 与 Payload 后台数据，后台同 slug 记录优先 */
export async function buildMergedNpcProfileRecord(): Promise<Record<string, NpcProfile>> {
  const merged = new Map<string, NpcProfile>();
  for (const profile of NPC_PROFILES) {
    merged.set(profile.id, { ...profile });
  }

  try {
    const docs = await fetchPayloadNpcDocs();
    for (const doc of docs) {
      const slug = doc.slug as string | undefined;
      if (!slug) continue;
      const profile = mapPayloadDocToNpcProfile(doc, merged.get(slug));
      if (profile) merged.set(slug, profile);
    }
  } catch {
    // Payload 不可用时沿用静态配置
  }

  return Object.fromEntries(merged);
}

/** 服务端请求内缓存：构建沙盘等场景前先调用，使 getNpcProfileById 读到后台最新值 */
export async function getNpcProfileRevision(): Promise<string> {
  try {
    const docs = await fetchPayloadNpcDocs();
    let maxUpdated = 0;
    for (const doc of docs) {
      const raw = doc.updatedAt;
      if (!raw) continue;
      const ts = new Date(raw as string).getTime();
      if (Number.isFinite(ts) && ts > maxUpdated) maxUpdated = ts;
    }
    return `${docs.length}-${maxUpdated}`;
  } catch {
    return "static-0";
  }
}

export async function ensureMergedNpcProfiles(): Promise<Record<string, NpcProfile>> {
  const record = await buildMergedNpcProfileRecord();
  setRuntimeNpcProfileOverrides(record);
  return record;
}

export async function loadFreshNpcProfilesPayload(): Promise<{
  revision: string;
  profiles: Record<string, NpcProfile>;
}> {
  const [profiles, revision] = await Promise.all([
    buildMergedNpcProfileRecord(),
    getNpcProfileRevision(),
  ]);
  return { revision, profiles };
}
