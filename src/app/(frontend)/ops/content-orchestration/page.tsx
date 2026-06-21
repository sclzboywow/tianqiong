import { redirect } from "next/navigation";
import { AppSiteHeader } from "@/components/AppSiteHeader";
import { ContentOrchestrationPanel } from "@/components/ops/ContentOrchestrationPanel";
import {
  loadContentOrchestrationOverview,
  loadOrchestrationActionsTab,
  loadOrchestrationArtifactsTab,
  loadOrchestrationCleanupTab,
  loadOrchestrationEventsTab,
  loadOrchestrationHealthTab,
  loadOrchestrationStoriesTab,
  loadOrchestrationTasksTab,
} from "@/game/contentOrchestrationTabs";
import { requireOpsAccess } from "@/lib/opsDebugAccess";
import type {
  TabDataMap,
  TabId,
} from "@/components/ops/contentOrchestration/types";

type ContentOrchestrationPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

const TAB_IDS = [
  "overview",
  "tasks",
  "artifacts",
  "actions",
  "events",
  "stories",
  "cleanup",
  "health",
] as const;

async function loadInitialTabData(tab: TabId): Promise<Partial<TabDataMap>> {
  switch (tab) {
    case "tasks":
      return { tasks: await loadOrchestrationTasksTab() };
    case "artifacts":
      return { artifacts: await loadOrchestrationArtifactsTab() };
    case "actions":
      return { actions: await loadOrchestrationActionsTab() };
    case "events":
      return { events: await loadOrchestrationEventsTab() };
    case "stories":
      return { stories: await loadOrchestrationStoriesTab() };
    case "cleanup":
      return { cleanup: await loadOrchestrationCleanupTab() };
    case "health":
      return { health: await loadOrchestrationHealthTab() };
    default:
      return {};
  }
}

export default async function ContentOrchestrationPage({
  searchParams,
}: ContentOrchestrationPageProps) {
  const access = await requireOpsAccess();
  if (access.error) {
    if (access.error.status === 401) redirect("/register");
    redirect("/project");
  }

  const overview = await loadContentOrchestrationOverview();
  const requestedTab = (await searchParams).tab;
  const initialTab = TAB_IDS.find((tab) => tab === requestedTab) || "overview";
  const initialTabData = await loadInitialTabData(initialTab);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AppSiteHeader />
      <main className="mx-auto max-w-[1600px] px-4 py-4">
        <ContentOrchestrationPanel
          initialOverview={overview}
          initialTab={initialTab}
          initialTabData={initialTabData}
        />
      </main>
    </div>
  );
}
