import { SiteHeader } from "@/components/SiteHeader";
import { canAccessOpsWorkspace } from "@/lib/opsDebugAccess";

export async function AppSiteHeader() {
  const extraNavItems =
    (await canAccessOpsWorkspace())
      ? [
          { href: "/ops/project-flow", label: "项目流程编排" },
          { href: "/ops/content-studio", label: "内容资产" },
          { href: "/ops/content-orchestration", label: "技术视图" },
        ]
      : [];

  return <SiteHeader extraNavItems={extraNavItems} />;
}
