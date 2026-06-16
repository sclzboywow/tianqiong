import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LocationOverview } from "@/game/locationEngine";
import { LocationActionPanel } from "@/components/LocationActionPanel";
import { LocationRecentLogs } from "@/components/LocationRecentLogs";

type LocationDetailPanelProps = {
  overview: LocationOverview;
};

export function LocationDetailPanel({ overview }: LocationDetailPanelProps) {
  const {
    location,
    unlocked,
    unlockRequirements,
    relatedTasks,
    relatedNpcs,
    relatedAreas,
    availableActions,
    typeLabel,
  } = overview;

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
          {(relatedNpcs.length > 0 || relatedAreas.length > 0) && (
            <Card className="border-zinc-700 bg-zinc-900/80">
              <CardHeader>
                <CardTitle className="text-base">相关角色与区域</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedNpcs.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs text-zinc-400">相关 NPC</p>
                    <div className="flex flex-wrap gap-2">
                      {relatedNpcs.map((npc) => (
                        <Badge
                          key={npc.name}
                          variant={npc.preview ? "outline" : "secondary"}
                          className={npc.preview ? "text-zinc-500" : undefined}
                        >
                          {npc.preview ? `${npc.name}（尚未出现）` : npc.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {relatedAreas.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs text-zinc-400">相关区域</p>
                    <div className="flex flex-wrap gap-2">
                      {relatedAreas.map((area) => (
                        <Badge
                          key={area.name}
                          variant={area.preview ? "outline" : "secondary"}
                          className={area.preview ? "text-zinc-500" : undefined}
                        >
                          {area.preview ? `${area.name}（尚未出现）` : area.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
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

          <LocationActionPanel locationId={location.id} actions={availableActions} />

          <LocationRecentLogs locationId={location.id} locationName={location.name} />

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
