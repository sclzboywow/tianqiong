import { redirect } from "next/navigation";
import { AppSiteHeader } from "@/components/AppSiteHeader";
import { ProjectFlowPanel } from "@/components/ops/ProjectFlowPanel";
import { loadProjectFlowData } from "@/game/projectFlowLoader";
import { requireOpsAccess } from "@/lib/opsDebugAccess";

export const dynamic = "force-dynamic";

export default async function ProjectFlowPage() {
  const access = await requireOpsAccess();
  if (access.error) {
    if (access.error.status === 401) redirect("/register");
    redirect("/project");
  }
  const data = await loadProjectFlowData();
  return <div className="min-h-screen bg-zinc-950 text-zinc-100"><AppSiteHeader /><main className="mx-auto max-w-[1500px] px-4 py-6"><ProjectFlowPanel data={data} /></main></div>;
}
