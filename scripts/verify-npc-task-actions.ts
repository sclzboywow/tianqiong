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
    }

    if (action.targetLocationId) {
      const targetError = validateLocationId(action.targetLocationId, `${action.id} targetLocationId`);
      if (targetError) errors.push(targetError);
    }

    for (const depId of action.dependsOnActionIds ?? []) {
      if (!NPC_TASK_ACTIONS.some((item) => item.id === depId)) {
        errors.push(`${action.id}: dependsOnActionIds 引用不存在: ${depId}`);
      }
    }

    console.log(`${action.id} (${action.taskSlug} @ ${action.locationId}) → ${action.label}`);
  }

  console.log("");

  for (const requirement of NPC_TASK_REQUIREMENTS) {
    const locations = [
      requirement.locationId,
      ...(requirement.hintLocationIds ?? []),
    ];
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
