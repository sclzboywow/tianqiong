import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { ProjectDashboard } from "@/components/ProjectDashboard";
import { getCurrentUserId } from "@/lib/session";
import { getProjectState, ensureProjectState } from "@/game/projectEngine";

export default async function ProjectPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/register");

  await ensureProjectState();
  const project = await getProjectState();
  if (!project) redirect("/register");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <ProjectDashboard project={project} />
      </main>
    </div>
  );
}
