import { SiteHeader } from "@/components/SiteHeader";
import { RankingTable } from "@/components/RankingTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRanking } from "@/game/taskEngine";

export default async function RankingPage() {
  const ranking = await getRanking(20);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Tabs defaultValue="contribution">
          <TabsList>
            <TabsTrigger value="contribution">个人贡献榜</TabsTrigger>
            <TabsTrigger value="data" disabled>
              资料贡献榜
            </TabsTrigger>
            <TabsTrigger value="safety" disabled>
              安全贡献榜
            </TabsTrigger>
          </TabsList>
          <TabsContent value="contribution" className="mt-4">
            <RankingTable entries={ranking} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
