"use client";

import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NPC_INTERACTION_LABELS,
  NPC_INTERACTION_ORDER,
  getAvailableNpcInteractions,
  type DialogueEntry,
  type NpcInteractionType,
} from "@/game/npcInteractionEngine";
import type { SandtableNpcRef } from "@/game/sandtableNpcResolver";
import { getNpcProfileById } from "@/data/npcProfiles";

type LocationNpcDialoguePanelProps = {
  selectedNpc?: SandtableNpcRef;
  entries: DialogueEntry[];
  pendingInteraction?: NpcInteractionType | null;
  onInteract: (interaction: NpcInteractionType) => void;
  onInkTalk?: () => void;
  className?: string;
};

function formatTime(ts: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function LocationNpcDialoguePanel({
  selectedNpc,
  entries,
  pendingInteraction,
  onInteract,
  onInkTalk,
  className,
}: LocationNpcDialoguePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const profile = selectedNpc ? getNpcProfileById(selectedNpc.npcId) : undefined;
  const npcName = profile?.name ?? selectedNpc?.name;
  const available = selectedNpc ? getAvailableNpcInteractions(selectedNpc) : [];

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [entries.length, pendingInteraction]);

  return (
    <div
      className={cn(
        "flex min-h-[220px] flex-col border border-cyan-400/20 bg-slate-950/50",
        className,
      )}
    >
      <header className="shrink-0 border-b border-cyan-400/10 px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
          <MessageSquare className="size-3.5 text-cyan-400" />
          对话
          {npcName ? <span className="font-normal text-slate-400">· {npcName}</span> : null}
        </div>
        {!selectedNpc ? (
          <p className="mt-1 text-xs text-slate-500">请从下方选择 NPC 开始互动</p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">点击下方动作发起互动，回复会即时显示在这里</p>
        )}
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {entries.length === 0 ? (
          <p className="text-[13px] leading-5 text-slate-500">
            {selectedNpc
              ? "当前尚无对话记录。你可以先交谈了解情况，或发起请示、协调、催办。"
              : "选择 NPC 后，可使用底部动作开始对话。"}
          </p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "max-w-[95%] border px-2.5 py-2 text-[13px] leading-5",
                entry.role === "player" && "ml-auto border-cyan-400/25 bg-cyan-950/30 text-cyan-50",
                entry.role === "npc" && "border-slate-600/30 bg-slate-900/60 text-slate-200",
                entry.role === "system" && "border-amber-400/20 bg-amber-950/20 text-amber-100",
              )}
            >
              <p className="mb-0.5 text-xs text-slate-500">
                {entry.speaker}
                {entry.interaction ? ` · ${NPC_INTERACTION_LABELS[entry.interaction]}` : ""}
                <span className="ml-2 text-[11px] text-slate-500">{formatTime(entry.createdAt)}</span>
              </p>
              <p>{entry.text}</p>
            </div>
          ))
        )}
      </div>

      {selectedNpc ? (
        <footer className="shrink-0 border-t border-cyan-400/10 bg-slate-950/70 p-2">
          <div className="flex flex-wrap gap-1">
            {NPC_INTERACTION_ORDER.map((type) => {
              const enabled = available.includes(type);
              const isPending = pendingInteraction === type;
              const isInkTalk = type === "talk" && onInkTalk;
              return (
                <button
                  key={type}
                  type="button"
                  disabled={!enabled || Boolean(pendingInteraction)}
                  onClick={() => (isInkTalk ? onInkTalk() : onInteract(type))}
                  className={cn(
                    "border px-2 py-1 text-xs transition",
                    enabled
                      ? "border-cyan-400/25 text-cyan-100 hover:border-cyan-400/50 hover:bg-cyan-950/30"
                      : "cursor-not-allowed border-slate-700/40 text-slate-600",
                    isPending && "opacity-60",
                    isInkTalk && enabled && "border-emerald-400/30 text-emerald-100",
                  )}
                >
                  {NPC_INTERACTION_LABELS[type]}
                </button>
              );
            })}
          </div>
        </footer>
      ) : null}
    </div>
  );
}
