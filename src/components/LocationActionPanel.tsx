"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LocationAction } from "@/data/locationActions";

type LocationActionPanelProps = {
  locationId: string;
  actions: LocationAction[];
};

export function LocationActionPanel({ locationId, actions }: LocationActionPanelProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (actions.length === 0) return null;

  async function handleExecute(actionId: string) {
    setPendingId(actionId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/locations/${locationId}/actions/${actionId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error || "行动执行失败");
        return;
      }
      setFeedback(data.message || "行动已执行");
      router.refresh();
    } catch {
      setFeedback("网络错误，请稍后重试");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card className="border-emerald-900/40 bg-zinc-900/80">
      <CardHeader>
        <CardTitle className="text-base text-emerald-300">可执行行动</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <div
            key={action.id}
            className="rounded-lg border border-zinc-700 bg-zinc-950/50 p-3 space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-zinc-100">{action.label}</p>
                <p className="mt-1 text-sm text-zinc-400">{action.description}</p>
              </div>
              <Button
                size="sm"
                disabled={pendingId === action.id}
                onClick={() => handleExecute(action.id)}
              >
                {pendingId === action.id ? "执行中…" : "执行"}
              </Button>
            </div>
            {action.relatedNpcNames && action.relatedNpcNames.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {action.relatedNpcNames.map((npc) => (
                  <Badge key={npc} variant="outline" className="text-xs">
                    {npc}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
        {feedback && <p className="text-sm text-amber-300">{feedback}</p>}
      </CardContent>
    </Card>
  );
}
