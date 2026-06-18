"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setRuntimeNpcProfileOverrides, type NpcProfile } from "@/data/npcProfiles";

type SyncPayload = {
  revision: string;
  profiles: Record<string, NpcProfile>;
};

const SYNC_INTERVAL_MS = 4000;

export function useLiveNpcProfiles(
  initialProfiles: Record<string, NpcProfile>,
  initialRevision: string,
) {
  const router = useRouter();
  const revisionRef = useRef(initialRevision);
  const [profiles, setProfiles] = useState(initialProfiles);
  const [syncTick, setSyncTick] = useState(0);

  useLayoutEffect(() => {
    setRuntimeNpcProfileOverrides(initialProfiles);
  }, [initialProfiles]);

  useLayoutEffect(() => {
    setRuntimeNpcProfileOverrides(profiles);
  }, [profiles, syncTick]);

  useEffect(() => {
    revisionRef.current = initialRevision;
  }, [initialRevision]);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      try {
        const res = await fetch("/api/npc-profiles", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as SyncPayload;
        if (cancelled) return;
        if (data.revision === revisionRef.current) return;

        revisionRef.current = data.revision;
        setProfiles(data.profiles);
        setRuntimeNpcProfileOverrides(data.profiles);
        setSyncTick((value) => value + 1);
        router.refresh();
      } catch {
        // 忽略瞬时网络错误，下一轮轮询重试
      }
    }

    void sync();
    const timer = window.setInterval(sync, SYNC_INTERVAL_MS);
    const onFocus = () => void sync();
    const onVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return { profiles, syncTick };
}
