import Link from "next/link";
import { AlertTriangle, Lock, MapPin } from "lucide-react";
import type { Task } from "@prisma/client";
import type { LocationOverview } from "@/game/locationEngine";
import type { RelatedContentDisplayItem } from "@/game/contentUnlockEngine";
import { getRiskTagLabel } from "@/data/riskTagLabels";
import { TASK_STATUS_LABELS } from "@/game/taskPresentationEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

type LocationDetailHeaderProps = {
  overview: LocationOverview;
  stageName: string;
};

export function LocationDetailHeader({ overview, stageName }: LocationDetailHeaderProps) {
  const { location, unlocked, unlockRequirements, typeLabel } = overview;

  return (
    <div className="space-y-4">
      <section className={playerCardClass}>
        <div className={playerCardHeaderClass}>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-5 shrink-0 text-[#2EA8FF]" />
            <div>
              <h1 className="text-xl font-semibold text-[#EAF3FF]">{location.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-[rgba(60,160,255,0.18)] px-2.5 py-0.5 text-[#8EA3B8]">
                  {typeLabel}
                </span>
                <span className="rounded-full border border-[rgba(60,160,255,0.18)] px-2.5 py-0.5 text-[#8EA3B8]">
                  {location.group}
                </span>
                <span className="rounded-full border border-[rgba(60,160,255,0.18)] px-2.5 py-0.5 text-[#8EA3B8]">
                  阶段：{stageName}
                </span>
                <span
                  className={
                    unlocked
                      ? "rounded-full border border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.1)] px-2.5 py-0.5 text-[#22C55E]"
                      : "rounded-full border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-2.5 py-0.5 text-[#EF4444]"
                  }
                >
                  {unlocked ? "已解锁" : "未解锁"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={playerCardBodyClass}>
          <p className="text-[13px] leading-relaxed text-[#8EA3B8] lg:text-sm">{location.description}</p>
        </div>
      </section>

      {!unlocked && (
        <section className="rounded-xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[#FCA5A5]">
            <Lock className="size-4" />
            该地点尚未开放
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#FCA5A5]/90">
            {unlockRequirements.map((req) => (
              <li key={req}>{req}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ContentBadgeList({
  label,
  items,
}: {
  label: string;
  items: RelatedContentDisplayItem[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs text-[#8EA3B8]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.name}
            className={
              item.preview
                ? "rounded-md border border-[rgba(60,160,255,0.12)] px-2 py-0.5 text-xs text-[#8EA3B8]/70"
                : "rounded-md border border-[rgba(60,160,255,0.18)] px-2 py-0.5 text-xs text-[#EAF3FF]"
            }
          >
            {item.preview ? `${item.name}（尚未出现）` : item.name}
          </span>
        ))}
      </div>
    </div>
  );
}

type LocationIntelExtrasProps = {
  overview: LocationOverview;
};

export function LocationIntelExtras({ overview }: LocationIntelExtrasProps) {
  const { location, unlocked, relatedTasks, relatedNpcs, relatedAreas } = overview;
  if (!unlocked) return null;

  const hasNpcOrArea = relatedNpcs.length > 0 || relatedAreas.length > 0;
  const hasRisk = location.riskTags && location.riskTags.length > 0;

  if (!hasNpcOrArea && !hasRisk && relatedTasks.length === 0) return null;

  return (
    <div className="space-y-4">
      {hasNpcOrArea && (
        <section className={playerCardClass}>
          <div className={playerCardHeaderClass}>
            <h3 className="text-base font-semibold text-[#EAF3FF]">关联角色与区域</h3>
          </div>
          <div className={`${playerCardBodyClass} space-y-4`}>
            <ContentBadgeList label="关联 NPC" items={relatedNpcs} />
            <ContentBadgeList label="关联区域" items={relatedAreas} />
          </div>
        </section>
      )}

      {hasRisk && (
        <section className={playerCardClass}>
          <div className={playerCardHeaderClass}>
            <h3 className="text-base font-semibold text-[#EAF3FF]">风险标签</h3>
          </div>
          <div className={playerCardBodyClass}>
            <div className="flex flex-wrap gap-2">
              {location.riskTags!.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-[rgba(250,204,21,0.1)] px-2 py-0.5 text-xs text-[#FACC15]"
                >
                  <AlertTriangle className="size-3" />
                  {getRiskTagLabel(tag)}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={playerCardClass}>
        <div className={playerCardHeaderClass}>
          <h3 className="text-base font-semibold text-[#EAF3FF]">本地点待办</h3>
        </div>
        <div className={playerCardBodyClass}>
          {relatedTasks.length === 0 ? (
            <p className="text-sm text-[#8EA3B8]">当前暂无待处理任务。</p>
          ) : (
            <ul className="space-y-2">
              {relatedTasks.map((task) => (
                <LocationPendingTaskRow key={task.id} task={task} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function LocationPendingTaskRow({ task }: { task: Task }) {
  const statusLabel = TASK_STATUS_LABELS[task.status] || task.status;

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-[rgba(60,160,255,0.15)] bg-[rgba(5,11,20,0.4)] px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm text-[#EAF3FF]">{task.title}</p>
        <p className="mt-0.5 text-xs text-[#8EA3B8]">{statusLabel}</p>
      </div>
      <Link
        href={`/tasks/${task.id}`}
        className="shrink-0 rounded-md border border-[rgba(60,160,255,0.25)] px-2.5 py-1 text-xs text-[#2EA8FF] hover:border-[#2EA8FF]"
      >
        前往处理
      </Link>
    </li>
  );
}

/** @deprecated 使用 LocationDetailHeader + LocationIntelExtras */
export function LocationIntelPanel({
  overview,
  stageName,
}: {
  overview: LocationOverview;
  stageName: string;
}) {
  return (
    <>
      <LocationDetailHeader overview={overview} stageName={stageName} />
      <LocationIntelExtras overview={overview} />
    </>
  );
}
