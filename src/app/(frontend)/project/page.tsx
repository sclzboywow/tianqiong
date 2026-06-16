import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { ProjectDashboard } from "@/components/ProjectDashboard";
import { CommandCenterPanel } from "@/components/CommandCenterPanel";
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
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        <CommandCenterPanel project={project} />
        <ProjectDashboard project={project} />
      </main>
    </div>
  );
}
