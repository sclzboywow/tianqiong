import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUserId } from "@/lib/session";
import { isGameAdmin } from "@/lib/gameAdmin";

export async function AppSiteHeader() {
  const userId = await getCurrentUserId();
  const extraNavItems =
    userId && (await isGameAdmin(userId))
      ? [
          { href: "/ops/content-orchestration", label: "项目主线编排" },
          { href: "/ops/content-studio", label: "内容编排台" },
        ]
      : [];

  return <SiteHeader extraNavItems={extraNavItems} />;
}
