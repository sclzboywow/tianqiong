import cron from "node-cron";
import { advanceDay } from "./projectEngine";
import { expireTasks } from "./taskEngine";
import { generateDailyReport } from "./dailyReportEngine";
import { broadcastDailyReport } from "./broadcastEngine";
import { spawnTasksFromTemplates } from "./taskEngine";
import { getTaskTemplates } from "./contentLoader";

let started = false;

export function startCronJobs() {
  if (started || process.env.NODE_ENV === "test") return;
  started = true;

  cron.schedule("0 * * * *", async () => {
    await expireTasks();
  });

  cron.schedule("0 0 * * *", async () => {
    await advanceDay();
    const templates = await getTaskTemplates();
    await spawnTasksFromTemplates(templates.slice(0, 5));
  });

  cron.schedule("0 20 * * *", async () => {
    const report = await generateDailyReport();
    await broadcastDailyReport(report.content);
  });
}
