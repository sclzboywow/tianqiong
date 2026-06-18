import Link from "next/link";
import { Compass, ClipboardList, UserCircle } from "lucide-react";
import {
  taskDetailPanel,
  taskDetailPanelHeader,
  taskHudButtonDetailSecondary,
} from "../tasks/taskBoardUi";

export function DailyReportQuickLinks() {
  return (
    <section className={taskDetailPanel}>
      <div className={taskDetailPanelHeader}>
        <h3 className="text-[12px] font-medium text-cyan-100">快捷入口</h3>
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <Link href="/tasks" className={`${taskHudButtonDetailSecondary} w-full`}>
          <ClipboardList className="size-3.5 shrink-0" />
          任务调度台
        </Link>
        <Link href="/locations" className={`${taskHudButtonDetailSecondary} w-full`}>
          <Compass className="size-3.5 shrink-0" />
          协同地图
        </Link>
        <Link href="/profile" className={`${taskHudButtonDetailSecondary} w-full`}>
          <UserCircle className="size-3.5 shrink-0" />
          角色状态台
        </Link>
      </div>
    </section>
  );
}
