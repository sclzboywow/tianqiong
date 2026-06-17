/**
 * 第一章全流程数据层验收
 * 运行：npm run test:chapter1-flow
 *
 * 人工测试清单（浏览器）：
 * 1. 注册/登录 → /project 查看章节/推荐行动/资源条/项目状态/章节目标/待处理任务
 * 2. 点击推荐行动 → /locations 或 /locations/[id]
 * 3. 探索页：推荐地点、已解锁、锁定条件、无技术 slug
 * 4. 进入推荐地点 → 执行推荐行动 → 检查体力/精神消耗、任务生成、前往处理链接
 * 5. /tasks → 推荐任务、分类、成功影响、失败风险
 * 6. /tasks/[id] → 剧情、选择项、加入、提交、结算反馈
 * 7. 返回 /project → 阶段目标/指标/推荐行动更新
 */
process.env.CHAPTER1_FLOW_TEST = "1";

import {
  CHAPTER1_LOCATION_ACTIONS,
  CHAPTER1_NAME,
  CHAPTER1_STAGE,
  CHAPTER1_TASK_SLUGS,
} from "../src/data/chapter1Content";
import { buildChapter1AcceptanceFromStatic } from "../src/game/chapter1Acceptance";
import { executeLocationAction } from "../src/game/locationActionEngine";
import { getLocationActions } from "../src/game/locationActionLoader";
import { getAllLocations, getLocationOverview } from "../src/game/locationEngine";
import { buildExplorePageData } from "../src/game/locationPresentationEngine";
import {
  getChapterInfo,
  getChapterGoalItems,
  getNextRecommendedAction,
  getPendingTaskGroups,
} from "../src/game/playerGuidanceEngine";
import {
  ensureProjectState,
  getProjectState,
  initializeProjectForSeed,
  parseMilestones,
} from "../src/game/projectEngine";
import { buildTaskDetailViewData } from "../src/game/taskDetailPresentationEngine";
import { buildTaskBoardData } from "../src/game/taskPresentationEngine";
import { joinTask, listTasks, resolveChoice } from "../src/game/taskEngine";
import { prisma } from "../src/prisma/client";
import { createStory, getStoryState } from "../src/ink/inkRunner";

const SEASON_ID = process.env.SEASON_ID || "season-1";
const MAINLINE_SLUG = "setup_project_team";
const KICKOFF_ACTION_ID = "action_chapter1_kickoff";
const KICKOFF_LOCATION_ID = "owner_project_management_dept";

const FORBIDDEN_VISIBLE_TOKENS = [
  "DOCUMENT_ASSISTANT",
  "CONSTRUCTION_ASSISTANT",
  "SAFETY_ASSISTANT",
  "setup_project_team",
  "story_setup_project_team",
  "action_chapter1_kickoff",
];

type StepResult = {
  name: string;
  pass: boolean;
  detail?: string;
};

const results: StepResult[] = [];

