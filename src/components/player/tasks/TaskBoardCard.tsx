import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskItem } from "@/game/taskPresentationEngine";
import type { PlayerEffectLine } from "@/game/taskEffectPlayerDisplay";
import { taskHudButtonPrimary, taskHudButtonSecondary, taskHudPanel, taskHudTag } from "./taskBoardUi";

type TaskBoardCardProps = {
  item: TaskItem;
};

function EffectLines({ lines, label }: { lines: PlayerEffectLine[]; label: string }) {
  if (lines.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-[10px] text-slate-500">{label}</p>
      <ul className="space-y-0.5">
        {lines.map((line) => (
          <li
            key={line.text}
            className={cn(
              "text-[11px]",
              line.tone === "positive" && "text-emerald-400",
              line.tone === "negative" && "text-rose-400",
              line.tone === "neutral" && "text-slate-500",
            )}
          >
            · {line.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function typeBadgeClass(type: TaskItem["type"]) {
  switch (type) {
    case "mainline":
      return "border-cyan-400/35 bg-cyan-950/30 text-cyan-100";
    case "emergency":
      return "border-amber-400/35 bg-amber-950/25 text-amber-100";
    case "collaboration":
      return "border-violet-400/30 bg-violet-950/25 text-violet-100";
    case "completed":
      return "border-slate-600/30 bg-slate-950/50 text-slate-500";
  }
}

function accentClass(item: TaskItem) {
  if (item.isCompleted) return "bg-slate-600";
  if (item.type === "emergency") return "bg-amber-400/80";
  if (item.type === "collaboration") return "bg-violet-400/80";
  return "bg-cyan-400/80";
}

export function TaskBoardCard({ item }: TaskBoardCardProps) {
  const isCompleted = item.isCompleted;
  const isMainline = item.type === "mainline" && !isCompleted;
  const isEmergency = item.type === "emergency" && !isCompleted;
  const isCollaboration = item.type === "collaboration" && !isCompleted;
  const settlementLabel = isCompleted ? "查看结果" : isEmergency ? "进入结算" : "查看任务 / 结算";
  const locationLabel = item.sourceLocationName
    ? `前往 ${item.sourceLocationName}`
    : "前往协同地图";

  return (
    <article
      className={cn(
        "group relative border bg-slate-950/45 p-3 transition-colors",
        item.isRecommended && !isCompleted ? "border-cyan-400/40" : "border-cyan-400/12",
        isEmergency && "bg-amber-950/15",
        isCompleted && "opacity-70",
      )}
    >
      <div className={cn("absolute inset-y-0 left-0 w-0.5", accentClass(item))} />

      <div className="pl-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn(taskHudTag, typeBadgeClass(item.type))}>{item.typeLabel}</span>
            {item.isRecommended && !isCompleted ? (
              <span className={cn(taskHudTag, "border-cyan-400/30 text-cyan-200")}>
                <Sparkles className="mr-0.5 inline size-3" />
                优先
              </span>
            ) : null}
          </div>

          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
            {isCompleted ? <CheckCircle2 className="size-3" /> : <Clock3 className="size-3" />}
            {item.statusLabel}
          </span>
        </div>

        <h3 className="mt-2 text-[14px] font-semibold leading-snug text-cyan-50">{item.title}</h3>

        {item.description ? (
          <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-slate-500">
            {item.description}
          </p>
        ) : null}

        {item.sourceLocationName ? (
          <p className="mt-2 text-[10px] text-emerald-200/80">
            关联地点：{item.sourceLocationName}
          </p>
        ) : null}

        <div className={`${taskHudPanel} mt-2 inline-block px-2 py-1 text-[10px] text-slate-500`}>
          成功率{" "}
          <span className="font-semibold text-slate-300">{Math.round(item.baseSuccessRate)}%</span>
        </div>

        {isMainline && item.hasStageGate ? (
          <p className="mt-2 text-[11px] text-cyan-300/90">
            阶段关键节点
            {item.milestoneLabels.length > 0 ? `：${item.milestoneLabels.join("、")}` : ""}
          </p>
        ) : null}

        {isCollaboration ? (
          <div className="mt-2 space-y-1 text-[11px] text-slate-500">
            {(item.isCollaboration || item.requiredCount > 1) && (
              <span className={cn(taskHudTag, "border-violet-400/25 text-violet-200")}>
                <Users className="mr-0.5 inline size-3" />
                {item.participantCount}/{item.requiredCount} 人
              </span>
            )}
            {item.requiredJobLabels.length > 0 ? (
              <p>所需岗位：{item.requiredJobLabels.join("、")}</p>
            ) : null}
          </div>
        ) : null}

        {isEmergency && item.failEffectsSummary.length > 0 ? (
          <div className={`${taskHudPanel} mt-2 border-rose-400/20 bg-rose-950/15 px-2.5 py-2`}>
            <EffectLines lines={item.failEffectsSummary.slice(0, 2)} label="拖延风险" />
          </div>
        ) : null}

        {isEmergency && item.urgency ? (
          <span className={cn(taskHudTag, "mt-2 border-rose-400/30 text-rose-300")}>
            <AlertTriangle className="mr-0.5 inline size-3" />
            {item.urgency}风险
          </span>
        ) : null}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          {!isCompleted && item.locationHref ? (
            <Link href={item.locationHref} className={taskHudButtonPrimary}>
              <MapPin className="size-3.5 shrink-0" />
              {locationLabel}
            </Link>
          ) : null}
          <Link
            href={item.href}
            className={cn(
              isCompleted || !item.locationHref ? taskHudButtonPrimary : taskHudButtonSecondary,
            )}
          >
            {settlementLabel}
            <ArrowRight className="size-3.5 shrink-0" />
          </Link>
        </div>
      </div>
    </article>
  );
}
