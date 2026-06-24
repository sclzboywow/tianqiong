"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Volume2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildStorySegments, type StorySegment } from "@/game/storySegmentParser";
import type { SandtableNpcRef } from "@/game/sandtableNpcResolver";

type InkChoice = { index: number; text: string; choiceId: string };

type InkStoryState = {
  lines: string[];
  choices: InkChoice[];
  ended: boolean;
};

type NpcInkDialoguePanelProps = {
  open: boolean;
  locationId: string;
  npc: SandtableNpcRef;
  onClose: () => void;
};

const PLAYER_SPEAKERS = new Set(["玩家", "player", "Player", "我"]);

function classifySegment(
  segment: StorySegment,
): "narration" | "npc" | "player" {
  if (segment.type === "narration") return "narration";
  if (PLAYER_SPEAKERS.has(segment.speaker.trim())) return "player";
  return "npc";
}

function segmentSpeakText(segment: StorySegment): string {
  if (segment.type === "narration") return segment.text;
  return `${segment.speaker}：${segment.text}`;
}

function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    window.speechSynthesis != null &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

function speakText(text: string) {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  window.speechSynthesis.speak(utterance);
}

export function NpcInkDialoguePanel({
  open,
  locationId,
  npc,
  onClose,
}: NpcInkDialoguePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [choicePath, setChoicePath] = useState<number[]>([]);
  const [story, setStory] = useState<InkStoryState | null>(null);
  const [entryTitle, setEntryTitle] = useState<string | null>(null);
  const [npcName, setNpcName] = useState(npc.name);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [ttsSupported] = useState(() => isSpeechSynthesisSupported());

  const loadDialogue = useCallback(
    async (path: number[]) => {
      setStatus("loading");
      setError(null);
      try {
        const res = await fetch("/api/locations/npc-dialogue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locationId,
            npcId: npc.npcId,
            choicePath: path,
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          status?: "ready" | "empty";
          npcName?: string;
          entry?: { title: string };
          story?: InkStoryState;
          message?: string;
        };

        if (!res.ok || !data.ok) {
          throw new Error(data.message ?? "对话加载失败");
        }

        if (data.npcName) setNpcName(data.npcName);

        if (data.status === "empty") {
          setStatus("empty");
          setStory(null);
          setEntryTitle(null);
          setMessage(data.message ?? "暂无专属剧情。");
          return;
        }

        if (!data.story) {
          throw new Error("剧情数据缺失");
        }

        setStatus("ready");
        setStory(data.story);
        setEntryTitle(data.entry?.title ?? null);
        setMessage(null);
      } catch (err) {
        setStatus("error");
        setStory(null);
        setError(err instanceof Error ? err.message : "对话加载失败");
      }
    },
    [locationId, npc.npcId],
  );

  useEffect(() => {
    if (!open) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setChoicePath([]);
      void loadDialogue([]);
    });
    return () => {
      active = false;
    };
  }, [open, loadDialogue, npc.npcId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, onClose]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [story?.lines.length, story?.choices.length, status]);

  useEffect(() => {
    return () => {
      if (isSpeechSynthesisSupported()) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const segments = useMemo(
    () => (story?.lines ? buildStorySegments(story.lines) : []),
    [story],
  );

  async function handleChoose(index: number) {
    const nextPath = [...choicePath, index];
    setChoicePath(nextPath);
    setChoosing(true);
    try {
      await loadDialogue(nextPath);
    } finally {
      setChoosing(false);
    }
  }

  function handleRestart() {
    setChoicePath([]);
    void loadDialogue([]);
  }

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3">
      <button
        type="button"
        aria-label="关闭对话"
        className="absolute inset-0 bg-[#050B14]/80 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="npc-ink-dialogue-title"
        className="relative flex max-h-[min(88vh,640px)] w-full max-w-lg flex-col overflow-hidden border border-cyan-400/30 bg-[#060d18]/98 shadow-xl shadow-cyan-950/40"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-cyan-400/15 px-4 py-3">
          <div className="min-w-0">
            <p id="npc-ink-dialogue-title" className="text-sm font-semibold text-cyan-50">
              与 {npcName} 交谈
            </p>
            {entryTitle ? (
              <p className="mt-0.5 truncate text-xs text-slate-500">{entryTitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 border border-cyan-400/20 p-1 text-slate-400 hover:border-cyan-400/40 hover:text-cyan-100"
            aria-label="关闭"
          >
            <X className="size-4" />
          </button>
        </header>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {status === "loading" && !story ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin text-cyan-400" />
              加载对话中…
            </div>
          ) : null}

          {status === "error" && error ? (
            <p className="border border-rose-400/25 bg-rose-950/20 p-3 text-[13px] text-rose-200">
              {error}
            </p>
          ) : null}

          {status === "empty" && message ? (
            <div className="border border-slate-600/30 bg-slate-900/50 p-4 text-[13px] leading-6 text-slate-300">
              <p className="mb-1 text-sm font-medium text-slate-200">暂无专属剧情</p>
              <p>{message}</p>
            </div>
          ) : null}

          {segments.map((segment) => {
            const role = classifySegment(segment);
            const text = segmentSpeakText(segment);
            return (
              <div
                key={segment.key}
                className={cn(
                  "group relative max-w-[92%] border px-3 py-2 text-[13px] leading-5",
                  role === "narration" &&
                    "border-slate-600/25 bg-slate-900/40 text-slate-300 italic",
                  role === "npc" && "border-cyan-400/25 bg-cyan-950/25 text-cyan-50",
                  role === "player" && "ml-auto border-emerald-400/30 bg-emerald-950/25 text-emerald-50",
                )}
              >
                {segment.type === "dialogue" ? (
                  <p className="mb-0.5 text-xs text-slate-500">{segment.speaker}</p>
                ) : (
                  <p className="mb-0.5 text-xs text-slate-500">旁白</p>
                )}
                <p>{segment.type === "dialogue" ? segment.text : segment.text}</p>
                {segment.type === "dialogue" && ttsSupported ? (
                  <button
                    type="button"
                    title="朗读（浏览器原生 TTS）"
                    aria-label="朗读"
                    onClick={() => speakText(text)}
                    className="absolute right-1 top-1 border border-transparent p-0.5 text-slate-500 opacity-0 transition hover:border-cyan-400/30 hover:text-cyan-300 group-hover:opacity-100"
                  >
                    <Volume2 className="size-3.5" />
                  </button>
                ) : null}
              </div>
            );
          })}

          {story?.ended ? (
            <p className="text-center text-xs text-slate-500">对话已结束</p>
          ) : null}
        </div>

        <footer className="shrink-0 border-t border-cyan-400/15 bg-slate-950/60 p-3">
          {story && story.choices.length > 0 && !story.ended ? (
            <div className="space-y-1.5">
              {story.choices.map((choice) => (
                <button
                  key={choice.choiceId}
                  type="button"
                  disabled={choosing || status === "loading"}
                  onClick={() => void handleChoose(choice.index)}
                  className="w-full border border-cyan-400/25 px-3 py-2 text-left text-[13px] text-cyan-100 transition hover:border-cyan-400/45 hover:bg-cyan-950/30 disabled:opacity-50"
                >
                  {choice.text}
                </button>
              ))}
            </div>
          ) : null}

          {status === "ready" && story && (story.ended || story.choices.length === 0) ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRestart}
                className="border border-cyan-400/25 px-3 py-1.5 text-xs text-cyan-100 hover:border-cyan-400/45 hover:bg-cyan-950/30"
              >
                重新开始
              </button>
              <button
                type="button"
                onClick={onClose}
                className="border border-slate-600/30 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-500/40 hover:text-slate-200"
              >
                关闭
              </button>
            </div>
          ) : null}

          {status === "empty" ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full border border-slate-600/30 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-500/40 hover:text-slate-200"
            >
              知道了
            </button>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
