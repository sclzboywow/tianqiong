import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { ContentStudioPanel } from "@/components/ContentStudioPanel";
import { buildContentHealthCheckFromStudioData } from "@/game/contentHealthCheck";
import { loadContentStudioData } from "@/game/contentStudioLoader";
import { getCurrentUserId } from "@/lib/session";

type ContentStudioPageProps = {
  searchParams: Promise<{ location?: string; tab?: string }>;
};

function parseContentStudioTab(value?: string): "overview" | "deliverables" | "dependency" | "debug" | "mainline" {
  if (
    value === "deliverables" ||
    value === "dependency" ||
    value === "debug" ||
    value === "mainline"
  ) {
    return value;
  }
  return "overview";
}

export default async function ContentStudioPage({ searchParams }: ContentStudioPageProps) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/register");

  const params = await searchParams;
  const data = await loadContentStudioData();
  const healthReport = buildContentHealthCheckFromStudioData(data);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <ContentStudioPanel
          data={data}
          healthReport={healthReport}
          selectedLocationId={params.location}
          activeTab={parseContentStudioTab(params.tab)}
        />
      </main>
    </div>
  );
}
