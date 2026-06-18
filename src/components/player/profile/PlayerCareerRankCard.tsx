"use client";

import { useMemo, useState } from "react";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CareerRankView } from "@/game/careerRankEngine";
import {
  taskDetailDivider,
  taskDetailPanel,
  taskDetailPanelHeader,
} from "../tasks/taskBoardUi";
import { ProfileExpandButton } from "./profileExpand";

const REQUIREMENT_PREVIEW_LIMIT = 3;

type PlayerCareerRankCardProps = {
  career: CareerRankView;
};

export function PlayerCareerRankCard({ career }: PlayerCareerRankCardProps) {
  const [requirementsExpanded, setRequirementsExpanded] = useState(false);
  const [permissionsExpanded, setPermissionsExpanded] = useState(false);

  const { currentRank, nextRank, requirements, progressPercent, unlocks, bonusDescription } =
    career;

  const sortedRequirements = useMemo(
    () =>
      [...requirements].sort((a, b) => {
        if (a.passed !== b.passed) return a.passed ? 1 : -1;
        return 0;
      }),
    [requirements],
  );

  const pendingRequirements = sortedRequirements.filter((req) => !req.passed);
  const visibleRequirements = requirementsExpanded
    ? sortedRequirements
    : sortedRequirements.slice(0, REQUIREMENT_PREVIEW_LIMIT);

  const hasPermissionDetails = unlocks.length > 0 || !!bonusDescription;

  return (
    <section className={taskDetailPanel}>
      <div className={taskDetailPanelHeader}>
        <h3 className="flex items-center gap-2 text-sm font-medium text-cyan-100">
          <Award className="size-3.5 text-violet-400/80" />
          职业晋升
        </h3>
      </div>

      <div className="space-y-2 p-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[11px]">
          <span>
            <span className="text-slate-600">当前 </span>
            <span className="text-violet-200/90">{currentRank.title}</span>
          </span>
          {nextRank ? (
            <>
              <span className="text-slate-700">→</span>
              <span>
                <span className="text-slate-600">下一阶 </span>
                <span className="text-cyan-100">{nextRank.title}</span>
              </span>
            </>
          ) : (
            <span className="text-emerald-400/85">已达最高阶位</span>
          )}
        </div>

        {nextRank ? (
          <>
            {pendingRequirements.length > 0 ? (
              <div className="bg-cyan-950/10 px-2.5 py-2">
                <p className="text-sm font-medium text-cyan-100">
                  下一阶还差 {pendingRequirements.length} 项
                </p>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  优先完成未达成条件即可推进晋升
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-emerald-400/85">晋升条件已满足，等待系统确认</p>
            )}

            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-600">晋升进度</span>
                <span className="tabular-nums text-cyan-200/90">{progressPercent}%</span>
              </div>
              <div className="h-1 overflow-hidden bg-slate-950/40">
                <div className="h-full bg-cyan-400/40" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            {sortedRequirements.length > 0 ? (
              <div>
                <p className="mb-1 text-xs font-medium text-slate-600">晋升条件</p>
                <ul className={`${taskDetailDivider} bg-slate-950/10`}>
                  {visibleRequirements.map((req) => (
                    <li
                      key={req.label}
                      className={cn(
                        "flex items-start justify-between gap-2 px-1 py-1.5 text-[11px]",
                        !req.passed && "bg-cyan-950/15",
                      )}
                    >
                      <span
                        className={cn(
                          req.passed
                            ? "text-slate-600 line-through decoration-slate-700"
                            : "font-medium text-cyan-100",
                        )}
                      >
                        {req.passed ? "✓ " : "○ "}
                        {req.label}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 tabular-nums",
                          req.passed ? "text-slate-700" : "text-cyan-300/80",
                        )}
                      >
                        {req.current}/{String(req.target)}
                      </span>
                    </li>
                  ))}
                </ul>
                {sortedRequirements.length > REQUIREMENT_PREVIEW_LIMIT ? (
                  <ProfileExpandButton
                    expanded={requirementsExpanded}
                    onClick={() => setRequirementsExpanded((value) => !value)}
                    expandLabel={`展开全部条件（${sortedRequirements.length}条）`}
                    collapseLabel="收起条件"
                  />
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}

        {hasPermissionDetails ? (
          <div className="border-t border-cyan-400/5 pt-1.5">
            {!permissionsExpanded ? (
              <ProfileExpandButton
                expanded={false}
                onClick={() => setPermissionsExpanded(true)}
                expandLabel="查看阶位权限"
                collapseLabel="收起阶位权限"
              />
            ) : (
              <div className="space-y-1.5">
                {unlocks.length > 0 ? (
                  <ul className="space-y-0.5">
                    {unlocks.map((item) => (
                      <li key={item} className="text-[13px] leading-[1.4] text-slate-400">
                        · {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {bonusDescription ? (
                  <p className="text-[10px] leading-[1.4] text-slate-600">{bonusDescription}</p>
                ) : null}
                <ProfileExpandButton
                  expanded
                  onClick={() => setPermissionsExpanded(false)}
                  expandLabel="查看阶位权限"
                  collapseLabel="收起阶位权限"
                />
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
