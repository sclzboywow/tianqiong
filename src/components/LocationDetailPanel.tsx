import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LocationOverview } from "@/game/locationEngine";

type LocationDetailPanelProps = {
  overview: LocationOverview;
};

export function LocationDetailPanel({ overview }: LocationDetailPanelProps) {
  const { location, unlocked, unlockRequirements, relatedTasks, typeLabel } = overview;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/locations" className="text-sm text-zinc-400 hover:text-amber-400">
          ← 返回协同地图
        </Link>
        <h1 className="mt-2 text-xl font-bold text-amber-400">{location.name}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{typeLabel}</Badge>
          <Badge variant="outline">{location.group}</Badge>
          <Badge variant={unlocked ? "default" : "outline"}>
            {unlocked ? "已解锁" : "未解锁"}
          </Badge>
        </div>
      </div>

      <Card className="border-zinc-700 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-base">地点说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-300">{location.description}</CardContent>
      </Card>

      {!unlocked ? (
        <Card className="border-red-900/40 bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-base text-red-300">该地点尚未开放</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm text-red-200">解锁条件：</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-red-100">
              {unlockRequirements.map((req) => (
                <li key={req}>{req}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <>
          {location.relatedNpcNames && location.relatedNpcNames.length > 0 && (
            <Card className="border-zinc-700 bg-zinc-900/80">
              <CardHeader>
                <CardTitle className="text-base">相关 NPC</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {location.relatedNpcNames.map((npc) => (
                  <Badge key={npc} variant="secondary">
                    {npc}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          {location.riskTags && location.riskTags.length > 0 && (
            <Card className="border-zinc-700 bg-zinc-900/80">
              <CardHeader>
                <CardTitle className="text-base">风险标签</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {location.riskTags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="border-amber-900/40 bg-zinc-900/80">
            <CardHeader>
              <CardTitle className="text-base text-amber-300">当前相关任务</CardTitle>
            </CardHeader>
            <CardContent>
              {relatedTasks.length === 0 ? (
                <p className="text-sm text-zinc-400">当前暂无待处理事项。</p>
              ) : (
                <ul className="space-y-2">
                  {relatedTasks.map((task) => (
                    <li key={task.id}>
                      <Link
                        href={`/tasks/${task.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "h-auto w-full justify-between py-2 text-left",
                        )}
                      >
                        <span>{task.title}</span>
                        <Badge className="ml-2 shrink-0">{task.status}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
