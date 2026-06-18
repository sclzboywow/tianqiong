import type { SandtableNpcRef } from "./sandtableNpcResolver";
import { getNpcProfileById } from "@/data/npcProfiles";
import type { NpcPresenceStatus } from "./npcPresenceResolver";

export type NpcInteractionType = "talk" | "report" | "coordinate" | "urge" | "submit_docs";

export const NPC_INTERACTION_LOG_PREFIX = "【NPC互动】";

export const NPC_INTERACTION_LABELS: Record<NpcInteractionType, string> = {
  talk: "交谈",
  report: "请示",
  coordinate: "协调",
  urge: "催办",
  submit_docs: "提交材料",
};

export const NPC_INTERACTION_ORDER: NpcInteractionType[] = [
  "talk",
  "report",
  "coordinate",
  "urge",
  "submit_docs",
];

export type NpcInteractionLogMeta = {
  locationId: string;
  npcId: string;
  interaction: NpcInteractionType;
  playerLine: string;
  npcLine: string;
};

export function buildNpcInteractionLogContent(params: {
  locationId: string;
  locationName: string;
  npcName: string;
  interaction: NpcInteractionType;
  npcLine: string;
}): string {
  const label = NPC_INTERACTION_LABELS[params.interaction];
  return `${NPC_INTERACTION_LOG_PREFIX}@${params.locationId} 在「${params.locationName}」对${params.npcName}执行「${label}」：${params.npcLine}`;
}

export type NpcInteractionResult = {
  ok: boolean;
  reason?: string;
  playerLine: string;
  npcLine: string;
  logContent: string;
};

const INTERACTIONS_BY_PRESENCE: Record<NpcPresenceStatus | "default", NpcInteractionType[]> = {
  present: ["talk", "report", "coordinate", "urge", "submit_docs"],
  reachable: ["talk", "report", "coordinate"],
  away: ["talk", "urge"],
  locked: [],
  default: ["talk", "coordinate"],
};

function pickLine(options: string[]): string {
  return options[Math.floor(Math.random() * options.length)];
}

export function getAvailableNpcInteractions(npc: SandtableNpcRef): NpcInteractionType[] {
  const presence = npc.presenceStatus;
  const allowed = presence ? INTERACTIONS_BY_PRESENCE[presence] : INTERACTIONS_BY_PRESENCE.default;
  return NPC_INTERACTION_ORDER.filter((type) => allowed.includes(type));
}

export function resolveNpcInteraction(params: {
  npc: SandtableNpcRef;
  interaction: NpcInteractionType;
  locationId: string;
  locationName: string;
}): NpcInteractionResult {
  const { npc, interaction, locationId, locationName } = params;
  const profile = getNpcProfileById(npc.npcId);
  const name = profile?.name ?? npc.name;
  const agenda = profile?.agenda ?? npc.agenda ?? "当前事项";
  const helps = profile?.helpsWith?.[0] ?? "现场协同";
  const personality = profile?.personality ?? "专业";
  const available = getAvailableNpcInteractions(npc);

  if (!available.includes(interaction)) {
    const presenceLabel =
      npc.presenceStatus === "away"
        ? "不在场"
        : npc.presenceStatus === "reachable"
          ? "仅可远程联络"
          : npc.presenceStatus === "locked"
            ? "尚未解锁"
            : "当前状态";
    return {
      ok: false,
      reason: `${name}${presenceLabel}，暂无法「${NPC_INTERACTION_LABELS[interaction]}」。`,
      playerLine: "",
      npcLine: "",
      logContent: "",
    };
  }

  const playerLines: Record<NpcInteractionType, string[]> = {
    talk: [`想了解「${locationName}」目前的推进情况。`, `想和你同步一下现场信息。`],
    report: [`关于「${agenda}」，请示下一步安排。`, `有一项事项需要向您请示。`],
    coordinate: [`需要协调「${helps}」相关接口。`, `想请你帮忙对齐一下协同事项。`],
    urge: [`「${agenda}」节点有些滞后，请协助催办。`, `有事项需要加快闭环，麻烦推进。`],
    submit_docs: [`提交与「${helps}」相关的材料。`, `现场资料已整理，提交复核。`],
  };

  const npcLines: Record<NpcInteractionType, string[]> = {
    talk: [
      `好的。${personality}的风格我会直说：${agenda}。`,
      `在「${locationName}」这里，当前重点是${agenda}，你先说说你的判断。`,
    ],
    report: [
      `收到。请示事项我会按流程处理，先确认${agenda}是否已有责任人。`,
      `可以，先把依据材料补齐，我再给你明确口径。`,
    ],
    coordinate: [
      `协调的事我来牵头，${helps}这条线我会帮你对接。`,
      `行，我会把相关方拉齐，今天内给你反馈节点。`,
    ],
    urge: [
      `催办我收到了。${agenda}我会盯一下，但别跳过前置条件。`,
      `可以加快，但材料不齐的话我这边很难签字。`,
    ],
    submit_docs: [
      `材料放这里吧。我先做形式审查，缺项的会退回补充。`,
      `收到。提交后我会同步给相关口，有结论再通知你。`,
    ],
  };

  const playerLine = pickLine(playerLines[interaction]);
  const npcLine = pickLine(npcLines[interaction]);
  const logContent = buildNpcInteractionLogContent({
    locationId,
    locationName,
    npcName: name,
    interaction,
    npcLine,
  });

  return {
    ok: true,
    playerLine,
    npcLine,
    logContent,
  };
}

