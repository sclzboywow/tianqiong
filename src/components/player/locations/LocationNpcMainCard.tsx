import { cn } from "@/lib/utils";
import { getNpcProfileById } from "@/data/npcProfiles";
import { NPC_ROLE_LABELS, type SandtableNpcRef } from "@/game/sandtableNpcResolver";
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

function resolveLocationLabel(npc: SandtableNpcRef, preferCurrent = false): string | undefined {
  const locationId = preferCurrent
    ? (npc.currentLocationId ?? npc.homeLocationId)
    : (npc.homeLocationId ?? npc.currentLocationId);
  if (!locationId) return undefined;
  return getLocationDisplayNameById(locationId);
}

type LocationNpcMainCardProps = {
  npc: SandtableNpcRef;
  onTalk?: () => void;
  talkEnabled?: boolean;
};

export function LocationNpcMainCard({ npc, onTalk, talkEnabled = true }: LocationNpcMainCardProps) {
  const profile = getNpcProfileById(npc.npcId);
  const name = profile?.name ?? npc.name;
  const title = profile?.title ?? npc.title;
  const level = profile?.level ?? npc.level;
  const agenda = profile?.agenda ?? npc.agenda;
  const presence = npc.presenceStatus;
  const homeLabel = resolveLocationLabel(npc);
  const currentLabel = resolveLocationLabel(npc, true);

  return (
    <article className="shrink-0 border border-cyan-400/35 bg-cyan-950/25 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-cyan-50">{name}</p>
          <p className="truncate text-xs text-slate-400">{title}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={cn("border px-1.5 py-0.5 text-xs font-medium", LEVEL_STYLES[level])}>
            {level}·{NPC_ROLE_LABELS[npc.role]}
          </span>
          {presence ? (
            <span className={cn("border px-1.5 py-0.5 text-[10px]", PRESENCE_STYLES[presence])}>
              {PRESENCE_LABELS[presence]}
            </span>
          ) : null}
        </div>
      </div>

      {agenda ? (
        <p className="mt-2 text-[13px] leading-5 text-slate-300">{agenda}</p>
      ) : null}

      {presence === "away" || presence === "reachable" ? (
        <div className="mt-2 space-y-0.5 text-[13px] leading-5 text-slate-500">
          {presence === "away" ? <p className="text-slate-400">当前不在此处</p> : null}
          {presence === "reachable" && currentLabel ? <p>当前在：{currentLabel}</p> : null}
          {presence === "away" && homeLabel ? <p>通常在：{homeLabel}</p> : null}
          {npc.presenceReason ? <p>事由：{npc.presenceReason}</p> : null}
          {npc.presenceHint ? <p>线索：{npc.presenceHint}</p> : null}
        </div>
      ) : null}

      {presence === "present" && npc.presenceReason ? (
        <p className="mt-2 text-[13px] leading-5 text-emerald-200/80">事由：{npc.presenceReason}</p>
      ) : null}
      {presence === "locked" && npc.presenceHint ? (
        <p className="mt-2 text-[13px] leading-5 text-slate-500">{npc.presenceHint}</p>
      ) : null}

      {onTalk ? (
        <button
          type="button"
          disabled={!talkEnabled}
          onClick={onTalk}
          className={cn(
            "mt-3 w-full border px-2 py-1.5 text-xs transition",
            talkEnabled
              ? "border-emerald-400/35 text-emerald-100 hover:border-emerald-400/55 hover:bg-emerald-950/25"
              : "cursor-not-allowed border-slate-700/40 text-slate-600",
          )}
        >
          交谈
        </button>
      ) : null}
    </article>
  );
}
