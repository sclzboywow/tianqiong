import { Briefcase, CalendarDays, ShieldCheck } from "lucide-react";
import type { ProfileViewData } from "@/game/profilePresentationEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

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
    <section
      className={`${playerCardClass} relative overflow-hidden border-[#2EA8FF] bg-[radial-gradient(circle_at_top_left,rgba(30,136,255,0.18),rgba(10,24,40,0.82)_44%,rgba(5,11,20,0.92))]`}
    >
      <div className="absolute -right-16 -top-20 size-52 rounded-full bg-[rgba(30,136,255,0.12)] blur-3xl" />

      <div className={`${playerCardHeaderClass} relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between`}>
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-[rgba(60,160,255,0.35)] bg-[rgba(30,136,255,0.14)] text-2xl font-bold text-[#2EA8FF]">
            {profile.nickname.slice(0, 1)}
          </div>
          <div>
            <p className="text-xs text-[#8EA3B8]">项目成员档案</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#EAF3FF] lg:text-3xl">
              {profile.nickname}
            </h2>
            <p className="mt-1 text-sm text-[#8EA3B8]">{profile.jobLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[rgba(250,204,21,0.35)] bg-[rgba(250,204,21,0.1)] px-3 py-1 text-sm font-semibold text-[#FACC15]">
            Lv.{profile.level}
          </span>
          <span className="rounded-full border border-[rgba(30,136,255,0.35)] bg-[rgba(30,136,255,0.12)] px-3 py-1 text-sm font-medium text-[#2EA8FF]">
            {profile.career.currentRank.title}
          </span>
        </div>
      </div>

      <div className={`${playerCardBodyClass} relative space-y-5`}>
        <p className="max-w-3xl text-base leading-relaxed text-[#EAF3FF]">
          {profile.jobAbility.identityLine}
        </p>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-[rgba(60,160,255,0.14)] bg-[rgba(5,11,20,0.42)] px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-xs text-[#8EA3B8]">
              <Briefcase className="size-4 text-[#2EA8FF]" />
              当前岗位
            </div>
            <p className="text-sm font-semibold text-[#EAF3FF]">{profile.jobLabel}</p>
            <p className="mt-1 text-xs text-[#8EA3B8]">{profile.jobAbility.roleTagline}</p>
          </div>

          <div className="rounded-xl border border-[rgba(60,160,255,0.14)] bg-[rgba(5,11,20,0.42)] px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-xs text-[#8EA3B8]">
              <ShieldCheck className="size-4 text-[#22C55E]" />
              当前章节
            </div>
            <p className="text-sm font-semibold text-[#EAF3FF]">{profile.chapterSubtitle}</p>
          </div>

          <div className="rounded-xl border border-[rgba(60,160,255,0.14)] bg-[rgba(5,11,20,0.42)] px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-xs text-[#8EA3B8]">
              <CalendarDays className="size-4 text-[#FACC15]" />
              加入项目
            </div>
            <p className="text-sm font-semibold text-[#EAF3FF]">{formatJoinDate(profile.joinedAt)}</p>
          </div>
        </div>

        {profile.stageGoal ? (
          <div className="rounded-xl border border-[rgba(46,168,255,0.18)] bg-[rgba(30,136,255,0.08)] px-4 py-3">
            <p className="text-xs text-[#2EA8FF]">当前阶段目标</p>
            <p className="mt-1 text-sm leading-relaxed text-[#C9D7E6]">{profile.stageGoal}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
