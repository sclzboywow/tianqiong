import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskItem } from "@/game/taskPresentationEngine";
import type { PlayerEffectLine } from "@/game/taskEffectPlayerDisplay";

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

function accentClass(item: TaskItem) {
  if (item.isCompleted) return "bg-[#64748B]";
  if (item.type === "emergency") return "bg-[#FACC15]";
  if (item.type === "collaboration") return "bg-[#C084FC]";
  return "bg-[#2EA8FF]";
}

export function TaskBoardCard({ item }: TaskBoardCardProps) {
  const isCompleted = item.isCompleted;
  const isMainline = item.type === "mainline" && !isCompleted;
  const isEmergency = item.type === "emergency" && !isCompleted;
  const isCollaboration = item.type === "collaboration" && !isCompleted;
  const buttonLabel = isCompleted ? "查看结果" : isEmergency ? "立即处理" : "处理任务";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-[rgba(7,17,31,0.82)] p-4 transition-colors",
        item.isRecommended && !isCompleted
          ? "border-[#2EA8FF] shadow-[0_0_18px_rgba(30,136,255,0.1)]"
          : "border-[rgba(60,160,255,0.16)]",
        isEmergency && "bg-[rgba(250,204,21,0.045)]",
        isCompleted && "opacity-65",
      )}
    >
      <div className={cn("absolute inset-y-0 left-0 w-1", accentClass(item))} />

      <div className="pl-2">
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
          </div>

          <span className="inline-flex items-center gap-1 text-xs text-[#8EA3B8]">
            {isCompleted ? <CheckCircle2 className="size-3" /> : <Clock3 className="size-3" />}
            {item.statusLabel}
          </span>
        </div>

        <h3 className="mt-3 text-[16px] font-semibold leading-snug text-[#EAF3FF]">
          {item.title}
        </h3>

        {item.description && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#8EA3B8]">
            {item.description}
          </p>
        )}

        <div className="mt-3 rounded-lg border border-[rgba(60,160,255,0.1)] bg-[rgba(5,11,20,0.36)] px-3 py-2 text-[11px] text-[#8EA3B8]">
          <p>成功率</p>
          <p className="mt-0.5 text-sm font-semibold text-[#EAF3FF]">
            {Math.round(item.baseSuccessRate)}%
          </p>
        </div>

        {isMainline && item.hasStageGate && (
          <p className="mt-2 text-xs text-[#2EA8FF]">
            阶段关键节点
            {item.milestoneLabels.length > 0 ? `：${item.milestoneLabels.join("、")}` : ""}
          </p>
        )}

        {isCollaboration && (
          <div className="mt-2 space-y-1 text-xs text-[#8EA3B8]">
            {(item.isCollaboration || item.requiredCount > 1) && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[rgba(168,85,247,0.25)] px-2 py-0.5 text-[#C084FC]">
                <Users className="size-3" />
                {item.participantCount}/{item.requiredCount} 人
              </span>
            )}
            {item.requiredJobLabels.length > 0 && (
              <p>所需岗位：{item.requiredJobLabels.join("、")}</p>
            )}
          </div>
        )}

        {isEmergency && item.failEffectsSummary.length > 0 && (
          <div className="mt-3 rounded-xl border border-[rgba(239,68,68,0.18)] bg-[rgba(239,68,68,0.06)] px-3 py-3">
            <EffectLines lines={item.failEffectsSummary.slice(0, 2)} label="拖延风险" />
          </div>
        )}

        {isEmergency && item.urgency && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[rgba(239,68,68,0.12)] px-2 py-0.5 text-[10px] text-[#EF4444]">
            <AlertTriangle className="size-3" />
            {item.urgency}风险
          </span>
        )}

        <Link
          href={item.href}
          className={cn(
            "mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors",
            isCompleted
              ? "border border-[rgba(60,160,255,0.18)] text-[#C9D7E6] hover:border-[#2EA8FF]"
              : "bg-[#1E88FF] text-white hover:bg-[#2EA8FF]",
          )}
        >
          {buttonLabel}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
