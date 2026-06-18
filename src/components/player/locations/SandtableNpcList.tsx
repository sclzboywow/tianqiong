import { cn } from "@/lib/utils";
import { getNpcProfileById } from "@/data/npcProfiles";
import {
  NPC_ROLE_LABELS,
  type SandtableNpcRef,
} from "@/game/sandtableNpcResolver";
import { getLocationDisplayNameById } from "@/game/locationDisplayName";
import type { NpcPresenceStatus } from "@/game/npcPresenceResolver";

const LEVEL_STYLES: Record<SandtableNpcRef["level"], string> = {
  S: "border-amber-400/50 text-amber-100 bg-amber-950/40",
  A: "border-cyan-400/40 text-cyan-100 bg-cyan-950/30",
  B: "border-slate-400/30 text-slate-200 bg-slate-900/50",
  C: "border-slate-600/30 text-slate-400 bg-slate-950/40",
};

const PRESENCE_LABELS: Record<NpcPresenceStatus, string> = {
  present: "在场",
  reachable: "可联络",
  away: "不在场",
  locked: "未解锁",
};

const PRESENCE_STYLES: Record<NpcPresenceStatus, string> = {
  present: "border-emerald-400/40 text-emerald-100 bg-emerald-950/30",
  reachable: "border-cyan-400/35 text-cyan-100 bg-cyan-950/25",
  away: "border-slate-500/35 text-slate-300 bg-slate-900/40",
  locked: "border-slate-600/30 text-slate-500 bg-slate-950/50",
};

export function formatNpcRole(role: SandtableNpcRef["role"]): string {
  return NPC_ROLE_LABELS[role];
}

type SandtableNpcListProps = {
  npcs?: SandtableNpcRef[];
  maxItems?: number;
  empty?: string;
};

function resolveLocationLabel(npc: SandtableNpcRef, preferCurrent = false): string | undefined {
  const locationId = preferCurrent
    ? (npc.currentLocationId ?? npc.homeLocationId)
    : (npc.homeLocationId ?? npc.currentLocationId);
  if (!locationId) return undefined;
  return getLocationDisplayNameById(locationId);
}

function resolveNpcDisplay(npc: SandtableNpcRef) {
  const live = getNpcProfileById(npc.npcId);
  return {
    name: live?.name ?? npc.name,
    title: live?.title ?? npc.title,
    level: live?.level ?? npc.level,
    agenda: live?.agenda ?? npc.agenda,
  };
}

function NpcCard({ npc }: { npc: SandtableNpcRef }) {
  const display = resolveNpcDisplay(npc);
  const presence = npc.presenceStatus;
  const homeLabel = resolveLocationLabel(npc);
  const currentLabel = resolveLocationLabel(npc, true);

  return (
    <li className="border border-cyan-400/10 bg-slate-950/50 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-cyan-50">{display.name}</p>
          <p className="truncate text-[11px] text-slate-400">{display.title}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={cn(
              "border px-1.5 py-0.5 text-[10px] font-medium",
              LEVEL_STYLES[display.level],
            )}
          >
            {display.level}·{formatNpcRole(npc.role)}
          </span>
          {presence ? (
            <span
              className={cn(
                "border px-1.5 py-0.5 text-[10px]",
                PRESENCE_STYLES[presence],
              )}
            >
              {PRESENCE_LABELS[presence]}
            </span>
          ) : null}
        </div>
      </div>
      {display.agenda && !presence ? (
        <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-slate-500">{display.agenda}</p>
      ) : null}
      {presence === "away" || presence === "reachable" ? (
        <div className="mt-1.5 space-y-0.5 text-[11px] leading-5 text-slate-500">
          {presence === "away" ? (
            <p className="text-slate-400">当前不在此处</p>
          ) : null}
          {presence === "reachable" && currentLabel ? (
            <p>当前在：{currentLabel}</p>
          ) : null}
          {presence === "away" && homeLabel ? <p>通常在：{homeLabel}</p> : null}
          {npc.presenceReason ? <p>事由：{npc.presenceReason}</p> : null}
          {npc.presenceHint ? <p>线索：{npc.presenceHint}</p> : null}
        </div>
      ) : null}
      {presence === "present" && npc.presenceReason ? (
        <p className="mt-1.5 text-[11px] leading-5 text-emerald-200/80">事由：{npc.presenceReason}</p>
      ) : null}
      {presence === "locked" && npc.presenceHint ? (
        <p className="mt-1.5 text-[11px] leading-5 text-slate-500">{npc.presenceHint}</p>
      ) : null}
      {display.agenda && presence && presence !== "locked" ? (
        <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-600">{display.agenda}</p>
      ) : null}
    </li>
  );
}

function groupNpcs(npcs: SandtableNpcRef[]): {
  id: string;
  title: string;
  items: SandtableNpcRef[];
}[] {
  const hasPresence = npcs.some((npc) => npc.presenceStatus);
  if (!hasPresence) {
    return [{ id: "legacy", title: "", items: npcs }];
  }

  const groups: { id: NpcPresenceStatus; title: string }[] = [
    { id: "present", title: "在场" },
    { id: "reachable", title: "可联络" },
    { id: "away", title: "不在场" },
    { id: "locked", title: "未解锁" },
  ];

  const legacy = npcs.filter((npc) => !npc.presenceStatus);
  const sections: { id: string; title: string; items: SandtableNpcRef[] }[] = groups
    .map((group) => ({
      ...group,
      items: npcs.filter((npc) => npc.presenceStatus === group.id),
    }))
    .filter((group) => group.items.length > 0);

  if (legacy.length > 0) {
    sections.push({ id: "legacy", title: "相关", items: legacy });
  }

  return sections;
}

export function SandtableNpcList({
  npcs = [],
  maxItems = 5,
  empty = "暂无明确 NPC",
}: SandtableNpcListProps) {
  if (npcs.length === 0) {
    return <p className="text-[11px] text-slate-600">{empty}</p>;
  }

  const sections = groupNpcs(npcs);
  const isGrouped = sections.length > 1 || (sections[0]?.id !== "legacy" && sections[0]?.title);

  const visibleSections = sections.reduce<{ id: string; title: string; items: SandtableNpcRef[] }[]>(
    (acc, section) => {
      const used = acc.reduce((sum, entry) => sum + entry.items.length, 0);
      if (used >= maxItems) return acc;
      const visible = section.items.slice(0, maxItems - used);
      if (visible.length === 0) return acc;
      acc.push({ ...section, items: visible });
      return acc;
    },
    [],
  );

  return (
    <div className="space-y-3">
      {visibleSections.map((section) => (
        <div key={section.id}>
          {isGrouped && section.title ? (
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              {section.title}
            </p>
          ) : null}
          <ul className="space-y-2">
            {section.items.map((npc) => (
              <NpcCard key={`${npc.npcId}-${npc.role}`} npc={npc} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
