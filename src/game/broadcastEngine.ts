import { prisma } from "@/prisma/client";

const DEDUP_MINUTES = 5;

export async function sendBroadcast(params: {
  type: string;
  content: string;
  targetGroupId?: string;
}) {
  const recent = await prisma.broadcastLog.findFirst({
    where: {
      type: params.type,
      content: params.content,
      createdAt: { gte: new Date(Date.now() - DEDUP_MINUTES * 60 * 1000) },
    },
  });
  if (recent) return recent;

  const mode = process.env.BROADCAST_MODE || "mock";
  const targetGroupId = params.targetGroupId || process.env.QQ_GROUP_ID || "mock-group";

  if (mode === "mock") {
    console.log(`[Broadcast:${params.type}]`, params.content);
    return prisma.broadcastLog.create({
      data: {
        type: params.type,
        targetGroupId,
        content: params.content,
        status: "MOCK",
      },
    });
  }

  try {
    const apiUrl = process.env.NAPCAT_API_URL;
    if (!apiUrl) throw new Error("NAPCAT_API_URL not configured");

    await fetch(`${apiUrl}/send_group_msg`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: targetGroupId, message: params.content }),
    });

    return prisma.broadcastLog.create({
      data: {
        type: params.type,
        targetGroupId,
        content: params.content,
        status: "SENT",
      },
    });
  } catch (error) {
    console.error("Broadcast failed:", error);
    return prisma.broadcastLog.create({
      data: {
        type: params.type,
        targetGroupId,
        content: params.content,
        status: "FAILED",
      },
    });
  }
}

export async function broadcastAchievement(nickname: string, achievementName: string, reason: string) {
  const content = `🎉【成就解锁】\n\n${nickname} 解锁成就：【${achievementName}】\n\n原因：\n${reason}`;
  return sendBroadcast({ type: "achievement", content });
}

export async function broadcastMajorEvent(title: string, detail: string, rarity: string) {
  const baseUrl = process.env.GAME_BASE_URL || "http://localhost:3000";
  const content = `⚠️【重大事件】\n\n天穹综合体触发 ${rarity} 事件：\n【${title}】\n\n${detail}\n\n进入任务大厅：\n${baseUrl}/tasks`;
  return sendBroadcast({ type: "major_event", content });
}

export async function broadcastDailyReport(content: string) {
  return sendBroadcast({ type: "daily_report", content });
}

export async function getRecentBroadcasts(limit = 20) {
  return prisma.broadcastLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
