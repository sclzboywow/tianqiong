import cron from "node-cron";
import { advanceDay } from "./projectEngine";
import { expireTasks, spawnTasksFromTemplates, filterTemplatesForCurrentStage } from "./taskEngine";
import { generateDailyReport } from "./dailyReportEngine";
import { broadcastDailyReport } from "./broadcastEngine";
import { getTaskTemplates } from "./contentLoader";
import { getProjectState } from "./projectEngine";

let started = false;

export function startCronJobs() {
  if (started || process.env.NODE_ENV === "test") return;
  started = true;

  cron.schedule("0 * * * *", async () => {
    await expireTasks();
  });

  cron.schedule("0 0 * * *", async () => {
    await advanceDay();
    const project = await getProjectState();
    const templates = await getTaskTemplates();
    const pool = filterTemplatesForCurrentStage(templates, project?.currentStage);
    await spawnTasksFromTemplates(pool.slice(0, 5));
  });

  cron.schedule("0 20 * * *", async () => {
    const report = await generateDailyReport();
    await broadcastDailyReport(report.content);
  });
}
