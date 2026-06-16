import { getProjectState, getStageDisplayInfo, STAGE_GATE_STATUS_LABELS } from "./projectEngine";
import { getTodayLogs } from "./logEngine";
import { getNpcRelations } from "./npcEngine";
import { METRIC_LABELS } from "./types";
import { displayProgress } from "@/utils/clamp";

export async function generateDailyReport() {
  const project = await getProjectState();
  const logs = await getTodayLogs();
  const npcRelations = await getNpcRelations();
  const stageInfo = project ? getStageDisplayInfo(project) : null;

  const majorEvents = logs
    .filter((l) => l.logType === "TASK" || l.logType === "STAGE" || l.broadcastLevel)
    .slice(0, 5)
    .map((l, i) => `${i + 1}. ${l.user?.nickname || "系统"} ${l.content}`);

  const contributors = logs
    .filter((l) => l.user)
    .reduce<Record<string, number>>((acc, log) => {
      const name = log.user?.nickname || "未知";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

  const topContributors = Object.entries(contributors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => `@${name}（${count}次参与）`);

  const risks: string[] = [];
  if (project) {
    if (project.fireRisk > 50) risks.push("明日消防专项检查风险");
    if (project.dataIntegrity < 50) risks.push("竣工资料补齐");
    if (project.overallProgress < 30) risks.push("总体建设进度需加速");
    if ((project.latentRisk ?? 20) > 70) {
      risks.push("潜在风险偏高，后续可能触发集中爆发事件");
    }
  }

  const milestoneLines =
    stageInfo?.milestoneItems.map((item) => `${item.done ? "√" : "×"} ${item.label}`) || [];

  const stageReminder =
    project?.stageGateStatus === "BLOCKED"
      ? "⚠ 阶段门被卡住：当前阶段进度已达标，但仍有关键节点或风险条件未满足，暂不能进入下一阶段。"
      : stageInfo?.milestoneItems.some((item) => !item.done)
        ? `当前阶段仍有关键节点未完成，请优先处理${stageInfo.stageConfig.name}类任务。`
        : "当前阶段关键节点已全部完成，可继续冲刺阶段进度。";

  const npcChanges = npcRelations
    .filter((n) => n.attentionValue > 0)
    .map((n) => `${n.npcName}关注度 ${n.attentionValue}`)
    .slice(0, 3);

  const content = [
    "【天穹综合体 · 项目日报】",
    "",
    project && stageInfo ? `当前阶段：${stageInfo.stageConfig.name}` : "",
    project ? `阶段进度：${project.stageProgress}%` : "",
    project ? `总体进度：${project.overallProgress}%` : "",
    project
      ? `阶段门状态：${STAGE_GATE_STATUS_LABELS[project.stageGateStatus] || project.stageGateStatus}`
      : "",
    "",
    "关键节点：",
    milestoneLines.length ? milestoneLines.join("\n") : "暂无",
    "",
    "阶段提醒：",
    stageReminder,
    "",
    project ? `安全：${displayProgress(project.safety)}` : "",
    project ? `资料完整度：${displayProgress(project.dataIntegrity)}` : "",
    project ? `消防风险：${displayProgress(project.fireRisk)}` : "",
    project
      ? `潜在风险：${displayProgress(project.latentRisk ?? 20)}，${
          (project.latentRisk ?? 20) > 70
            ? "历史遗留问题正在累积，建议优先处理资料、消防、质量类任务。"
            : "整体可控。"
        }`
      : "",
    "",
    "今日大事件：",
    majorEvents.length ? majorEvents.join("\n") : "暂无重大事件",
    "",
    "今日贡献：",
    topContributors.length ? topContributors.join("\n") : "暂无",
    "",
    "NPC关系变化：",
    npcChanges.length ? npcChanges.join("\n") : "平稳",
    "",
    "明日重点风险：",
    risks.length ? risks.join("\n") : "继续推进当前建设阶段",
    "",
    "今日评价：",
    "项目还没竣工，但至少没停工。",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    content,
    project,
    logs,
    metricLabels: METRIC_LABELS,
    risks,
    majorEvents,
    topContributors,
    stageInfo,
  };
}
