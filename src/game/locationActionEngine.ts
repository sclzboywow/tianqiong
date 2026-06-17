import type { ProjectState, Task } from "@prisma/client";
import { prisma } from "@/prisma/client";
import type { LocationAction } from "@/data/locationActions";
import { getLocationActions } from "./locationActionLoader";
import { hasReachedStage } from "./contentUnlockEngine";
import { parseMilestones, getProjectState } from "./projectEngine";
import { createTaskFromTemplateSlug } from "./taskEngine";
import { buildMapActionLogContent, writeGameLog } from "./logEngine";
import { triggerEventForLocationAction, type EventTriggerResult } from "./eventPoolEngine";

export type LocationActionExecuteResult = {
  createdTasks: Task[];
  skippedTasks: { slug: string; title: string; reason: string }[];
  message: string;
  eventResult?: EventTriggerResult;
};

export function isLocationActionUnlocked(action: LocationAction, projectState: ProjectState): boolean {
  const requiredStage = action.unlockStage || "INITIATION";
  if (!hasReachedStage(projectState.currentStage, requiredStage)) return false;

  const milestones = parseMilestones(projectState);
  if (action.unlockMilestones?.some((key) => !milestones[key])) return false;

  return true;
}

export async function getActionsForLocation(
  locationId: string,
  projectState: ProjectState,
): Promise<LocationAction[]> {
  const actions = await getLocationActions();
  return actions.filter(
    (action) => action.locationId === locationId && isLocationActionUnlocked(action, projectState),
  );
}

function assertUserRequirements(
  user: { level: number; reputation: number; stamina: number; spirit: number },
  action: LocationAction,
) {
  if (action.minLevel && user.level < action.minLevel) {
    throw new Error(`等级不足，需要 Lv.${action.minLevel}`);
  }
  if (action.minReputation && user.reputation < action.minReputation) {
    throw new Error(`声望不足，需要 ${action.minReputation}`);
  }

  const staminaCost = action.staminaCost ?? 0;
  const spiritCost = action.spiritCost ?? 0;

  if (user.stamina < staminaCost) {
    throw new Error(`体力不足，需要 ${staminaCost}（当前 ${user.stamina}）`);
  }
  if (user.spirit < spiritCost) {
    throw new Error(`精神不足，需要 ${spiritCost}（当前 ${user.spirit}）`);
  }
}

function formatResourceCost(staminaCost: number, spiritCost: number): string {
  const parts: string[] = [];
  if (staminaCost > 0) parts.push(`体力 ${staminaCost}`);
  if (spiritCost > 0) parts.push(`精神 ${spiritCost}`);
  return parts.join("、");
}

function buildSuccessMessage(
  action: LocationAction,
  createdCount: number,
  skippedCount: number,
  staminaCost: number,
  spiritCost: number,
): string {
  const costText = formatResourceCost(staminaCost, spiritCost);

  if (action.resultText?.trim()) {
    let message = action.resultText.trim();
    if (costText) message += `，消耗${costText}`;
    return message;
  }

  let message: string;
  if (createdCount > 0 && skippedCount > 0) {
    message = `已生成 ${createdCount} 项任务，${skippedCount} 项已存在并跳过`;
  } else {
    message = `已生成 ${createdCount} 项任务`;
  }
  if (costText) message += `，消耗${costText}`;
  return message;
}

export async function executeLocationAction(
  locationId: string,
  actionId: string,
  userId: string,
): Promise<LocationActionExecuteResult> {
  const actions = await getLocationActions();
  const action = actions.find((item) => item.id === actionId && item.locationId === locationId);
  if (!action) throw new Error("行动不存在");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("用户不存在");

  const project = await getProjectState();
  if (!project) throw new Error("项目状态未初始化");

  const { getLocationById, isLocationUnlocked } = await import("./locationEngine");
  const location = await getLocationById(locationId);
  if (!location) throw new Error("地点不存在");
  if (!isLocationUnlocked(location, project)) throw new Error("地点尚未解锁");
  if (!isLocationActionUnlocked(action, project)) throw new Error("行动尚未解锁");

  assertUserRequirements(user, action);

  const staminaCost = action.staminaCost ?? 0;
  const spiritCost = action.spiritCost ?? 0;

  const createdTasks: Task[] = [];
  const skippedTasks: LocationActionExecuteResult["skippedTasks"] = [];

  for (const slug of action.triggerTaskSlugs || []) {
    const result = await createTaskFromTemplateSlug(slug);
    if (!result) {
      skippedTasks.push({ slug, title: slug, reason: "任务模板不存在" });
      continue;
    }
    if (result.created) {
      createdTasks.push(result.task);
    } else {
      skippedTasks.push({
        slug,
        title: result.task.title,
        reason:
          result.skipReason === "completed"
            ? "该任务已完成，未重复生成"
            : "已有进行中的同类任务",
      });
    }
  }

  let message: string;
  let staminaDeducted = 0;
  let spiritDeducted = 0;

  if (createdTasks.length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        stamina: user.stamina - staminaCost,
        spirit: user.spirit - spiritCost,
      },
    });
    staminaDeducted = staminaCost;
    spiritDeducted = spiritCost;
    message = buildSuccessMessage(
      action,
      createdTasks.length,
      skippedTasks.length,
      staminaCost,
      spiritCost,
    );
  } else if (skippedTasks.length > 0) {
    message =
      action.noTaskText?.trim() || "相关任务已存在，未重复生成，也未消耗体力/精神";
  } else {
    message = "未配置可触发的任务，未消耗体力/精神";
  }

  const logContent = buildMapActionLogContent({
    locationId: location.id,
    locationName: location.name,
    actionLabel: action.label,
    createdCount: createdTasks.length,
    skippedCount: skippedTasks.length,
    message,
  });

  await writeGameLog({
    userId,
    logType: "SYSTEM",
    content: logContent,
    effectSummary: JSON.stringify({
      locationId: location.id,
      actionId: action.id,
      createdCount: createdTasks.length,
      skippedCount: skippedTasks.length,
      staminaDeducted,
      spiritDeducted,
      message,
    }),
  });

  let eventResult: EventTriggerResult | undefined;
  if (createdTasks.length > 0) {
    try {
      eventResult = await triggerEventForLocationAction({
        locationId: location.id,
        locationName: location.name,
        actionId: action.id,
        actionLabel: action.label,
        userId,
        projectState: project,
        locationRiskTags: location.riskTags,
        locationRelatedAreaNames: location.relatedAreaNames,
        locationRelatedNpcNames: location.relatedNpcNames,
        actionRiskTags: action.riskTags,
        actionRelatedNpcNames: action.relatedNpcNames,
      });
      if (eventResult.message) {
        message = `${message} ${eventResult.message}`;
      }
    } catch {
      // 事件池触发失败不影响地点行动
    }
  }

  return { createdTasks, skippedTasks, message, eventResult };
}
