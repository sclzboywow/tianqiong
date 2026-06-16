import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRiskTagLabel } from "@/data/riskTagLabels";
import type { LocationWithStatus } from "@/game/locationEngine";

type LocationCardProps = {
  item: LocationWithStatus;
};

export function LocationCard({ item }: LocationCardProps) {
  const { location, unlocked, activeTaskCount, unlockRequirements, typeLabel } = item;

  const content = (
    <Card
      className={`h-full border-zinc-700 bg-zinc-900/80 transition ${
        unlocked ? "hover:border-amber-700" : "opacity-60"
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base text-amber-300">{location.name}</CardTitle>
          <Badge variant="outline" className="shrink-0 text-xs">
            {typeLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-zinc-300">
        <p className="line-clamp-2 text-zinc-400">{location.description}</p>
        <div className="flex flex-wrap gap-1">
          {location.riskTags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {getRiskTagLabel(tag)}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-zinc-500">
            {unlocked ? `相关任务 ${activeTaskCount} 个` : "未解锁"}
          </span>
          <Badge variant={unlocked ? "default" : "outline"} className="text-xs">
            {unlocked ? "已解锁" : "未解锁"}
          </Badge>
        </div>
        {!unlocked && unlockRequirements.length > 0 && (
          <p className="text-xs text-zinc-500">解锁：{unlockRequirements.join("；")}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Link href={`/locations/${location.id}`} className="block h-full">
      {content}
    </Link>
  );
}
