import { getProjectState } from "./projectEngine";
import { getTodayLogs } from "./logEngine";
import { getNpcRelations } from "./npcEngine";
import { METRIC_LABELS } from "./types";
import { displayProgress } from "@/utils/clamp";

export async function generateDailyReport() {
  const project = await getProjectState();
  const logs = await getTodayLogs();
  const npcRelations = await getNpcRelations();

  const majorEvents = logs
    .filter((l) => l.logType === "TASK" || l.broadcastLevel)
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
    if (project.progress < 50) risks.push("开业节点冲刺");
    if ((project.latentRisk ?? 20) > 70) {
      risks.push("潜在风险偏高，后续可能触发集中爆发事件");
    }
  }

  const npcChanges = npcRelations
    .filter((n) => n.attentionValue > 0)
    .map((n) => `${n.npcName}关注度 ${n.attentionValue}`)
    .slice(0, 3);

  const content = [
    "【天穹综合体 · 今日日报】",
    "",
    project
      ? `总进度：${displayProgress(project.progress)}%`
      : "总进度：--",
    project ? `安全：${displayProgress(project.safety)}` : "",
    project ? `资料完整度：${displayProgress(project.dataIntegrity)}` : "",
    project ? `消防风险：${displayProgress(project.fireRisk)}` : "",
    project
      ? `潜在风险：${displayProgress(project.latentRisk ?? 20)}，${
          (project.latentRisk ?? 20) > 70
            ? "历史遗留问题正在累积，建议优先处理资料、消防、质量类任务。⚠ 潜在风险偏高，后续可能触发集中爆发事件。"
            : (project.latentRisk ?? 20) > 60
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
    risks.length ? risks.join("\n") : "继续推进开业准备",
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
  };
}
