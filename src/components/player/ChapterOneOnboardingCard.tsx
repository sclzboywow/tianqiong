"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Compass, X } from "lucide-react";
import { isOnboardingSeen, markOnboardingSeen } from "@/lib/onboardingStorage";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "./playerTheme";

type ChapterOneOnboardingCardProps = {
  recommendedHref: string;
  recommendedLocationName?: string;
  recommendedActionLabel?: string;
};

function subscribeToOnboardingStore() {
  return () => {};
}

function shouldShowOnboarding() {
  return !isOnboardingSeen();
}

export function ChapterOneOnboardingCard({
  recommendedHref,
  recommendedLocationName,
  recommendedActionLabel,
}: ChapterOneOnboardingCardProps) {
  const shouldShowStoredOnboarding = useSyncExternalStore(
    subscribeToOnboardingStore,
    shouldShowOnboarding,
    () => false,
  );
  const [dismissed, setDismissed] = useState(false);
  const visible = shouldShowStoredOnboarding && !dismissed;

  if (!visible) return null;

  const locationHint =
    recommendedLocationName && recommendedActionLabel
      ? `第一步建议前往「${recommendedLocationName}」，${recommendedActionLabel}。`
      : recommendedLocationName
        ? `第一步建议前往「${recommendedLocationName}」，召开项目启动会。`
        : "第一步建议前往「建设主体 · 项目管理部」，召开项目启动会。";

  function dismiss() {
    markOnboardingSeen();
    setDismissed(true);
  }

  function handleStart() {
    markOnboardingSeen();
    setDismissed(true);
  }

  return (
    <section className={playerCardClass}>
      <div className={`${playerCardHeaderClass} flex items-start justify-between gap-3`}>
        <div>
          <p className="text-xs text-[#2EA8FF]">新手引导</p>
          <h2 className="mt-1 text-lg font-semibold text-[#EAF3FF]">欢迎来到异界项目部</h2>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md p-1 text-[#8EA3B8] hover:bg-[rgba(60,160,255,0.08)] hover:text-[#EAF3FF]"
          aria-label="关闭导览"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className={`${playerCardBodyClass} space-y-4`}>
        <div className="space-y-2 text-sm leading-relaxed text-[#8EA3B8]">
          <p>你将作为项目管理人员，推进「天穹综合体」从启动到交付。</p>
          <p>当前目标是完成第一章：总控计划与风险清单。</p>
          <p>{locationHint}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={recommendedHref}
            onClick={handleStart}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1E88FF] px-4 text-sm font-medium text-white hover:bg-[#2EA8FF]"
          >
            <Compass className="size-4" />
            开始第一步
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[rgba(60,160,255,0.25)] px-4 text-sm text-[#EAF3FF] hover:border-[#2EA8FF]"
          >
            我知道了
          </button>
        </div>
      </div>
    </section>
  );
}