export type DialogueEntry = {
  id: string;
  role: "player" | "npc" | "system";
  speaker: string;
  text: string;
  npcId?: string;
  interaction?: NpcInteractionType;
  createdAt: number;
};

export function dialogueEntriesFromLogMeta(params: {
  logId: string;
  meta: NpcInteractionLogMeta;
  npcName: string;
  createdAt: number;
  playerName?: string;
}): DialogueEntry[] {
  const { logId, meta, npcName, createdAt, playerName = "你" } = params;
  if (!meta.playerLine && !meta.npcLine) return [];

  const entries: DialogueEntry[] = [];
  if (meta.playerLine) {
    entries.push({
      id: `${logId}-p`,
      role: "player",
      speaker: playerName,
      text: meta.playerLine,
      npcId: meta.npcId,
      interaction: meta.interaction,
      createdAt,
    });
  }
  if (meta.npcLine) {
    entries.push({
      id: `${logId}-n`,
      role: "npc",
      speaker: npcName,
      text: meta.npcLine,
      npcId: meta.npcId,
      interaction: meta.interaction,
      createdAt: createdAt + 1,
    });
  }
  return entries;
}

export function parseNpcInteractionLogMeta(raw: string | null | undefined): NpcInteractionLogMeta | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as NpcInteractionLogMeta;
    if (!parsed.locationId || !parsed.npcId || !parsed.interaction) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildDialogueEntriesFromInteraction(params: {
  npc: SandtableNpcRef;
  interaction: NpcInteractionType;
  result: NpcInteractionResult;
  playerName?: string;
}): DialogueEntry[] {
  if (!params.result.ok) {
    return [
      {
        id: `sys-${Date.now()}`,
        role: "system",
        speaker: "系统",
        text: params.result.reason ?? "互动失败",
        npcId: params.npc.npcId,
        createdAt: Date.now(),
      },
    ];
  }

  const profile = getNpcProfileById(params.npc.npcId);
  const npcName = profile?.name ?? params.npc.name;
  const now = Date.now();

  return [
    {
      id: `p-${now}`,
      role: "player",
      speaker: params.playerName ?? "你",
      text: params.result.playerLine,
      npcId: params.npc.npcId,
      interaction: params.interaction,
      createdAt: now,
    },
    {
      id: `n-${now + 1}`,
      role: "npc",
      speaker: npcName,
      text: params.result.npcLine,
      npcId: params.npc.npcId,
      interaction: params.interaction,
      createdAt: now + 1,
    },
  ];
}
