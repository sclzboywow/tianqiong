import Link from "next/link";
import { AlertTriangle, ArrowRight, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskItem } from "@/game/taskPresentationEngine";
import type { PlayerEffectLine } from "@/game/taskEffectPlayerDisplay";
import { playerCardClass } from "../playerTheme";

type TaskBoardCardProps = {
  item: TaskItem;
};

function EffectLines({ lines, label }: { lines: PlayerEffectLine[]; label: string }) {
  if (lines.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-[11px] text-[#8EA3B8]">{label}</p>
      <ul className="space-y-0.5">
        {lines.map((line) => (
          <li
            key={line.text}
            className={cn(
              "text-xs",
              line.tone === "positive" && "text-[#22C55E]",
              line.tone === "negative" && "text-[#EF4444]",
              line.tone === "neutral" && "text-[#8EA3B8]",
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
      return "border-[rgba(30,136,255,0.35)] bg-[rgba(30,136,255,0.12)] text-[#2EA8FF]";
    case "emergency":
      return "border-[rgba(250,204,21,0.35)] bg-[rgba(250,204,21,0.1)] text-[#FACC15]";
    case "collaboration":
      return "border-[rgba(168,85,247,0.35)] bg-[rgba(168,85,247,0.1)] text-[#C084FC]";
    case "completed":
      return "border-[rgba(60,160,255,0.12)] bg-[rgba(5,11,20,0.5)] text-[#8EA3B8]";
  }
}

export function TaskBoardCard({ item }: TaskBoardCardProps) {
  const isCompleted = item.isCompleted;
  const isEmergency = item.type === "emergency" && !isCompleted;

  const cardClass = cn(
    playerCardClass,
    "flex flex-col p-4 transition-colors",
    item.isRecommended && !isCompleted && "border-[#2EA8FF]",
    isEmergency && "border-[rgba(250,204,21,0.25)] bg-[rgba(250,204,21,0.04)]",
    isCompleted && "opacity-60",
  );

  const buttonLabel = isCompleted
    ? "查看结果"
    : isEmergency
      ? "立即处理"
      : "处理任务";

  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full border px-2 py-0.5 text-[11px]", typeBadgeClass(item.type))}>
            {item.typeLabel}
          </span>
          {item.isRecommended && !isCompleted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(30,136,255,0.15)] px-2 py-0.5 text-[10px] text-[#2EA8FF]">
              <Sparkles className="size-3" />
              推荐
            </span>
          )}
          {item.hasStageGate && item.type === "mainline" && !isCompleted && (
            <span className="rounded-full border border-[rgba(30,136,255,0.25)] px-2 py-0.5 text-[10px] text-[#2EA8FF]">
              阶段关键节点
            </span>
          )}
          {item.urgency && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(239,68,68,0.12)] px-2 py-0.5 text-[10px] text-[#EF4444]">
              <AlertTriangle className="size-3" />
              紧急度 {item.urgency}
            </span>
          )}
        </div>
        <span className="text-xs text-[#8EA3B8]">{item.statusLabel}</span>
      </div>

      <h3 className="mt-2 text-[15px] font-semibold leading-snug text-[#EAF3FF]">{item.title}</h3>

      {item.description && (
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#8EA3B8]">
          {item.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#8EA3B8]">
        <span className="rounded-md border border-[rgba(60,160,255,0.12)] px-2 py-0.5">
          来源：{item.sourceName}
        </span>
        <span className="rounded-md border border-[rgba(60,160,255,0.12)] px-2 py-0.5">
          成功率 {Math.round(item.baseSuccessRate)}%
        </span>
        <span className="rounded-md border border-[rgba(60,160,255,0.12)] px-2 py-0.5">
          任务等级 {item.rarity}
        </span>
        {(item.isCollaboration || item.requiredCount > 1) && (
          <span className="inline-flex items-center gap-1 rounded-md border border-[rgba(168,85,247,0.25)] px-2 py-0.5 text-[#C084FC]">
            <Users className="size-3" />
            {item.participantCount}/{item.requiredCount} 人
          </span>
        )}
      </div>

      {item.requiredJobLabels.length > 0 && item.isCollaboration && (
        <p className="mt-2 text-xs text-[#8EA3B8]">
          所需岗位：{item.requiredJobLabels.join("、")}
        </p>
      )}

      {item.milestoneLabels.length > 0 && (
        <p className="mt-2 text-xs text-[#2EA8FF]">
          关键节点：{item.milestoneLabels.join("、")}
        </p>
      )}

      {!isCompleted && item.successEffectsSummary.length > 0 && (
        <div className="mt-3">
          <EffectLines lines={item.successEffectsSummary} label="成功影响" />
        </div>
      )}

      {isEmergency && item.failEffectsSummary.length > 0 && (
        <div className="mt-3">
          <EffectLines lines={item.failEffectsSummary.slice(0, 2)} label="失败风险" />
        </div>
      )}

      <div className="mt-4">
        <Link
          href={item.href}
          className={cn(
            "inline-flex items-center gap-1 text-sm font-medium",
            isCompleted ? "text-[#8EA3B8] hover:text-[#EAF3FF]" : "text-[#2EA8FF] hover:underline",
          )}
        >
          {buttonLabel}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
