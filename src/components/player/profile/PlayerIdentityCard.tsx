import { UserRound } from "lucide-react";
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
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg border border-[rgba(60,160,255,0.25)] bg-[rgba(30,136,255,0.12)]">
            <UserRound className="size-4 text-[#2EA8FF]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#EAF3FF]">{profile.nickname}</h2>
            <p className="text-xs text-[#8EA3B8]">{profile.jobLabel}</p>
          </div>
        </div>
      </div>

      <div className={playerCardBodyClass}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-[rgba(250,204,21,0.35)] bg-[rgba(250,204,21,0.1)] px-2.5 py-1 text-sm font-semibold text-[#FACC15]">
            Lv.{profile.level}
          </span>
          <span className="rounded-md border border-[rgba(30,136,255,0.35)] bg-[rgba(30,136,255,0.12)] px-2.5 py-1 text-xs font-medium text-[#2EA8FF]">
            {profile.career.currentRank.title}
          </span>
          <span className="rounded-md border border-[rgba(60,160,255,0.22)] bg-[rgba(5,11,20,0.5)] px-2.5 py-1 text-xs text-[#8EA3B8]">
            {profile.chapterSubtitle}
          </span>
        </div>

        <p className="text-[13px] leading-relaxed text-[#EAF3FF]/90 lg:text-sm">
          {profile.jobAbility.identityLine}
        </p>

        {profile.stageGoal ? (
          <p className="mt-3 text-xs leading-relaxed text-[#8EA3B8]">
            当前阶段目标：{profile.stageGoal}
          </p>
        ) : null}

        <p className="mt-4 text-[11px] text-[#8EA3B8]/80">
          加入项目 · {formatJoinDate(profile.joinedAt)}
        </p>
      </div>
    </section>
  );
}
