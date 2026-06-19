import { redirect } from "next/navigation";
import { AppSiteHeader } from "@/components/AppSiteHeader";
import { ContentOrchestrationPanel } from "@/components/ops/ContentOrchestrationPanel";
import { loadContentOrchestrationOverview } from "@/game/contentOrchestrationTabs";
import { requireOpsAccess } from "@/lib/opsDebugAccess";

export default async function ContentOrchestrationPage() {
  const access = await requireOpsAccess();
  if (access.error) {
    if (access.error.status === 401) redirect("/register");
    redirect("/project");
  }

  const overview = await loadContentOrchestrationOverview();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AppSiteHeader />
      <main className="mx-auto max-w-[1600px] px-4 py-4">
        <ContentOrchestrationPanel initialOverview={overview} />
      </main>
    </div>
  );
}
