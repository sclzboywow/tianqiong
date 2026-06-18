"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Compass, X } from "lucide-react";
import { isOnboardingSeen, markOnboardingSeen } from "@/lib/onboardingStorage";
import {
  taskHudButtonDetailPrimary,
  taskHudButtonDetailSecondary,
} from "./tasks/taskBoardUi";

type OnboardingProps = {
  recommendedHref: string;
  recommendedLocationName?: string;
  recommendedActionLabel?: string;
};

type OnboardingContextValue = {
  openGuide: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function subscribeToOnboardingStore() {
  return () => {};
}

function shouldAutoShowOnboarding() {
  return !isOnboardingSeen();
}

function buildFirstStepHint(
  recommendedLocationName?: string,
  recommendedActionLabel?: string,
): string {
  if (recommendedLocationName && recommendedActionLabel) {
    return `第一步建议前往「${recommendedLocationName}」，${recommendedActionLabel}。`;
  }
  return "第一步建议前往「建设主体 · 项目管理部」，召开项目启动会。";
}

type ChapterOneOnboardingModalProps = OnboardingProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute("disabled") && element.offsetParent !== null,
  );
}

function ChapterOneOnboardingModal({
  open,
  onOpenChange,
  recommendedHref,
  recommendedLocationName,
  recommendedActionLabel,
}: ChapterOneOnboardingModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => {
    markOnboardingSeen();
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dismiss();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = getFocusableElements(panelRef.current);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !panelRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    const focusable = panelRef.current ? getFocusableElements(panelRef.current) : [];
    (focusable[0] ?? panelRef.current)?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, dismiss]);

  if (!open || typeof document === "undefined") return null;

  const firstStepHint = buildFirstStepHint(recommendedLocationName, recommendedActionLabel);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#02060d]/80 backdrop-blur-[2px]"
        aria-label="关闭新手指引"
        onClick={dismiss}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 w-[calc(100%-2rem)] max-w-[540px] border border-cyan-400/20 bg-[#050B14] shadow-[0_0_40px_rgba(8,145,178,0.08)] outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-cyan-400/10 bg-slate-950/40 px-4 py-3">
          <div>
            <p className="text-xs font-medium text-cyan-400/75">新手指令</p>
            <h2 id={titleId} className="mt-0.5 text-[15px] font-semibold text-cyan-50">
              欢迎来到异界项目部
            </h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="border border-cyan-400/10 bg-slate-950/50 p-1.5 text-slate-500 transition hover:border-cyan-400/25 hover:text-slate-300"
            aria-label="关闭"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          <p className="text-[12px] leading-relaxed text-slate-400">
            当前页面是<span className="text-cyan-100/90">项目指挥台</span>
            ，用于查看项目态势和下一步推荐行动。
          </p>
          <ul className="space-y-1.5 text-[13px] leading-relaxed text-slate-500">
            <li>· 协同地图是主要处理场，负责地点内行动与任务触发。</li>
            <li>· 任务调度台用于查看待办和进入任务结算。</li>
          </ul>
          <p className="border border-cyan-400/10 bg-slate-950/35 px-3 py-2.5 text-[13px] leading-relaxed text-slate-400">
            {firstStepHint}
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-cyan-400/8 px-4 py-3 sm:flex-row">
          <Link
            href={recommendedHref}
            onClick={dismiss}
            className={`${taskHudButtonDetailPrimary} w-full sm:flex-1`}
          >
            <Compass className="size-3.5 shrink-0" />
            开始第一步
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className={`${taskHudButtonDetailSecondary} w-full sm:flex-1`}
          >
            稍后再说
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function CommandCenterOnboardingProvider({
  children,
  recommendedHref,
  recommendedLocationName,
  recommendedActionLabel,
}: OnboardingProps & { children: ReactNode }) {
  const shouldAutoOpen = useSyncExternalStore(
    subscribeToOnboardingStore,
    shouldAutoShowOnboarding,
    () => false,
  );
  const [open, setOpen] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);

  useEffect(() => {
    if (shouldAutoOpen && !autoTriggered) {
      setOpen(true);
      setAutoTriggered(true);
    }
  }, [shouldAutoOpen, autoTriggered]);

  const openGuide = useCallback(() => setOpen(true), []);

  return (
    <OnboardingContext.Provider value={{ openGuide }}>
      {children}
      <ChapterOneOnboardingModal
        open={open}
        onOpenChange={setOpen}
        recommendedHref={recommendedHref}
        recommendedLocationName={recommendedLocationName}
        recommendedActionLabel={recommendedActionLabel}
      />
    </OnboardingContext.Provider>
  );
}

export function CommandCenterGuideButton() {
  const context = useContext(OnboardingContext);

  if (!context) return null;

  return (
    <button
      type="button"
      onClick={context.openGuide}
      className="text-[11px] text-slate-500 transition hover:text-cyan-400/80"
    >
      新手指令
    </button>
  );
}
