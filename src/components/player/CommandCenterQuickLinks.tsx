import Link from "next/link";
import { ChevronRight, ClipboardList, Compass, FileClock, GitBranch, UserCircle } from "lucide-react";
import { taskDetailDivider, taskDetailPanel, taskDetailPanelHeader } from "./tasks/taskBoardUi";
import { CommandCenterGuideButton } from "./ChapterOneOnboardingModal";
import { canAccessOpsWorkspace } from "@/lib/opsDebugAccess";

const LINKS = [
  { href: "/locations", label: "协同地图", icon: Compass },
  { href: "/tasks", label: "任务调度台", icon: ClipboardList },
  { href: "/daily-report", label: "项目复盘台", icon: FileClock },
  { href: "/profile", label: "角色状态台", icon: UserCircle },
] as const;

export async function CommandCenterQuickLinks() {
  const links = (await canAccessOpsWorkspace())
    ? [...LINKS, { href: "/ops/project-flow", label: "项目流程编排", icon: GitBranch }]
    : LINKS;

  return (
    <section className={taskDetailPanel}>
      <div className={`${taskDetailPanelHeader} flex items-center justify-between gap-2`}>
        <h3 className="text-sm font-medium text-slate-400">快捷入口</h3>
        <CommandCenterGuideButton />
      </div>
      <ul className={`${taskDetailDivider} px-3 py-1`}>
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex items-center gap-2 py-2 text-xs text-slate-500 transition hover:text-cyan-300/90"
            >
              <Icon className="size-3 shrink-0 text-slate-600 group-hover:text-cyan-400/70" />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <ChevronRight className="size-3 shrink-0 text-slate-700 group-hover:text-cyan-400/50" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
