import { UserCircle } from "lucide-react";
import type { ProfileViewData } from "@/game/profilePresentationEngine";
import { taskDetailPanelHeader, taskDetailTag } from "../tasks/taskBoardUi";

type PlayerIdentityCardProps = {
  profile: Pick<
    ProfileViewData,
    | "nickname"
    | "jobLabel"
    | "level"
    | "chapterSubtitle"
    | "stageGoal"
    | "jobAbility"
    | "joinedAt"
    | "career"
  >;
};

function formatJoinDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function PlayerIdentityCard({ profile }: PlayerIdentityCardProps) {
  return (
    <header className="border-b border-cyan-400/8">
      <div className={`${taskDetailPanelHeader} flex flex-col gap-2`}>
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-cyan-400/80">
            <UserCircle className="size-4" />
            <p className="text-[11px] font-medium">成员状态 / 角色状态台</p>
          </div>
          <h1 className="text-lg font-semibold tracking-wide text-cyan-50">{profile.nickname}</h1>
          <p className="mt-0.5 max-w-2xl text-[11px] leading-relaxed text-slate-500">
            查看你的岗位能力、行动资源、成长进度与项目贡献。
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={`${taskDetailTag} text-cyan-200`}>{profile.jobLabel}</span>
            <span className={`${taskDetailTag} text-slate-400`}>{profile.jobAbility.roleTagline}</span>
            <span className={`${taskDetailTag} text-amber-200/90`}>Lv.{profile.level}</span>
            <span className={`${taskDetailTag} text-violet-200/90`}>{profile.career.currentRank.title}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[11px]">
          <span>
            <span className="text-slate-600">当前岗位 </span>
            <span className="text-cyan-100/90">{profile.jobLabel}</span>
          </span>
          <span className="text-slate-700">·</span>
          <span>
            <span className="text-slate-600">当前章节 </span>
            <span className="text-slate-400">{profile.chapterSubtitle}</span>
          </span>
          {profile.stageGoal ? (
            <>
              <span className="hidden text-slate-700 sm:inline">·</span>
              <span className="min-w-0 flex-1 basis-full sm:basis-auto">
                <span className="text-slate-600">阶段目标 </span>
                <span className="text-slate-500">{profile.stageGoal}</span>
              </span>
            </>
          ) : null}
        </div>

        <p className="line-clamp-1 text-[10px] text-slate-700">
          加入项目 {formatJoinDate(profile.joinedAt)}
        </p>
      </div>
    </header>
  );
}
