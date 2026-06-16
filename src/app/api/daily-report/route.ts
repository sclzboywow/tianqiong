import { NextResponse } from "next/server";
import { generateDailyReport } from "@/game/dailyReportEngine";

export async function GET() {
  const report = await generateDailyReport();
  return NextResponse.json({ report });
}
