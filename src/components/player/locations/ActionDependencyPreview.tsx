"use client";

import type { ActionDependencyPreview } from "@/game/locationActionPreviewEngine";

type ActionDependencyPreviewProps = {
  preview?: ActionDependencyPreview;
  actionLabel?: string;
  compact?: boolean;
};

export function ActionDependencyPreviewPanel({
  preview,
  actionLabel,
  compact = false,
}: ActionDependencyPreviewProps) {
  if (!preview || preview.taskPreviews.length === 0) return null;

  const blockedTasks = preview.taskPreviews.filter((task) => !task.available);
  if (blockedTasks.length === 0) return null;

  return (
    <div
      className={`rounded-lg border border-amber-500/30 bg-amber-950/20 ${
        compact ? "p-3 text-xs" : "p-4 text-sm"
      }`}
    >
      <p className="font-medium text-amber-200">
        {actionLabel ? `当前无法「${actionLabel}」` : "当前无法办理"}
      </p>
      {blockedTasks.map((task) => (
        <div key={task.slug} className="mt-3 space-y-2">
          <p className="text-amber-100/90">{task.title}</p>
          {task.missingArtifacts.length > 0 ? (
            <div>
              <p className="text-amber-300/80">缺少前置成果物：</p>
              <ul className="mt-1 space-y-1 text-amber-100/80">
                {task.missingArtifacts.map((artifact) => (
                  <li key={artifact.slug}>
                    × {artifact.name}：{artifact.currentStatus}（需要 {artifact.requiredStatus}）
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {task.blockingReasons.length > 0 && task.missingArtifacts.length === 0 ? (
            <ul className="space-y-1 text-amber-100/80">
              {task.blockingReasons.map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
          ) : null}
          {task.suggestedActions.length > 0 ? (
            <div>
              <p className="text-amber-300/80">建议先办理：</p>
              <ol className="mt-1 list-decimal pl-5 text-amber-100/80">
                {task.suggestedActions.map((item) => (
                  <li key={`${item.locationId}:${item.actionId}`}>{item.label}</li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export type { ActionDependencyPreview };
