import { getNpcProfileById } from "@/data/npcProfiles";
import { MAP_LOCATION_SANDTABLE_PLACEMENT } from "@/data/mapLocationSandtable";
import { getLocationDisplayNameById } from "@/game/locationDisplayName";
import { getLocationOverview } from "@/game/locationEngine";
import { writeGameLog } from "@/game/logEngine";
import { ensureMergedNpcProfiles } from "@/game/npcProfileLoader";
import {
  buildDialogueEntriesFromInteraction,
  dialogueEntriesFromLogMeta,
  NPC_INTERACTION_ORDER,
  parseNpcInteractionLogMeta,
  resolveNpcInteraction,
  type DialogueEntry,
  type NpcInteractionType,
} from "@/game/npcInteractionEngine";
import { getProjectState } from "@/game/projectEngine";
import { buildSandtableNpcRefs } from "@/game/sandtableNpcResolver";
import { listTasks } from "@/game/taskEngine";
import { prisma } from "@/prisma/client";

const SEASON_ID = process.env.SEASON_ID || "season-1";

function isNpcInteractionType(value: string): value is NpcInteractionType {
  return (NPC_INTERACTION_ORDER as string[]).includes(value);
}

export async function executeNpcInteraction(params: {
  locationId: string;
  npcId: string;
  interaction: string;
  userId?: string;
}): Promise<{
  ok: boolean;
  message?: string;
  reason?: string;
  entries?: DialogueEntry[];
  log?: { id: string; content: string; createdAt: string };
}> {
  if (!isNpcInteractionType(params.interaction)) {
    return { ok: false, message: "无效的互动类型" };
  }

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

  const locationName = getLocationDisplayNameById(params.locationId);
  const result = resolveNpcInteraction({
    npc,
    interaction: params.interaction,
    locationId: params.locationId,
    locationName,
  });

  const entries = buildDialogueEntriesFromInteraction({
    npc,
    interaction: params.interaction,
    result,
  });

  if (!result.ok) {
    return {
      ok: false,
      message: result.reason ?? "互动失败",
      reason: result.reason,
      entries,
    };
  }

  const meta = {
    locationId: params.locationId,
    npcId: params.npcId,
    interaction: params.interaction,
    playerLine: result.playerLine,
    npcLine: result.npcLine,
  };

  const logRow = await writeGameLog({
    userId: params.userId,
    logType: "SYSTEM",
    content: result.logContent,
    effectSummary: JSON.stringify(meta),
  });

  return {
    ok: true,
    message: "互动已记录",
    entries,
    log: {
      id: logRow.id,
      content: result.logContent,
      createdAt: logRow.createdAt.toISOString(),
    },
  };
}

export async function loadNpcInteractionDialogueHistory(params: {
  locationId: string;
  locationName: string;
  limit?: number;
}): Promise<DialogueEntry[]> {
  const displayName = getLocationDisplayNameById(params.locationId);
  const rows = await prisma.gameLog.findMany({
    where: {
      seasonId: SEASON_ID,
      AND: [
        { content: { startsWith: "【NPC互动】" } },
        {
          OR: [
            { content: { contains: `@${params.locationId}` } },
            { content: { contains: params.locationName } },
            { content: { contains: displayName } },
          ],
        },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: params.limit ?? 24,
    select: { id: true, effectSummary: true, createdAt: true },
  });

  const entries: DialogueEntry[] = [];
  for (const row of rows) {
    const meta = parseNpcInteractionLogMeta(row.effectSummary);
    if (!meta) continue;
    const profile = getNpcProfileById(meta.npcId);
    entries.push(
      ...dialogueEntriesFromLogMeta({
        logId: row.id,
        meta,
        npcName: profile?.name ?? meta.npcId,
        createdAt: row.createdAt.getTime(),
      }),
    );
  }

  return entries.slice(-24);
}
