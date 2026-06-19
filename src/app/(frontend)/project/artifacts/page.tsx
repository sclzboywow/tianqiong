import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { ProjectArtifactsClient } from "@/components/player/project/ProjectArtifactsClient";

export default async function ProjectArtifactsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/register");
  return <ProjectArtifactsClient />;
}
