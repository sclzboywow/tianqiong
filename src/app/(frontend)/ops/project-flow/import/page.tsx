import { redirect } from "next/navigation";
import { AppSiteHeader } from "@/components/AppSiteHeader";
import { ContentPackImportPanel } from "@/components/ops/ContentPackImportPanel";
import { requireOpsAccess } from "@/lib/opsDebugAccess";

export const dynamic = "force-dynamic";

export default async function ContentPackImportPage() {
  const access = await requireOpsAccess();
  if (access.error) {
    if (access.error.status === 401) redirect("/register");
    redirect("/project");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AppSiteHeader />
      <main className="px-4 py-6">
        <ContentPackImportPanel />
      </main>
    </div>
  );
}
