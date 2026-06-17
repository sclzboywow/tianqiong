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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="space-y-4 lg:col-span-4">
          <div className="lg:sticky lg:top-4 lg:space-y-4">
            {intel}
            <div className="hidden lg:block">{impact}</div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-5">{story}</div>

        <div className="space-y-4 lg:col-span-3">
          <div className="lg:sticky lg:top-4">{result}</div>
        </div>
      </div>

      <div className="space-y-4 lg:hidden">
        {impact}
      </div>
    </div>
  );
}
