import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { LocationDetailPanel } from "@/components/LocationDetailPanel";
import { getLocationOverview } from "@/game/locationEngine";

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const overview = await getLocationOverview(id);
  if (!overview) notFound();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <LocationDetailPanel overview={overview} />
      </main>
    </div>
  );
}
