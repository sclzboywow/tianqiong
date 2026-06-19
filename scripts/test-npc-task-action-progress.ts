/**
 * NPC 任务推进动作持久化测试。
 * 用法: npm run test:npc-actions
 */
import { prisma } from "../src/prisma/client";
import {
  completeNpcTaskAction,
  getNpcTaskActionProgress,
  NPC_TASK_ACTION_LOG_PREFIX,
} from "../src/game/npcTaskActionProgressEngine";
import { ensureProjectState, getProjectState } from "../src/game/projectEngine";
import { listTasks } from "../src/game/taskEngine";

const SEASON_ID = process.env.SEASON_ID || "season-1";
const TASK_SLUG = "coordinate_first_meeting";
const LOCATION_ID = "project_meeting_room";
const ACTION_ID = "coord_contact_primary";

function pass(name: string, detail?: string) {
  console.log(`PASS | ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name: string, detail?: string): never {
  console.error(`FAIL | ${name}${detail ? ` — ${detail}` : ""}`);
  process.exit(1);
}

async function main() {
  console.log("=== NPC 任务动作持久化测试 ===\n");

  await ensureProjectState();
  const project = await getProjectState(SEASON_ID);
  if (!project) fail("读取 project 状态");

  const tasks = await listTasks();
  const hasTask = tasks.some(
    (task) => task.templateId === TASK_SLUG && ["PENDING", "IN_PROGRESS"].includes(task.status),
  );
  if (!hasTask) {
    console.log(`WARN | 当前无进行中的 ${TASK_SLUG} 任务，仍测试持久化写入`);
  }

  await prisma.npcTaskActionProgress.deleteMany({
    where: {
      seasonId: SEASON_ID,
      taskSlug: TASK_SLUG,
      locationId: LOCATION_ID,
      actionId: ACTION_ID,
    },
  });

  const first = await completeNpcTaskAction({
    seasonId: SEASON_ID,
    taskSlug: TASK_SLUG,
    locationId: LOCATION_ID,
    actionId: ACTION_ID,
    project,
    tasks,
  });

  if (!first.ok) {
    fail("首次执行 coord_contact_primary", first.message);
  }
  if (first.alreadyCompleted) {
    fail("首次执行不应返回 alreadyCompleted");
  }
  pass("首次执行 coord_contact_primary", first.message);

  const second = await completeNpcTaskAction({
    seasonId: SEASON_ID,
    taskSlug: TASK_SLUG,
    locationId: LOCATION_ID,
    actionId: ACTION_ID,
    project,
    tasks,
  });

  if (!second.ok || !second.alreadyCompleted) {
    fail("重复执行应返回 alreadyCompleted=true", second.message);
  }
  pass("重复执行返回 alreadyCompleted", second.message);

  const progress = await getNpcTaskActionProgress({
    seasonId: SEASON_ID,
    taskSlugs: [TASK_SLUG],
    locationId: LOCATION_ID,
  });

  if (!progress.includes(ACTION_ID)) {
    fail("progress 未包含 actionId", progress.join(", "));
  }
  pass("progress 已持久化", ACTION_ID);

  const log = await prisma.gameLog.findFirst({
    where: {
      seasonId: SEASON_ID,
      content: { startsWith: NPC_TASK_ACTION_LOG_PREFIX },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!log?.content.includes("联络业主项目负责人")) {
    fail("GameLog 未写入 NPC 任务动作记录", log?.content);
  }
  pass("GameLog 已写入", log.content);

  console.log("\n✓ NPC 任务动作持久化测试通过");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
