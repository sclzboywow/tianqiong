import { redirect } from "next/navigation";
import { AppSiteHeader } from "@/components/AppSiteHeader";
import { ContentStudioPanel } from "@/components/ContentStudioPanel";
import { buildContentHealthCheckFromStudioData } from "@/game/contentHealthCheck";
import { loadContentStudioDataCached } from "@/game/contentStudioLoader";
import { getCurrentUserId } from "@/lib/session";

type ContentStudioPageProps = {
  searchParams: Promise<{ location?: string; tab?: string; refresh?: string }>;
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
  console.time("[ops/content-studio] loadContentStudioDataCached");
  const data = await loadContentStudioDataCached({
    refresh: params.refresh === "1",
  });
  console.timeEnd("[ops/content-studio] loadContentStudioDataCached");
  console.time("[ops/content-studio] buildContentHealthCheckFromStudioData");
  const healthReport = buildContentHealthCheckFromStudioData(data);
  console.timeEnd("[ops/content-studio] buildContentHealthCheckFromStudioData");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AppSiteHeader />
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
