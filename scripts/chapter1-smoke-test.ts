/**
 * 第一章可玩内容包验收脚本
 * 运行：npm run test:chapter1
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import {
  CHAPTER1_EVENT_SLUGS,
  CHAPTER1_LOCATION_ACTIONS,
  CHAPTER1_STORY_SLUGS,
  CHAPTER1_TASK_SLUGS,
  CHAPTER1_TASK_TEMPLATES,
} from "../src/data/chapter1Content";
import { LOCATION_ACTIONS } from "../src/data/locationActions";
import { buildChapter1AcceptanceFromStatic } from "../src/game/chapter1Acceptance";
import { PROJECT_STAGES } from "../src/game/projectStages";

function log(step: string, ok: boolean, detail?: string) {
  console.log(`${ok ? "✓" : "✗"} ${step}${detail ? ` — ${detail}` : ""}`);
}

function inkCompiledPath(inkFile: string) {
  return path.join(process.cwd(), "src/ink/stories", `${inkFile}.json`);
}

async function main() {
  console.log("\n=== 第一章可玩内容包验收 ===\n");
  let failed = false;

  const staticReport = buildChapter1AcceptanceFromStatic();
  log(
    "1. 第一章 5 个主线任务模板存在",
    staticReport.tasks.ok,
    `${staticReport.tasks.done}/${staticReport.tasks.total}`,
  );
  if (!staticReport.tasks.ok) failed = true;

  const missingStorySlug = CHAPTER1_TASK_TEMPLATES.filter((t) => !t.storySlug);
  log(
    "2. 每个任务都有 storySlug",
    missingStorySlug.length === 0,
    missingStorySlug.length ? `缺失: ${missingStorySlug.map((t) => t.slug).join(", ")}` : "5/5",
  );
  if (missingStorySlug.length > 0) failed = true;

  for (const task of CHAPTER1_TASK_TEMPLATES) {
    const expectedStory = task.storySlug!;
    const inList = CHAPTER1_STORY_SLUGS.includes(expectedStory);
    if (!inList) {
      log(`3. StoryEntry ${expectedStory}`, false, "未在 CHAPTER1_STORY_SLUGS 中");
      failed = true;
    }
  }
  log("3. 每个 storySlug 都有 StoryEntry 定义", true, `${CHAPTER1_STORY_SLUGS.length} 条`);

  for (const task of CHAPTER1_TASK_TEMPLATES) {
    const inkFile = task.inkFile;
    const source = path.join(process.cwd(), "src/ink/stories", `${inkFile}.ink`);
    const compiled = inkCompiledPath(inkFile);
    const ok = fs.existsSync(source) && fs.existsSync(compiled);
    if (!ok) {
      log(`4. Ink 文件 ${inkFile}`, false, "源文件或编译产物缺失");
      failed = true;
    }
  }
  log("4. 每个 StoryEntry 的 inkFile 存在", staticReport.inkFiles.ok, `${staticReport.inkFiles.done}/${staticReport.inkFiles.total}`);

  const missingSuccess = CHAPTER1_TASK_TEMPLATES.filter(
    (t) => !t.successEffects || Object.keys(t.successEffects).length === 0,
  );
  log(
    "5. 每个任务都有 successEffects",
    missingSuccess.length === 0,
    missingSuccess.length ? missingSuccess.map((t) => t.slug).join(", ") : "5/5",
  );
  if (missingSuccess.length > 0) failed = true;

  const missingMilestone = CHAPTER1_TASK_TEMPLATES.filter(
    (t) => !t.milestoneEffects || Object.keys(t.milestoneEffects).length === 0,
  );
  log(
    "6. 每个主线任务都有 milestoneEffects",
    missingMilestone.length === 0,
    missingMilestone.length ? missingMilestone.map((t) => t.slug).join(", ") : "5/5",
  );
  if (missingMilestone.length > 0) failed = true;

  const actionIds = new Set(LOCATION_ACTIONS.map((a) => a.id));
  const chapter1ActionsOk = CHAPTER1_LOCATION_ACTIONS.every((a) => actionIds.has(a.id));
  const missingActionTriggers = CHAPTER1_LOCATION_ACTIONS.filter(
    (a) => !a.triggerTaskSlugs || a.triggerTaskSlugs.length === 0,
  );
  log(
    "7. 第一章地点行动存在且配置 triggerTaskSlugs",
    chapter1ActionsOk && missingActionTriggers.length === 0,
    `${CHAPTER1_LOCATION_ACTIONS.length} 个行动`,
  );
  if (!chapter1ActionsOk || missingActionTriggers.length > 0) failed = true;

  for (const eventSlug of CHAPTER1_EVENT_SLUGS) {
    const event = (await import("../src/data/chapter1Content")).CHAPTER1_EVENTS.find(
      (e) => e.slug === eventSlug,
    );
    const triggerTasks = event?.triggerTaskSlugs || [];
    const missingTasks = triggerTasks.filter(
      (slug) => !CHAPTER1_TASK_SLUGS.includes(slug as (typeof CHAPTER1_TASK_SLUGS)[number]),
    );
    if (missingTasks.length > 0) {
      log(`8. 事件 ${eventSlug} triggerTaskSlugs`, false, `无效任务: ${missingTasks.join(", ")}`);
      failed = true;
    }
  }
  log("8. 第一章事件池 triggerTaskSlugs 有效", true, `${CHAPTER1_EVENT_SLUGS.length} 个事件`);

  const initiation = PROJECT_STAGES.find((s) => s.id === "INITIATION");
  const gateOk =
    initiation?.requiredMilestones.includes("projectOrgDone") &&
    initiation?.requiredMilestones.includes("masterPlanDone") &&
    initiation?.requiredMilestones.includes("riskRegisterDone") &&
    initiation?.requiredMilestones.includes("documentLedgerDone");
  log(
    "9. INITIATION 阶段门包含关键 milestone",
    Boolean(gateOk),
    initiation?.requiredMilestones.join(", ") || "—",
  );
  if (!gateOk) failed = true;

  console.log("\n--- 运行 content:check ---\n");
  const check = spawnSync("npm", ["run", "content:check"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  log("10. npm run content:check 通过", check.status === 0);
  if (check.status !== 0) failed = true;

  console.log(failed ? "\n第一章验收未通过\n" : "\n第一章验收全部通过\n");
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error("\n第一章验收执行失败:", error instanceof Error ? error.message : error);
  process.exit(1);
});
