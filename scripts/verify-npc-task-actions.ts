/**
 * 校验 NPC 任务推进动作配置。
 * 用法: npm run verify:npc-actions
 */
import { MAP_LOCATIONS } from "../src/data/locations";
import { LOCATION_SANDTABLE_AREAS } from "../src/data/locationSandtableAreas";
import { NPC_PROFILES } from "../src/data/npcProfiles";
import { NPC_TASK_ACTIONS } from "../src/data/npcTaskActions";
import { NPC_TASK_REQUIREMENTS } from "../src/data/npcTaskRequirements";
import { TASK_TEMPLATES } from "../src/data/taskTemplates";

const VALID_LOCATION_IDS = new Set([
  ...MAP_LOCATIONS.map((location) => location.id),
  ...LOCATION_SANDTABLE_AREAS.map((area) => area.id),
]);

const PROFILE_IDS = new Set(NPC_PROFILES.map((profile) => profile.id));
const TASK_SLUGS = new Set(TASK_TEMPLATES.map((template) => template.slug));
const REQUIREMENT_SLUGS = new Set(NPC_TASK_REQUIREMENTS.map((item) => item.taskSlug));
const ACTION_BY_ID = new Map(NPC_TASK_ACTIONS.map((action) => [action.id, action]));
const ACTION_IDS = new Set<string>();

function validateLocationId(locationId: string, label: string): string | undefined {
  if (!VALID_LOCATION_IDS.has(locationId)) {
    return `${label} 地点 id 不存在: ${locationId}`;
  }
  return undefined;
}

function validateNpcId(npcId: string, label: string): string | undefined {
  if (!PROFILE_IDS.has(npcId)) {
    return `${label} npcId 不存在: ${npcId}`;
  }
  return undefined;
}

function main() {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log("=== NPC 任务推进动作校验 ===\n");

  for (const action of NPC_TASK_ACTIONS) {
    if (ACTION_IDS.has(action.id)) {
      errors.push(`重复 action id: ${action.id}`);
    }
    ACTION_IDS.add(action.id);

    if (!TASK_SLUGS.has(action.taskSlug)) {
      errors.push(`${action.id}: taskSlug 不存在于任务模板: ${action.taskSlug}`);
    }

    const locationError = validateLocationId(action.locationId, action.id);
    if (locationError) errors.push(locationError);

    if (action.targetNpcId) {
      const npcError = validateNpcId(action.targetNpcId, action.id);
      if (npcError) errors.push(npcError);
    } else if (action.type === "contact_npc" || action.type === "invite_npc") {
      warnings.push(`${action.id}: ${action.type} 缺少 targetNpcId`);
    }

    if (action.type === "go_to_location" && !action.targetLocationId) {
      errors.push(`${action.id}: go_to_location 缺少 targetLocationId`);
    }

    if (action.targetLocationId) {
      const targetError = validateLocationId(action.targetLocationId, `${action.id} targetLocationId`);
      if (targetError) errors.push(targetError);
    }

    if (action.requiresCanProgress && !REQUIREMENT_SLUGS.has(action.taskSlug)) {
      errors.push(`${action.id}: requiresCanProgress 但任务无 NPC_TASK_REQUIREMENTS 配置`);
    }

    for (const depId of action.dependsOnActionIds ?? []) {
      const dep = ACTION_BY_ID.get(depId);
      if (!dep) {
        errors.push(`${action.id}: dependsOnActionIds 引用不存在: ${depId}`);
        continue;
      }
      if (dep.taskSlug !== action.taskSlug) {
        errors.push(`${action.id}: 依赖动作 ${depId} 不属于同一 taskSlug`);
      }
      if (dep.sortOrder >= action.sortOrder) {
        errors.push(`${action.id}: 依赖动作 ${depId} sortOrder 应小于当前动作`);
      }
    }

    console.log(`${action.id} (${action.taskSlug} @ ${action.locationId}) → ${action.label}`);
  }

  console.log("");

  for (const requirement of NPC_TASK_REQUIREMENTS) {
    const locations = [requirement.locationId, ...(requirement.hintLocationIds ?? [])];
    const hasAction = locations.some((locationId) =>
      NPC_TASK_ACTIONS.some(
        (action) => action.taskSlug === requirement.taskSlug && action.locationId === locationId,
      ),
    );
    if (!hasAction) {
      warnings.push(`${requirement.taskSlug}: 未配置任何推进动作`);
    }
  }

  if (warnings.length > 0) {
    console.log("--- 预警 ---");
    for (const warning of warnings) {
      console.log(`⚠ ${warning}`);
    }
    console.log("");
  }

  if (errors.length > 0) {
    console.log("--- 错误 ---");
    for (const error of errors) {
      console.log(`✗ ${error}`);
    }
    process.exit(1);
  }

  console.log(`✓ ${NPC_TASK_ACTIONS.length} 条 NPC 任务动作校验通过`);
}

main();
