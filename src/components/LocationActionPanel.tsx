"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LocationAction } from "@/data/locationActions";

type LocationActionPanelProps = {
  locationId: string;
  actions: LocationAction[];
};

function formatActionCosts(action: LocationAction) {
  const parts: string[] = [];
  if (action.staminaCost) parts.push(`体力 ${action.staminaCost}`);
  if (action.spiritCost) parts.push(`精神 ${action.spiritCost}`);
  return parts.length > 0 ? parts.join(" / ") : null;
}

function formatActionRequirements(action: LocationAction) {
  const parts: string[] = [];
  if (action.minLevel) parts.push(`Lv.${action.minLevel}`);
  if (action.minReputation) parts.push(`声望 ${action.minReputation}`);
  return parts.length > 0 ? parts.join(" / ") : null;
}

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
                <div className="mt-2 space-y-1 text-xs text-zinc-500">
                  {formatActionCosts(action) && <p>消耗：{formatActionCosts(action)}</p>}
                  {formatActionRequirements(action) && (
                    <p>要求：{formatActionRequirements(action)}</p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                disabled={pendingId === action.id}
                onClick={() => handleExecute(action.id)}
              >
                {pendingId === action.id ? "执行中…" : "执行"}
              </Button>
            </div>
          </div>
        ))}
        {feedback && <p className="text-sm text-amber-300">{feedback}</p>}
      </CardContent>
    </Card>
  );
}
