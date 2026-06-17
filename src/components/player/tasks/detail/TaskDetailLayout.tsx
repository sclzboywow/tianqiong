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
        <div className="order-1 lg:col-span-5 lg:col-start-5">{story}</div>

        <div className="order-2 lg:hidden">{impact}</div>

        <div className="order-3 lg:col-span-4 lg:col-start-1 lg:row-start-1">
          <div className="lg:sticky lg:top-4 lg:space-y-4">
            {intel}
            <div className="hidden lg:block">{impact}</div>
          </div>
        </div>

        <div className="order-4 lg:col-span-3 lg:col-start-10 lg:row-start-1">
          <div className="lg:sticky lg:top-4">{result}</div>
        </div>
      </div>
    </div>
  );
}
