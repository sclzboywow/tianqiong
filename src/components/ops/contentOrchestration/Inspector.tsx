"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  CleanupItem,
  OrchestrationAction,
  OrchestrationArtifact,
  OrchestrationEvent,
  OrchestrationStoryEntry,
  OrchestrationTask,
} from "@/game/contentOrchestrationLoader";
import type { InspectorSelection } from "./types";
import {
  DebugTaskLink,
  InspectorField,
  PayloadEditLink,
  adminLink,
  sourceBadge,
} from "./utils";

type InspectorProps = {
  selection: InspectorSelection;
  onClose: () => void;
};

function ListField({ label, items }: { label: string; items: string[] }) {
  return (
    <InspectorField
      label={label}
      value={items.length > 0 ? items.join(", ") : "—"}
      mono
    />
  );
}

export function ContentOrchestrationInspector({ selection, onClose }: InspectorProps) {
  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-zinc-800 bg-zinc-950/90 xl:w-96">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-medium text-zinc-200">详情</h2>
        {selection ? (
          <button
            type="button"
            onClick={onClose}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs text-zinc-400")}
          >
            关闭
          </button>
        ) : null}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {!selection ? (
          <p className="text-sm text-zinc-500">点击卡片查看完整字段与 Payload 编辑入口。</p>
        ) : selection.kind === "task" ? (
          <TaskInspector task={selection.item} />
        ) : selection.kind === "artifact" ? (
          <ArtifactInspector artifact={selection.item} />
        ) : selection.kind === "action" ? (
          <ActionInspector action={selection.item} />
        ) : selection.kind === "event" ? (
          <EventInspector event={selection.item} />
        ) : selection.kind === "story" ? (
          <StoryInspector entry={selection.item} />
        ) : selection.kind === "cleanup" ? (
          <CleanupInspector label={selection.label} item={selection.item} />
        ) : (
          <StageInspector
            stageId={selection.stageId}
            stageName={selection.stageName}
            summary={selection.summary}
          />
        )}
      </div>
    </aside>
  );
}

function TaskInspector({ task }: { task: OrchestrationTask }) {
  const taskLink = adminLink("task-templates", task.payloadDocId, task.slug);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium text-zinc-100">{task.title}</h3>
        <p className="mt-1 font-mono text-xs text-zinc-500">{task.slug}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {sourceBadge(task.source)}
          {task.mismatchFields.map((field) => (
            <Badge key={field} variant="outline" className="border-amber-600 text-amber-300 text-xs">
              {field}
            </Badge>
          ))}
        </div>
      </div>
      <InspectorField label="阶段" value={task.stage} />
      <InspectorField label="类别" value={task.category} />
      <InspectorField label="stageProgress" value={task.stageProgress} />
      <InspectorField label="enabled" value={task.enabled ?? true} />
      <ListField label="前置任务" items={task.prerequisiteTaskSlugs} />
      <ListField label="requiredMilestones" items={task.requiredMilestones} />
      <ListField label="输入成果物" items={task.inputArtifacts} />
      <ListField label="输出成果物" items={task.outputArtifacts} />
      <ListField label="milestoneEffects" items={task.milestoneEffects} />
      <ListField label="地点行动" items={task.relatedActionSlugs} />
      <InspectorField label="StoryEntry" value={task.relatedStorySlug} mono />
      <ListField label="关联事件" items={task.relatedEventSlugs} />
      <InspectorField label="payloadDocId" value={task.payloadDocId} mono />
      <InspectorField label="storyEntryDocId" value={task.storyEntryDocId} mono />
      {taskLink.missing ? (
        <p className="text-xs text-amber-400">后台记录缺失，请先 payload:seed:local</p>
      ) : null}
      {task.source === "seedFallback" && !taskLink.missing ? (
        <p className="text-xs text-amber-400">使用 seed 基准，后台未同步</p>
      ) : null}
      <div className="flex flex-wrap gap-2 pt-2">
        <PayloadEditLink collection="task-templates" docId={task.payloadDocId} slug={task.slug} label="编辑任务" />
        {task.relatedStorySlug ? (
          <PayloadEditLink
            collection="story-entries"
            docId={task.storyEntryDocId}
            slug={task.relatedStorySlug}
            label="编辑剧情"
          />
        ) : null}
        <DebugTaskLink slug={task.slug} />
      </div>
    </div>
  );
}

function ArtifactInspector({ artifact }: { artifact: OrchestrationArtifact }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium text-zinc-100">{artifact.name}</h3>
        <p className="mt-1 font-mono text-xs text-zinc-500">{artifact.slug}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {sourceBadge(artifact.source)}
          {artifact.undefinedRefs.map((ref) => (
            <Badge key={ref} variant="outline" className="border-amber-600 text-amber-300 text-xs">
              {ref}
            </Badge>
          ))}
        </div>
      </div>
      <InspectorField label="阶段" value={artifact.stage} />
      <InspectorField label="defaultStatus" value={artifact.defaultStatus} />
      <ListField label="allowedStatuses" items={artifact.allowedStatuses} />
      <InspectorField label="主线使用" value={artifact.usedByMainline ? "是" : "否"} />
      <ListField label="产出任务" items={artifact.producedBy} />
      <ListField label="依赖任务" items={artifact.requiredBy} />
      <ListField label="事件影响" items={artifact.affectedByEvents} />
      <InspectorField label="enabled" value={artifact.enabled ?? true} />
      <InspectorField label="payloadDocId" value={artifact.payloadDocId} mono />
      <PayloadEditLink
        collection="artifact-definitions"
        docId={artifact.payloadDocId}
        slug={artifact.slug}
      />
    </div>
  );
}

