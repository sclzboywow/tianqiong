import { AppSiteHeader } from "@/components/AppSiteHeader";
import { ProjectOverviewPanel } from "@/components/ProjectOverviewPanel";
import { getProjectOverview } from "@/game/projectOverview";

export default async function ProjectOverviewPage() {
  const data = await getProjectOverview();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AppSiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <ProjectOverviewPanel data={data} />
      </main>
    </div>
  );
}
