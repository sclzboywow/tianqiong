import type { ReactNode } from "react";

type TaskDetailLayoutProps = {
  header: ReactNode;
  intel: ReactNode;
  story: ReactNode;
  impact: ReactNode;
  result: ReactNode;
};

export function TaskDetailLayout({ header, intel, story, impact, result }: TaskDetailLayoutProps) {
  return (
    <div className="space-y-4 lg:space-y-5">
      {header}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-5">
        <main className="min-w-0 space-y-4 lg:space-y-5">
          {story}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
            {intel}
            {impact}
          </div>
        </main>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">{result}</aside>
      </div>
    </div>
  );
}
