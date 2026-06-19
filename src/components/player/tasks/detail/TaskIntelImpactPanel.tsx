"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { TaskDetailViewData } from "@/game/taskDetailPresentationEngine";
import type { PlayerEffectLine } from "@/game/taskEffectPlayerDisplay";
import {
  taskDetailPanel,
  taskDetailPanelHeader,
  taskDetailTag,
} from "../taskBoardUi";
import { TaskDetailExpandButton } from "./taskDetailExpand";

type TaskIntelImpactPanelProps = {
  data: TaskDetailViewData;
};

const IMPACT_PREVIEW_LIMIT = 3;

function ImpactColumn({
  title,
  lines,
  emptyText,
  tone,
  expanded,
}: {
  title: string;
  lines: PlayerEffectLine[];
  emptyText: string;
  tone: "success" | "fail";
  expanded: boolean;
}) {
  const visibleLines = expanded ? lines : lines.slice(0, IMPACT_PREVIEW_LIMIT);

  return (
    <div
      className={cn(
        "min-h-[56px] px-2.5 py-2",
        tone === "success" ? "bg-emerald-950/10" : "bg-rose-950/10",
      )}
    >
      <p
        className={cn(
          "mb-1 text-xs font-medium",
          tone === "success" ? "text-emerald-400/75" : "text-rose-400/75",
        )}
      >
        {title}
      </p>
      {lines.length === 0 ? (
        <p className="text-[11px] text-slate-500">{emptyText}</p>
      ) : (
        <ul className="space-y-0.5">
          {visibleLines.map((line) => (
            <li
              key={line.text}
              className={cn(
                "text-[13px] leading-4",
                tone === "success"
                  ? line.tone === "negative"
                    ? "text-amber-300/90"
                    : "text-emerald-400/90"
                  : line.tone === "positive"
                    ? "text-emerald-400/60"
                    : "text-rose-400/85",
              )}
            >
              · {line.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TagRow({
  label,
  tags,
  emptyText,
  tagClassName,
}: {
  label: string;
  tags: string[];
  emptyText: string;
  tagClassName?: string;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <span className="shrink-0 text-[11px] text-slate-500">{label}</span>
      {tags.length > 0 ? (
        tags.map((tag) => (
          <span key={tag} className={cn(taskDetailTag, tagClassName)}>
            {tag}
          </span>
        ))
      ) : (
        <span className="text-[11px] text-slate-500">{emptyText}</span>
      )}
    </div>
  );
}

export function TaskIntelImpactPanel({ data }: TaskIntelImpactPanelProps) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [impactsExpanded, setImpactsExpanded] = useState(false);

  const description = data.description || "暂无任务说明。";
  const descriptionLong = description.length > 80 || description.split("\n").length > 2;
  const hasMoreImpacts =
    data.successEffectsSummary.length > IMPACT_PREVIEW_LIMIT ||
    data.failEffectsSummary.length > IMPACT_PREVIEW_LIMIT;

  return (
    <section className={taskDetailPanel}>
      <div className={taskDetailPanelHeader}>
        <h3 className="text-sm font-medium text-cyan-100">任务情报与影响</h3>
      </div>

      <div className="space-y-2.5 p-3">
        <div>
          <p className="mb-0.5 text-xs font-medium text-slate-600">任务说明</p>
          <p
            className={cn(
              "text-[13px] leading-[1.5] text-slate-400",
              !descriptionExpanded && "line-clamp-2",
            )}
          >
            {description}
          </p>
          {descriptionLong ? (
            <TaskDetailExpandButton
              expanded={descriptionExpanded}
              onClick={() => setDescriptionExpanded((value) => !value)}
              expandLabel="展开完整说明"
              collapseLabel="收起说明"
            />
          ) : null}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-600">关键信息</p>
          <p className="text-xs text-slate-400">
            <span className="text-slate-600">结算模式 </span>
            {data.resolutionModeLabel}
          </p>
          <TagRow
            label="推荐岗位"
            tags={data.requiredJobLabels}
            emptyText="暂无"
            tagClassName="text-slate-400"
          />
          <TagRow
            label="关键节点"
            tags={data.milestoneLabels}
            emptyText="暂无"
            tagClassName="text-cyan-300/80"
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-600">影响预判</p>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            <ImpactColumn
              title="成功影响"
              lines={data.successEffectsSummary}
              emptyText="暂无成功影响"
              tone="success"
              expanded={impactsExpanded}
            />
            <ImpactColumn
              title="失败风险"
              lines={data.failEffectsSummary}
              emptyText="暂无失败风险"
              tone="fail"
              expanded={impactsExpanded}
            />
          </div>
          {hasMoreImpacts ? (
            <TaskDetailExpandButton
              expanded={impactsExpanded}
              onClick={() => setImpactsExpanded((value) => !value)}
              expandLabel="展开更多影响"
              collapseLabel="收起影响"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
