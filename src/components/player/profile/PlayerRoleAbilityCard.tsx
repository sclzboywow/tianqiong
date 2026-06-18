"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProfileViewData } from "@/game/profilePresentationEngine";
import type { CareerTrackConfig } from "@/game/careerTrackConfig";
import {
  taskDetailDivider,
  taskDetailExpandButton,
  taskDetailPanel,
  taskDetailPanelHeader,
  taskDetailTag,
} from "../tasks/taskBoardUi";
import { ProfileExpandButton } from "./profileExpand";

const ABILITY_PREVIEW_LIMIT = 3;
const TASK_TAG_PREVIEW_LIMIT = 4;

type PlayerRoleAbilityCardProps = {
  jobAbility: ProfileViewData["jobAbility"];
  track: CareerTrackConfig;
};

function buildStrengthSummary(track: CareerTrackConfig): string {
  const tasks = track.adaptedTasks.slice(0, 3);
  if (tasks.length === 0) return track.description;
  return `${track.title}相关任务 · ${tasks.join("、")}${track.adaptedTasks.length > 3 ? " 等" : ""}`;
}

export function PlayerRoleAbilityCard({ jobAbility, track }: PlayerRoleAbilityCardProps) {
  const [abilitiesExpanded, setAbilitiesExpanded] = useState(false);
  const [tasksExpanded, setTasksExpanded] = useState(false);

  const visibleAbilities = abilitiesExpanded
    ? jobAbility.abilities
    : jobAbility.abilities.slice(0, ABILITY_PREVIEW_LIMIT);
  const visibleTasks = tasksExpanded ? track.adaptedTasks : track.adaptedTasks.slice(0, TASK_TAG_PREVIEW_LIMIT);

  return (
    <section className={`${taskDetailPanel} h-full`}>
      <div className={taskDetailPanelHeader}>
        <h3 className="flex items-center gap-2 text-[12px] font-medium text-cyan-100">
          <Briefcase className="size-3.5 text-cyan-400/80" />
          岗位能力与专业方向
        </h3>
      </div>

      <div className="space-y-2 p-3">
        <div className="bg-cyan-950/10 px-2.5 py-2">
          <p className="text-[10px] font-medium text-cyan-400/70">能力画像</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {jobAbility.jobLabel} · {jobAbility.roleTagline}
          </p>
          <p className="mt-1 text-[12px] font-medium leading-[1.45] text-cyan-50/95">
            擅长处理：{buildStrengthSummary(track)}
          </p>
        </div>

        <div>
          <p className="mb-0.5 text-[10px] font-medium text-slate-600">核心能力</p>
          {visibleAbilities.length === 0 ? (
            <p className="text-[11px] text-slate-600">暂无能力说明</p>
          ) : (
            <ul className={`${taskDetailDivider} bg-slate-950/10`}>
              {visibleAbilities.map((ability) => (
                <li key={ability} className="px-1 py-1 text-[11px] leading-[1.4] text-slate-300">
                  · {ability}
                </li>
              ))}
            </ul>
          )}
          {jobAbility.abilities.length > ABILITY_PREVIEW_LIMIT ? (
            <ProfileExpandButton
              expanded={abilitiesExpanded}
              onClick={() => setAbilitiesExpanded((value) => !value)}
              expandLabel={`展开全部能力（${jobAbility.abilities.length}条）`}
              collapseLabel="收起能力"
            />
          ) : null}
        </div>

        <div>
          <p className="mb-1 text-[10px] font-medium text-slate-600">适配任务</p>
          <div className="flex flex-wrap gap-1">
            {visibleTasks.map((task) => (
              <span key={task} className={cn(taskDetailTag, "text-cyan-200/80")}>
                {task}
              </span>
            ))}
          </div>
          {track.adaptedTasks.length > TASK_TAG_PREVIEW_LIMIT ? (
            <ProfileExpandButton
              expanded={tasksExpanded}
              onClick={() => setTasksExpanded((value) => !value)}
              expandLabel={`展开全部标签（${track.adaptedTasks.length}个）`}
              collapseLabel="收起标签"
            />
          ) : null}
          <Link href="/tasks" className={`${taskDetailExpandButton} mt-1.5 inline-block`}>
            查看适配任务 →
          </Link>
        </div>
      </div>
    </section>
  );
}