function record(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} | ${name}${detail ? ` — ${detail}` : ""}`);
}

function parseChoiceIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    return Object.keys(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return [];
  }
}

function containsForbiddenToken(value: string): string | null {
  const hit = FORBIDDEN_VISIBLE_TOKENS.find((token) => value.includes(token));
  return hit || null;
}

function scanVisibleStrings(values: string[]): string | null {
  for (const value of values) {
    const hit = containsForbiddenToken(value);
    if (hit) return `${value} (含 ${hit})`;
  }
  return null;
}

async function resetChapter1FlowState() {
  await prisma.task.updateMany({
    where: {
      seasonId: SEASON_ID,
      templateId: { in: [...CHAPTER1_TASK_SLUGS] },
    },
    data: { status: "EXPIRED" },
  });
  await initializeProjectForSeed(SEASON_ID);
}

async function createFlowTestUser() {
  const qqId = `chapter1-flow-${Date.now()}`;
  return prisma.user.create({
    data: {
      qqId,
      nickname: "第一章验收员",
      job: "DOCUMENT_ASSISTANT",
      stamina: 100,
      spirit: 100,
      level: 3,
      reputation: 10,
    },
  });
}

function formatProjectMetrics(project: NonNullable<Awaited<ReturnType<typeof getProjectState>>>) {
  return {
    stage: project.currentStage,
    stageProgress: project.stageProgress,
    overallProgress: project.overallProgress,
    ownerTrust: project.ownerTrust,
    latentRisk: project.latentRisk,
    dataIntegrity: project.dataIntegrity,
  };
}

async function main() {
  console.log(`\n=== 第一章全流程验收 (${CHAPTER1_NAME}) ===\n`);

  const staticReport = buildChapter1AcceptanceFromStatic();
  record(
    "静态内容包完整",
    staticReport.allOk,
    staticReport.allOk ? CHAPTER1_STAGE : staticReport.tasks.missing.join(", "),
  );

  await resetChapter1FlowState();
  const projectBefore = await ensureProjectState(SEASON_ID);
  record(
    "项目状态初始化",
    projectBefore.currentStage === CHAPTER1_STAGE,
    `阶段=${projectBefore.currentStage}, 阶段进度=${projectBefore.stageProgress}`,
  );

  const locations = await getAllLocations();
  const actions = await getLocationActions();
  const kickoffAction =
    CHAPTER1_LOCATION_ACTIONS.find((item) => item.id === KICKOFF_ACTION_ID) ||
    actions.find((item) => item.id === KICKOFF_ACTION_ID);
  record(
    "第一章关键地点行动可读",
    !!kickoffAction && kickoffAction.locationId === KICKOFF_LOCATION_ID,
    kickoffAction?.label || "未找到 action_chapter1_kickoff",
  );

  const overview = await getLocationOverview(KICKOFF_LOCATION_ID);
  record(
    "推荐地点详情可读",
    !!overview?.location && overview.availableActions.some((item) => item.id === KICKOFF_ACTION_ID),
    overview?.location.name,
  );

  const user = await createFlowTestUser();
  const staminaBefore = user.stamina;
  const spiritBefore = user.spirit;

  const actionResult = await executeLocationAction(
    KICKOFF_LOCATION_ID,
    KICKOFF_ACTION_ID,
    user.id,
  );
  const createdSlugs = actionResult.createdTasks.map((task) => task.templateId);
  record(
    "地点行动生成主线任务",
    createdSlugs.includes(MAINLINE_SLUG),
    `生成 ${actionResult.createdTasks.length} 个任务: ${createdSlugs.join(", ") || "无"}`,
  );

  const userAfterAction = await prisma.user.findUnique({ where: { id: user.id } });
  const staminaSpent = staminaBefore - (userAfterAction?.stamina ?? staminaBefore);
  const spiritSpent = spiritBefore - (userAfterAction?.spirit ?? spiritBefore);
  record(
    "地点行动消耗精神",
    spiritSpent === (kickoffAction?.spiritCost ?? 10) && staminaSpent === (kickoffAction?.staminaCost ?? 0),
    `精神 ${spiritBefore}→${userAfterAction?.spirit}, 体力 ${staminaBefore}→${userAfterAction?.stamina}`,
  );

  const tasksAfterAction = await listTasks();
  const mainlineTask = tasksAfterAction.find(
    (task) =>
      task.templateId === MAINLINE_SLUG &&
      (task.status === "PENDING" || task.status === "IN_PROGRESS"),
  );
  record(
    "找到第一章主线任务",
    !!mainlineTask,
    mainlineTask ? `${mainlineTask.title} (${mainlineTask.id})` : MAINLINE_SLUG,
  );

  if (!mainlineTask) {
    printSummary();
    process.exit(1);
  }

  const projectMid = await getProjectState();
  const chapterInfo = getChapterInfo(projectMid!);
  const recommendedBefore = getNextRecommendedAction(projectMid!, tasksAfterAction);
  record(
    "指挥中心推荐行动可读",
    !!recommendedBefore.title && !!recommendedBefore.href,
    `${recommendedBefore.title} → ${recommendedBefore.href}`,
  );
  record(
    "指挥中心章节信息",
    chapterInfo.chapterName.includes("第一章") || chapterInfo.chapterSubtitle.length > 0,
    `${chapterInfo.chapterName} / ${chapterInfo.chapterSubtitle}`,
  );

  const detailView = await buildTaskDetailViewData(mainlineTask, projectMid!, user.id);
  record(
    "任务详情剧情可加载",
    detailView.inkAvailable && (detailView.storyState?.choices.length || 0) > 0,
    `${detailView.storyState?.lines.length || 0} 行, ${detailView.storyState?.choices.length || 0} 选项`,
  );

  const detailSlugHit = scanVisibleStrings([
    detailView.title,
    detailView.description,
    detailView.sourceName,
    detailView.stageName,
    ...detailView.requiredJobLabels,
    ...detailView.milestoneLabels,
    ...detailView.participants.map((item) => item.jobLabel),
  ]);
  record("任务详情无技术 slug", !detailSlugHit, detailSlugHit || "通过");

  await joinTask(mainlineTask.id, user.id);
  const choiceId =
    detailView.storyState?.choices[0]?.choiceId ||
    parseChoiceIds(mainlineTask.choiceEffects)[0] ||
    "steady_push";

  const resolveResult = await resolveChoice(mainlineTask.id, user.id, choiceId);
  record(
    "任务提交并结算",
    resolveResult.finalized === true,
    `方案=${choiceId}, 成功=${resolveResult.success}`,
  );

  const settledTask = await prisma.task.findUnique({ where: { id: mainlineTask.id } });
  record(
    "任务状态已更新",
    settledTask?.status === "COMPLETED" || settledTask?.status === "FAILED",
    settledTask?.status || "未知",
  );

  const projectAfter = await getProjectState();
  const milestonesAfter = parseMilestones(projectAfter!);
  const milestoneDone = milestonesAfter.projectOrgDone === true;
  const stageProgressIncreased = (projectAfter?.stageProgress || 0) > (projectBefore.stageProgress || 0);
  record(
    "里程碑 projectOrgDone 生效",
    resolveResult.success === true ? milestoneDone : true,
    `projectOrgDone=${milestonesAfter.projectOrgDone}`,
  );
  record(
    "项目 stageProgress 更新",
    resolveResult.success === true ? stageProgressIncreased : true,
    `${projectBefore.stageProgress}→${projectAfter?.stageProgress}`,
  );
  record(
    "successEffects 生效",
    resolveResult.success === true
      ? Object.keys(resolveResult.effects || {}).length > 0
      : true,
    JSON.stringify(resolveResult.effects || {}),
  );
  record(
    "玩家奖励生效",
    resolveResult.success === true ? (resolveResult.rewards?.exp || 0) > 0 : true,
    resolveResult.rewards
      ? `exp=${resolveResult.rewards.exp}, gold=${resolveResult.rewards.gold}`
      : "无奖励",
  );

  const tasksAfterResolve = await listTasks();
  const recommendedAfter = getNextRecommendedAction(projectAfter!, tasksAfterResolve);
  const recommendationMoved =
    recommendedAfter.href !== recommendedBefore.href ||
    recommendedAfter.title !== recommendedBefore.title ||
    tasksAfterResolve.some((task) => task.status === "PENDING" || task.status === "IN_PROGRESS");
  record(
    "推荐行动继续推进",
    recommendationMoved,
    `${recommendedAfter.title} → ${recommendedAfter.href}`,
  );

  const taskBoard = buildTaskBoardData({
    project: projectAfter!,
    tasks: tasksAfterResolve,
    chapterGoals: getChapterGoalItems(projectAfter!, tasksAfterResolve),
    recentTaskLogs: [],
  });
  const boardSlugHit = scanVisibleStrings(
    taskBoard.taskItems.flatMap((item) => [
      item.title,
      item.description,
      item.sourceName,
      item.area,
      ...item.requiredJobLabels,
      ...item.successEffectsSummary.map((line) => line.text),
      ...item.failEffectsSummary.map((line) => line.text),
      ...item.milestoneLabels,
    ]),
  );
  record("任务台展示无技术 slug", !boardSlugHit, boardSlugHit || "通过");

  const exploreData = await buildExplorePageData({
    project: projectAfter!,
    tasks: tasksAfterResolve,
    locations,
    actions,
    recommendedAction: recommendedAfter,
    chapterGoals: getChapterGoalItems(projectAfter!, tasksAfterResolve),
    recentLogs: [],
  });
  const exploreSlugHit = scanVisibleStrings(
    exploreData.locations.flatMap((item) => [
      item.name,
      item.description,
      item.typeLabel,
      item.possibleEventsLabel,
      ...item.riskTagLabels,
      ...item.unlockRequirementHints,
      item.recommendReason || "",
    ]),
  );
  record("探索页展示无技术 slug", !exploreSlugHit, exploreSlugHit || "通过");

  const inkStory = createStory(mainlineTask.inkFile);
  const inkState = getStoryState(inkStory, parseChoiceIds(mainlineTask.choiceEffects));
  record(
    "Ink 剧情可读",
    inkState.lines.length > 0 && inkState.choices.length > 0,
    `${inkState.lines.length} 行 / ${inkState.choices.length} 选项`,
  );

  const pendingGroups = getPendingTaskGroups(tasksAfterResolve);
  record(
    "待处理任务分组可读",
    pendingGroups.mainline.length + pendingGroups.emergency.length > 0,
    `主线 ${pendingGroups.mainline.length}, 突发 ${pendingGroups.emergency.length}`,
  );

  console.log("\n--- 当前项目指标 ---");
  console.log(JSON.stringify(formatProjectMetrics(projectAfter!), null, 2));
  console.log("\n--- 已完成里程碑 ---");
  console.log(
    Object.entries(milestonesAfter)
      .filter(([, value]) => value)
      .map(([key]) => key)
      .join(", ") || "无",
  );
  console.log("\n--- 生成的任务 ---");
  console.log(
    actionResult.createdTasks.map((task) => `- ${task.title} (${task.templateId})`).join("\n") ||
      "无",
  );

  printSummary();
  process.exit(results.every((item) => item.pass) ? 0 : 1);
}

function printSummary() {
  const passed = results.filter((item) => item.pass).length;
  const failed = results.filter((item) => !item.pass);
  console.log(`\n=== 结果: ${passed}/${results.length} PASS ===`);
  if (failed.length > 0) {
    console.log("\n失败项:");
    for (const item of failed) {
      console.log(`  - ${item.name}${item.detail ? `: ${item.detail}` : ""}`);
    }
    console.log("\n>>> 总体验收: FAIL <<<\n");
    return;
  }
  console.log("\n>>> 总体验收: PASS <<<\n");
}

main().catch((error) => {
  console.error("\n第一章全流程验收异常:", error instanceof Error ? error.message : error);
  process.exit(1);
});