function ActionInspector({ action }: { action: OrchestrationAction }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium text-zinc-100">{action.label}</h3>
        <p className="mt-1 font-mono text-xs text-zinc-500">{action.slug}</p>
        {action.risks.length > 0 ? (
          <ul className="mt-2 space-y-1 text-xs text-rose-300">
            {action.risks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <InspectorField label="地点" value={action.locationSlug} mono />
      <InspectorField label="解锁阶段" value={action.unlockStage} />
      <ListField label="unlockMilestones" items={action.unlockMilestones} />
      <ListField label="触发任务" items={action.triggerTaskSlugs} />
      <ListField label="关联 NPC" items={action.relatedNpcNames} />
      <InspectorField label="sortOrder" value={action.sortOrder} />
      <InspectorField label="enabled" value={action.enabled ?? true} />
      <InspectorField label="payloadDocId" value={action.payloadDocId} mono />
      <PayloadEditLink
        collection="location-actions"
        docId={action.payloadDocId}
        slug={action.slug}
      />
    </div>
  );
}

function EventInspector({ event }: { event: OrchestrationEvent }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium text-zinc-100">{event.title}</h3>
        <p className="mt-1 font-mono text-xs text-zinc-500">{event.slug}</p>
        {event.risks.length > 0 ? (
          <ul className="mt-2 space-y-1 text-xs text-rose-300">
            {event.risks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <InspectorField label="类型" value={event.kind} />
      <InspectorField label="category" value={event.category} />
      <InspectorField label="enabled" value={event.enabled ?? true} />
      <InspectorField label="triggerStage" value={event.triggerStage} />
      <ListField label="triggerLocationSlugs" items={event.triggerLocationSlugs} />
      <ListField label="triggerTaskSlugs" items={event.triggerTaskSlugs} />
      <ListField label="artifactEffects" items={event.artifactEffects} />
      <ListField label="taskEffects" items={event.taskEffects} />
      <ListField label="metricEffects" items={event.metricEffects} />
      <InspectorField label="storySlug" value={event.storySlug} mono />
      <InspectorField label="inkFile" value={event.inkFile} mono />
      <InspectorField label="payloadDocId" value={event.payloadDocId} mono />
      <PayloadEditLink
        collection="event-templates"
        docId={event.payloadDocId}
        slug={event.slug}
      />
    </div>
  );
}

function StoryInspector({ entry }: { entry: OrchestrationStoryEntry }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium text-zinc-100">{entry.title}</h3>
        <p className="mt-1 font-mono text-xs text-zinc-500">{entry.slug}</p>
        {entry.risks.length > 0 ? (
          <ul className="mt-2 space-y-1 text-xs text-rose-300">
            {entry.risks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <InspectorField label="storyType" value={entry.storyType} />
      <InspectorField label="status" value={entry.status} />
      <InspectorField label="enabled" value={entry.enabled ?? true} />
      <InspectorField label="inkFile" value={entry.inkFile} mono />
      <InspectorField label="compiledFile" value={entry.compiledFile} mono />
      <ListField label="relatedTaskSlugs" items={entry.relatedTaskSlugs} />
      <ListField label="relatedEventSlugs" items={entry.relatedEventSlugs} />
      <InspectorField label="payloadDocId" value={entry.payloadDocId} mono />
      <PayloadEditLink
        collection="story-entries"
        docId={entry.payloadDocId}
        slug={entry.slug}
      />
    </div>
  );
}

function CleanupInspector({ label, item }: { label: string; item: CleanupItem }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium text-amber-200">旧数据残留</h3>
        <p className="mt-1 text-sm text-zinc-400">{label}</p>
      </div>
      <InspectorField label="slug" value={item.slug} mono />
      <InspectorField label="kind" value={item.kind} />
      <InspectorField label="source" value={item.source} />
      <InspectorField label="detail" value={item.detail} />
      <p className="text-xs text-zinc-500">
        建议执行{" "}
        <span className="font-mono text-amber-300">npm run cleanup:legacy-chapter1:apply</span>
      </p>
    </div>
  );
}

function StageInspector({
  stageId,
  stageName,
  summary,
}: {
  stageId: string;
  stageName: string;
  summary: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium text-zinc-100">{stageName}</h3>
        <p className="mt-1 font-mono text-xs text-zinc-500">{stageId}</p>
      </div>
      <InspectorField label="摘要" value={summary} />
      <Link
        href="/ops/content-studio?tab=mainline"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
      >
        打开主线调试
      </Link>
    </div>
  );
}
