import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { LocationCard } from "@/components/LocationCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMapPageData } from "@/game/locationEngine";
import { LOCATION_GROUP_ORDER } from "@/data/locations";
import { getCurrentUserId } from "@/lib/session";

export default async function LocationsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/register");

  const data = await getMapPageData();

  if (data.emptyMessage) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 py-6">
          <Card className="border-amber-900/40 bg-zinc-900/80">
            <CardContent className="py-10 text-center text-zinc-300">{data.emptyMessage}</CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-xl font-bold text-amber-400">协同地图</h1>
          <p className="mt-1 text-sm text-zinc-400">通过地点进入任务与剧情，逐步解锁建设主体与参建各方工作区域。</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">当前阶段：{data.stageName}</Badge>
            <Badge variant="outline">阶段进度：{data.project!.stageProgress}%</Badge>
          </div>
        </div>

        {LOCATION_GROUP_ORDER.map((group) => {
          const items = data.unlockedByGroup[group] || [];
          if (items.length === 0) return null;
          return (
            <section key={group} className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-200">{group}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((item) => (
                  <LocationCard key={item.location.id} item={item} />
                ))}
              </div>
            </section>
          );
        })}

        {data.locked.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-400">未解锁地点</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.locked.map((item) => (
                <LocationCard key={item.location.id} item={item} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
