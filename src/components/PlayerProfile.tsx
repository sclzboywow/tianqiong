import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JOB_LABELS } from "@/utils/formatter";
import { getUserAchievements } from "@/game/achievementEngine";
import type { Job } from "@/game/prisma-types";
import type { User, Inventory } from "@prisma/client";

interface PlayerProfileProps {
  user: User;
  inventory: Inventory[];
}

export async function PlayerProfile({ user, inventory }: PlayerProfileProps) {
  const achievements = await getUserAchievements(user.id);

  return (
    <div className="space-y-4">
      <Card className="border-amber-900/40 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-amber-400">{user.nickname}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
          <p>QQ：{user.qqId}</p>
          <p>岗位：{JOB_LABELS[user.job as Job] || user.job}</p>
          <p>等级：Lv.{user.level}</p>
          <p>经验：{user.exp}</p>
          <p>体力：{user.stamina}</p>
          <p>精神：{user.spirit}</p>
          <p>金币：{user.gold}</p>
          <p>声望：{user.reputation}</p>
          <p>称号：{user.title || "无"}</p>
        </CardContent>
      </Card>

      <Card className="border-zinc-700 bg-zinc-900/80">
        <CardHeader>
          <CardTitle>成就</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {achievements.length ? (
            achievements.map((a) => (
              <div key={a.id} className="rounded border border-zinc-700 p-2">
                <div className="flex items-center gap-2">
                  <Badge>{a.achievement?.name}</Badge>
                </div>
                <p className="mt-1 text-sm text-zinc-400">{a.achievement?.description}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-400">暂无成就</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-zinc-700 bg-zinc-900/80">
        <CardHeader>
          <CardTitle>背包</CardTitle>
        </CardHeader>
        <CardContent>
          {inventory.length ? (
            <ul className="space-y-1 text-sm text-zinc-300">
              {inventory.map((item) => (
                <li key={item.id}>
                  {item.itemId} x{item.quantity}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">背包为空</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
