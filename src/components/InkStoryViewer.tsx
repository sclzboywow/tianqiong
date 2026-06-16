"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Choice {
  index: number;
  text: string;
  choiceId: string;
}

interface InkStoryViewerProps {
  lines: string[];
  choices: Choice[];
  onChoose: (choiceId: string, index: number) => Promise<void>;
  loading?: boolean;
  pending?: {
    message: string;
    submittedCount: number;
    requiredCount: number;
  } | null;
  result?: {
    finalized?: boolean;
    success?: boolean;
    finalChoiceId?: string;
    effects?: Record<string, number>;
    rewards?: { exp: number; gold: number; reputation: number; contribution: number };
  } | null;
}

export function InkStoryViewer({ lines, choices, onChoose, loading, pending, result }: InkStoryViewerProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const finalized = result?.finalized !== false && result?.effects !== undefined;

  return (
    <div className="space-y-4">
      <Card className="border-zinc-700 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-amber-400">现场情况</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-base leading-relaxed text-zinc-200">
          {lines.map((line, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {line}
            </p>
          ))}
        </CardContent>
      </Card>

      {choices.length > 0 && !result && !pending && (
        <div className="space-y-2">
          {choices.map((choice) => (
            <Button
              key={choice.choiceId}
              className="h-auto w-full justify-start whitespace-normal py-3 text-left"
              variant="outline"
              disabled={loading}
              onClick={async () => {
                setSelected(choice.choiceId);
                await onChoose(choice.choiceId, choice.index);
              }}
            >
              {choice.text}
            </Button>
          ))}
        </div>
      )}

      {pending && (
        <Card className="border-blue-700 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-blue-400">等待统一结算</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <p>{pending.message}</p>
            <p>
              当前提交人数：{pending.submittedCount} / {pending.requiredCount}
            </p>
            {selected && <p className="text-zinc-500">你的选择：{selected}</p>}
          </CardContent>
        </Card>
      )}

      {finalized && result && (
        <Card className="border-amber-700 bg-zinc-900">
          <CardHeader>
            <CardTitle className={result.success ? "text-green-400" : "text-red-400"}>
              {result.success ? "处理完成" : "处理失败"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            {result.finalChoiceId && <p>最终方案：{result.finalChoiceId}</p>}
            {result.rewards && (
              <p>
                经验 +{result.rewards.exp} · 金币 +{result.rewards.gold} · 声望 +{result.rewards.reputation} ·
                贡献 +{result.rewards.contribution}
              </p>
            )}
            {result.effects && Object.keys(result.effects).length > 0 && (
              <div>
                <p className="mb-1 font-medium text-amber-300">项目指标变化</p>
                {Object.entries(result.effects).map(([key, value]) => (
                  <p key={key}>
                    {key}: {value > 0 ? `+${value}` : value}
                  </p>
                ))}
              </div>
            )}
            {selected && <p className="text-zinc-500">你的选择：{selected}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
