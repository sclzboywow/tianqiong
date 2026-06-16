import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentLocationActionLogs } from "@/game/logEngine";

type LocationRecentLogsProps = {
  locationId: string;
  locationName: string;
};

function formatLogTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function LocationRecentLogs({ locationId, locationName }: LocationRecentLogsProps) {
  const logs = await getRecentLocationActionLogs({ id: locationId, name: locationName });

  return (
    <Card className="border-zinc-700 bg-zinc-900/80">
      <CardHeader>
        <CardTitle className="text-base">最近动态</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-zinc-400">当前地点暂无行动记录</p>
        ) : (
          <ul className="space-y-2 text-sm text-zinc-300">
            {logs.map((entry) => (
              <li key={entry.id} className="rounded border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                <p>{entry.content}</p>
                <p className="mt-1 text-xs text-zinc-500">{formatLogTime(entry.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
