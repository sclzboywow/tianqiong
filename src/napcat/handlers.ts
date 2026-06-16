import { generateDailyReport } from "@/game/dailyReportEngine";
import { getRanking } from "@/game/taskEngine";

export async function handleNapCatMessage(message: string): Promise<string | null> {
  const text = message.trim();
  const baseUrl = process.env.GAME_BASE_URL || "http://localhost:3000";

  if (text === "项目入口") {
    return `《异界项目部：天穹综合体》入口：\n\n${baseUrl}\n\n进入后绑定QQ号，即可参与天穹综合体建设。`;
  }

  if (text === "项目日报") {
    const report = await generateDailyReport();
    return report.content;
  }

  if (text === "项目排行") {
    const ranking = await getRanking(5);
    const lines = ranking.map((r) => `${r.rank}. ${r.user?.nickname || "未知"} - 贡献 ${r.contribution}`);
    return `【天穹综合体 · 贡献排行】\n\n${lines.join("\n") || "暂无数据"}`;
  }

  return null;
}
