import { getNpcProfileById } from "@/data/npcProfiles";
import { NPC_DIALOGUE_STATIC_CATALOG } from "@/data/npcDialogueCatalog";
import { getStoryEntries } from "@/game/storyEntryLoader";

export type NpcDialogueEntryRef = {
  slug: string;
  title: string;
  inkFile: string;
  source: "payload" | "static";
};

function collectNpcNameAliases(npcId: string, npcName: string): Set<string> {
  const names = new Set<string>();
  const add = (value?: string) => {
    const trimmed = value?.trim();
    if (trimmed) names.add(trimmed);
  };

  add(npcName);
  const profile = getNpcProfileById(npcId);
  add(profile?.name);
  add(profile?.title);

  return names;
}

function entryMatchesNpc(
  relatedNpcNames: string[],
  npcIds: string[] | undefined,
  npcId: string,
  aliases: Set<string>,
): boolean {
  if (npcIds?.includes(npcId)) return true;
  return relatedNpcNames.some((name) => aliases.has(name.trim()));
}

export async function resolveNpcDialogueEntry(params: {
  npcId: string;
  npcName: string;
  locationId?: string;
}): Promise<NpcDialogueEntryRef | null> {
  const aliases = collectNpcNameAliases(params.npcId, params.npcName);

  const payloadEntries = await getStoryEntries();
  const payloadMatch = payloadEntries.find((entry) => {
    const relatedNpcNames = entry.relatedNpcNames ?? [];
    return (
      entry.storyType === "npc_dialogue" &&
      entry.enabled !== false &&
      entry.inkFile.trim().length > 0 &&
      relatedNpcNames.length > 0 &&
      entryMatchesNpc(relatedNpcNames, undefined, params.npcId, aliases)
    );
  });

  if (payloadMatch) {
    return {
      slug: payloadMatch.slug,
      title: payloadMatch.title,
      inkFile: payloadMatch.inkFile,
      source: "payload",
    };
  }

  const staticMatch = NPC_DIALOGUE_STATIC_CATALOG.find((entry) =>
    entryMatchesNpc(entry.npcNames, entry.npcIds, params.npcId, aliases),
  );

  if (staticMatch) {
    return {
      slug: staticMatch.slug,
      title: staticMatch.title,
      inkFile: staticMatch.inkFile,
      source: "static",
    };
  }

  return null;
}

export const NPC_DIALOGUE_EMPTY_MESSAGE =
  "这位同事暂时还没有专属剧情。后续会在编排台补充 npc_dialogue 条目与 Ink 内容。";
