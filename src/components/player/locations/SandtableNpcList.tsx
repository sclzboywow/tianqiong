import { cn } from "@/lib/utils";
import { getNpcProfileById } from "@/data/npcProfiles";
import {
  NPC_ROLE_LABELS,
  type SandtableNpcRef,
} from "@/game/sandtableNpcResolver";
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
  selectedNpcId?: string;
  excludeNpcId?: string;
  onSelectNpc?: (npc: SandtableNpcRef) => void;
  onTalk?: (npc: SandtableNpcRef) => void;
  variant?: "default" | "compact";
};

function resolveNpcDisplay(npc: SandtableNpcRef) {
  const live = getNpcProfileById(npc.npcId);
  return {
    name: live?.name ?? npc.name,
    title: live?.title ?? npc.title,
    level: live?.level ?? npc.level,
  };
}

function NpcPickerCard({
  npc,
  selected,
  onSelect,
  onTalk,
  variant,
}: {
  npc: SandtableNpcRef;
  selected?: boolean;
  onSelect?: (npc: SandtableNpcRef) => void;
  onTalk?: (npc: SandtableNpcRef) => void;
  variant: "default" | "compact";
}) {
  const display = resolveNpcDisplay(npc);
  const presence = npc.presenceStatus;

  if (variant === "compact") {
    return (
      <li
        className={cn(
          "border px-2 py-1.5 transition",
          selected ? "border-cyan-400/45 bg-cyan-950/25" : "border-cyan-400/10 bg-slate-950/40 hover:border-cyan-400/30",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left text-[13px] text-cyan-50"
            onClick={() => onSelect?.(npc)}
          >
            {display.name}
          </button>
          <div className="flex shrink-0 items-center gap-1">
            {onTalk ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onTalk(npc);
                }}
                className="border border-emerald-400/30 px-1.5 py-0.5 text-[11px] text-emerald-100 hover:border-emerald-400/50"
              >
                交谈
              </button>
            ) : null}
            {presence ? (
              <span className={cn("border px-1 py-0.5 text-[11px]", PRESENCE_STYLES[presence])}>
                {PRESENCE_LABELS[presence]}
              </span>
            ) : null}
          </div>
        </div>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "border bg-slate-950/50 p-2.5 transition",
        selected ? "border-cyan-400/45 bg-cyan-950/20" : "border-cyan-400/10 hover:border-cyan-400/30",
      )}
    >
      <button type="button" className="w-full text-left" onClick={() => onSelect?.(npc)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-cyan-50">{display.name}</p>
            <p className="truncate text-xs text-slate-400">{display.title}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className={cn("border px-1.5 py-0.5 text-xs font-medium", LEVEL_STYLES[display.level])}>
              {display.level}·{formatNpcRole(npc.role)}
            </span>
            {presence ? (
              <span className={cn("border px-1.5 py-0.5 text-[10px]", PRESENCE_STYLES[presence])}>
                {PRESENCE_LABELS[presence]}
              </span>
            ) : null}
          </div>
        </div>
      </button>
      {onTalk ? (
        <button
          type="button"
          onClick={() => onTalk(npc)}
          className="mt-2 w-full border border-emerald-400/30 px-2 py-1 text-xs text-emerald-100 hover:border-emerald-400/50 hover:bg-emerald-950/20"
        >
          交谈
        </button>
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
  selectedNpcId,
  excludeNpcId,
  onSelectNpc,
  onTalk,
  variant = "default",
}: SandtableNpcListProps) {
  const visibleNpcs = npcs.filter((npc) => npc.npcId !== excludeNpcId);

  if (visibleNpcs.length === 0) {
    return <p className="text-xs text-slate-500">{empty}</p>;
  }

  const sections = groupNpcs(visibleNpcs);
  const isGrouped = variant === "default" && (sections.length > 1 || (sections[0]?.id !== "legacy" && sections[0]?.title));

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
    <div className="space-y-2">
      {visibleSections.map((section) => (
        <div key={section.id}>
          {isGrouped && section.title ? (
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              {section.title}
            </p>
          ) : null}
          <ul className={cn(variant === "compact" ? "space-y-1" : "space-y-2")}>
            {section.items.map((npc) => (
              <NpcPickerCard
                key={`${npc.npcId}-${npc.role}`}
                npc={npc}
                variant={variant}
                selected={selectedNpcId === npc.npcId}
                onSelect={onSelectNpc}
                onTalk={onTalk}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
