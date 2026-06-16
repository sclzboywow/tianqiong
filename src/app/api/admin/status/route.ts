import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

export async function GET() {
  const client = createClient({ url: "file:payload.db" });

  async function count(table: string) {
    try {
      const result = await client.execute(`SELECT COUNT(*) as count FROM ${table}`);
      return Number(result.rows[0]?.count ?? 0);
    } catch {
      return 0;
    }
  }

  const stats = {
    npcs: await count("npcs"),
    areas: await count("areas"),
    taskTemplates: await count("task_templates"),
    items: await count("items"),
    achievements: await count("achievements"),
    eventTemplates: await count("event_templates"),
    dailyReportTemplates: await count("daily_report_templates"),
  };

  const initialized = stats.npcs > 0 && stats.taskTemplates > 0;

  return NextResponse.json({
    initialized,
    stats,
    hint: initialized
      ? "后台数据已初始化，请在左侧 Collections 菜单进入各集合查看"
      : "数据未初始化，请 POST /api/admin/seed",
  });
}
