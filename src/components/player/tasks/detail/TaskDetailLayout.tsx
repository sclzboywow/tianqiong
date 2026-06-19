import type { ReactNode } from "react";
import { taskHudShell } from "../taskBoardUi";

type TaskDetailLayoutProps = {
  header: ReactNode;
  decision: ReactNode;
  story: ReactNode;
  intel: ReactNode;
  logs: ReactNode;
};

export function TaskDetailLayout({ header, decision, story, intel, logs }: TaskDetailLayoutProps) {
  return (
    <div className={taskHudShell}>
      {header}

      <div className="grid grid-cols-1 gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0 space-y-3 border-cyan-400/10 p-3 xl:border-r">
          <div className="xl:hidden">{decision}</div>
          {story}
          {intel}
          <div className="xl:hidden">{logs}</div>
        </main>

        <aside className="hidden space-y-3 p-3 xl:sticky xl:top-4 xl:block xl:self-start">
          {decision}
          {logs}
        </aside>
      </div>
    </div>
  );
}
