import { cn } from "@/lib/utils";
import {
  NPC_ROLE_LABELS,
  type SandtableNpcRef,
} from "@/game/sandtableNpcResolver";

const LEVEL_STYLES: Record<SandtableNpcRef["level"], string> = {
  S: "border-amber-400/50 text-amber-100 bg-amber-950/40",
  A: "border-cyan-400/40 text-cyan-100 bg-cyan-950/30",
  B: "border-slate-400/30 text-slate-200 bg-slate-900/50",
  C: "border-slate-600/30 text-slate-400 bg-slate-950/40",
};

export function formatNpcRole(role: SandtableNpcRef["role"]): string {
  return NPC_ROLE_LABELS[role];
}

type SandtableNpcListProps = {
  npcs?: SandtableNpcRef[];
  maxItems?: number;
  empty?: string;
};

export function SandtableNpcList({
  npcs = [],
  maxItems = 5,
  empty = "暂无明确 NPC",
}: SandtableNpcListProps) {
  const visible = npcs.slice(0, maxItems);

  if (visible.length === 0) {
    return <p className="text-[11px] text-slate-600">{empty}</p>;
  }

  return (
    <ul className="space-y-2">
      {visible.map((npc) => (
        <li
          key={`${npc.npcId}-${npc.role}`}
          className="border border-cyan-400/10 bg-slate-950/50 p-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-cyan-50">{npc.name}</p>
              <p className="truncate text-[11px] text-slate-400">{npc.title}</p>
            </div>
            <span
              className={cn(
                "shrink-0 border px-1.5 py-0.5 text-[10px] font-medium",
                LEVEL_STYLES[npc.level],
              )}
            >
              {npc.level}·{formatNpcRole(npc.role)}
            </span>
          </div>
          {npc.agenda ? (
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-slate-500">{npc.agenda}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
