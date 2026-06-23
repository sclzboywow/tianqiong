import { getNpcProfileById } from "@/data/npcProfiles";
import { MAP_LOCATION_SANDTABLE_PLACEMENT } from "@/data/mapLocationSandtable";
import { getLocationDisplayNameById } from "@/game/locationDisplayName";
import { getLocationOverview } from "@/game/locationEngine";
import { replayInkStory, type InkStoryReplayState } from "@/game/inkStoryReplay";
import {
  NPC_DIALOGUE_EMPTY_MESSAGE,
  resolveNpcDialogueEntry,
  type NpcDialogueEntryRef,
} from "@/game/npcDialogueLoader";
import { ensureMergedNpcProfiles } from "@/game/npcProfileLoader";
import { getProjectState } from "@/game/projectEngine";
import { buildSandtableNpcRefs } from "@/game/sandtableNpcResolver";
import { listTasks } from "@/game/taskEngine";

export type NpcDialogueResolution =
  | {
      ok: true;
      status: "ready";
      npcName: string;
      entry: NpcDialogueEntryRef;
      story: InkStoryReplayState;
    }
  | {
      ok: true;
      status: "empty";
      npcName: string;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };

export async function resolveNpcInkDialogue(params: {
  locationId: string;
  npcId: string;
  choicePath: number[];
  userId: string;
}): Promise<NpcDialogueResolution> {
  void params.userId;

  await ensureMergedNpcProfiles();

  const overview = await getLocationOverview(params.locationId);
  if (!overview) {
    return { ok: false, message: "地点不存在" };
  }

  const project = await getProjectState();
  if (!project) {
    return { ok: false, message: "项目状态不存在" };
  }

  const tasks = await listTasks();
  const placement =
    MAP_LOCATION_SANDTABLE_PLACEMENT[params.locationId] ??
    ({ regionId: "command_center", zoneId: "command_meeting" } as const);

  const { relatedNpcs } = buildSandtableNpcRefs({
    locationId: params.locationId,
    regionId: placement.regionId,
    zoneId: placement.zoneId,
    fallbackNpcNames: overview.location.relatedNpcNames,
    project,
    tasks,
  });

  const npc = relatedNpcs.find((item) => item.npcId === params.npcId);
  if (!npc) {
    return { ok: false, message: "该 NPC 不在当前地点" };
  }

  const profile = getNpcProfileById(npc.npcId);
  const npcName = profile?.name ?? npc.name;
  void getLocationDisplayNameById(params.locationId);

  const entry = await resolveNpcDialogueEntry({
    npcId: params.npcId,
    npcName,
    locationId: params.locationId,
  });

  if (!entry) {
    return {
      ok: true,
      status: "empty",
      npcName,
      message: NPC_DIALOGUE_EMPTY_MESSAGE,
    };
  }

  try {
    const story = replayInkStory(entry.inkFile, params.choicePath);
    return {
      ok: true,
      status: "ready",
      npcName,
      entry,
      story,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "剧情加载失败",
    };
  }
}
