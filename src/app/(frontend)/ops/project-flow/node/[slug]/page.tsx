import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AppSiteHeader } from "@/components/AppSiteHeader";
import { ProjectFlowNodeEditor } from "@/components/ops/ProjectFlowNodeEditor";
import { loadProjectFlowNode } from "@/game/projectFlowLoader";
import { requireOpsAccess } from "@/lib/opsDebugAccess";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectFlowNodePage({ params }: PageProps) {
  const access = await requireOpsAccess();
  if (access.error) {
    if (access.error.status === 401) redirect("/register");
    redirect("/project");
  }

  const { slug } = await params;
  const detail = await loadProjectFlowNode(slug);
  if (!detail) notFound();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AppSiteHeader />
      <main className="mx-auto max-w-[1100px] px-4 py-6">
        <Suspense fallback={<p className="text-sm text-zinc-500">加载编辑器...</p>}>
          <ProjectFlowNodeEditor
            slug={slug}
            stageName={detail.stageName}
            node={detail.node}
            options={detail.options}
          />
        </Suspense>
      </main>
    </div>
  );
}
