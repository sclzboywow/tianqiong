import type { ProjectState, Task } from "@prisma/client";
import { LOCATION_ACTIONS, type LocationAction } from "@/data/locationActions";
import { hasReachedStage } from "./contentUnlockEngine";
import { parseMilestones } from "./projectEngine";
import { getProjectState } from "./projectEngine";
import { createTaskFromTemplateSlug } from "./taskEngine";

export type LocationActionExecuteResult = {
  createdTasks: Task[];
  skippedTasks: { slug: string; title: string; reason: string }[];
  message: string;
};

export function isLocationActionUnlocked(action: LocationAction, projectState: ProjectState): boolean {
  const requiredStage = action.unlockStage || "INITIATION";
  if (!hasReachedStage(projectState.currentStage, requiredStage)) return false;

  const milestones = parseMilestones(projectState);
  if (action.unlockMilestones?.some((key) => !milestones[key])) return false;

  return true;
}

export function getActionsForLocation(
  locationId: string,
  projectState: ProjectState,
): LocationAction[] {
  return LOCATION_ACTIONS.filter(
    (action) => action.locationId === locationId && isLocationActionUnlocked(action, projectState),
  );
}

export async function executeLocationAction(
  locationId: string,
  actionId: string,
): Promise<LocationActionExecuteResult> {
  const action = LOCATION_ACTIONS.find(
    (item) => item.id === actionId && item.locationId === locationId,
  );
  if (!action) throw new Error("行动不存在");

  const project = await getProjectState();
  if (!project) throw new Error("项目状态未初始化");

  const { getLocationById, isLocationUnlocked } = await import("./locationEngine");
  const location = await getLocationById(locationId);
  if (!location) throw new Error("地点不存在");
  if (!isLocationUnlocked(location, project)) throw new Error("地点尚未解锁");
  if (!isLocationActionUnlocked(action, project)) throw new Error("行动尚未解锁");

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
        reason: "已有进行中的同类任务",
      });
    }
  }

  let message: string;
  if (createdTasks.length > 0 && skippedTasks.length > 0) {
    message = `已生成 ${createdTasks.length} 项任务，${skippedTasks.length} 项因已有进行中任务而跳过`;
  } else if (createdTasks.length > 0) {
    message = `已生成 ${createdTasks.length} 项任务`;
  } else if (skippedTasks.length > 0) {
    message = "相关任务已在进行中，未重复生成";
  } else {
    message = "未配置可触发的任务";
  }

  return { createdTasks, skippedTasks, message };
}
