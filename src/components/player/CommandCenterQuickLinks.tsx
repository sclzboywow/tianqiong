import Link from "next/link";
import { ClipboardList, Compass, FileClock, UserCircle } from "lucide-react";
import {
  taskDetailPanel,
  taskDetailPanelHeader,
  taskHudButtonCompactSecondary,
} from "./tasks/taskBoardUi";
import { CommandCenterGuideButton } from "./ChapterOneOnboardingModal";

const LINKS = [
  { href: "/locations", label: "协同地图", icon: Compass },
  { href: "/tasks", label: "任务台", icon: ClipboardList },
  { href: "/daily-report", label: "复盘台", icon: FileClock },
  { href: "/profile", label: "角色台", icon: UserCircle },
] as const;

export function CommandCenterQuickLinks() {
  return (
    <section className={taskDetailPanel}>
      <div className={`${taskDetailPanelHeader} flex items-center justify-between gap-2`}>
        <h3 className="text-[12px] font-medium text-cyan-100">快捷入口</h3>
        <CommandCenterGuideButton />
      </div>
      <div className="grid grid-cols-2 gap-1.5 p-3">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`${taskHudButtonCompactSecondary} h-9 w-full min-w-0`}
          >
            <Icon className="size-3 shrink-0" />
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
