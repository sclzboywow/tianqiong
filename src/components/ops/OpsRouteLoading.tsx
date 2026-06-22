import { SiteHeader } from "@/components/SiteHeader";

const OPS_NAV = [
  { href: "/ops/project-flow", label: "项目流程编排" },
  { href: "/ops/content-studio", label: "内容资产" },
  { href: "/ops/content-orchestration", label: "技术视图" },
];

type OpsRouteLoadingProps = {
  mainClassName?: string;
};

export function OpsRouteLoading({
  mainClassName = "mx-auto max-w-6xl px-4 py-6",
}: OpsRouteLoadingProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader extraNavItems={OPS_NAV} />
      <main className={mainClassName}>
        <div className="space-y-5">
          <p className="text-sm text-zinc-400">正在加载后台数据...</p>
          <div className="h-8 w-56 animate-pulse rounded bg-zinc-800" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/80"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/60" />
        </div>
      </main>
    </div>
  );
}
