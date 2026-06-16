import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JOB_LABELS } from "@/utils/formatter";

interface RankingEntry {
  rank: number;
  user?: { id: string; nickname: string; job: string; reputation: number } | null;
  contribution: number;
}

export function RankingTable({ entries }: { entries: RankingEntry[] }) {
  return (
    <Card className="border-amber-900/40 bg-zinc-900/80">
      <CardHeader>
        <CardTitle className="text-amber-400">个人贡献榜</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length ? (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.rank}
                className="flex items-center justify-between rounded border border-zinc-700 px-3 py-2 text-sm"
              >
                <div>
                  <span className="mr-2 font-bold text-amber-400">#{entry.rank}</span>
                  <span className="text-zinc-200">{entry.user?.nickname || "未知"}</span>
                  {entry.user?.job && (
                    <span className="ml-2 text-zinc-500">
                      {JOB_LABELS[entry.user.job as keyof typeof JOB_LABELS] || entry.user.job}
                    </span>
                  )}
                </div>
                <span className="text-amber-300">{entry.contribution} 贡献</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">暂无排行数据</p>
        )}
      </CardContent>
    </Card>
  );
}
