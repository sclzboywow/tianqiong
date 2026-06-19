/**
 * 校验 NPC 任务推进需求配置。
 * 用法: npm run verify:npc-tasks
 */
import { MAP_LOCATIONS } from "../src/data/locations";
import { LOCATION_SANDTABLE_AREAS } from "../src/data/locationSandtableAreas";
import { NPC_PROFILES } from "../src/data/npcProfiles";
import { NPC_TASK_REQUIREMENTS } from "../src/data/npcTaskRequirements";
import { TASK_TEMPLATES } from "../src/data/taskTemplates";
import { getNpcTaskRequirementBySlug } from "../src/game/npcTaskRequirementResolver";

const VALID_LOCATION_IDS = new Set([
  ...MAP_LOCATIONS.map((location) => location.id),
  ...LOCATION_SANDTABLE_AREAS.map((area) => area.id),
]);

const PROFILE_IDS = new Set(NPC_PROFILES.map((profile) => profile.id));

const TASK_SLUGS = new Set(TASK_TEMPLATES.map((template) => template.slug));

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

  console.log("=== NPC 任务推进需求校验 ===\n");

  for (const requirement of NPC_TASK_REQUIREMENTS) {
    console.log(`${requirement.taskSlug} → ${requirement.taskTitle ?? requirement.taskSlug}`);

    if (!TASK_SLUGS.has(requirement.taskSlug)) {
      errors.push(`taskSlug 不存在于任务模板: ${requirement.taskSlug}`);
    }

    const homeError = validateLocationId(requirement.locationId, requirement.taskSlug);
    if (homeError) errors.push(homeError);

    for (const locationId of requirement.hintLocationIds ?? []) {
      const hintError = validateLocationId(locationId, `${requirement.taskSlug} hintLocationIds`);
      if (hintError) errors.push(hintError);
    }

    const primaryError = validateNpcId(requirement.primaryNpcId, `${requirement.taskSlug} primaryNpcId`);
    if (primaryError) errors.push(primaryError);

    for (const npcId of requirement.supportNpcIds ?? []) {
      const supportError = validateNpcId(npcId, `${requirement.taskSlug} supportNpcIds`);
      if (supportError) errors.push(supportError);
    }

    for (const npcId of requirement.blockerNpcIds ?? []) {
      const blockerError = validateNpcId(npcId, `${requirement.taskSlug} blockerNpcIds`);
      if (blockerError) errors.push(blockerError);
    }

    const resolved = getNpcTaskRequirementBySlug(requirement.taskSlug);
    if (!resolved?.primaryNpcId) {
      errors.push(`${requirement.taskSlug}: 无法解析主 NPC`);
    }

    console.log(`  主 NPC: ${requirement.primaryNpcId}`);
    console.log(`  地点: ${requirement.locationId}`);
    console.log("");
  }

  if (errors.length > 0) {
    console.log("--- 错误 ---");
    for (const error of errors) {
      console.log(`✗ ${error}`);
    }
    process.exit(1);
  }

  console.log(`✓ ${NPC_TASK_REQUIREMENTS.length} 条 NPC 任务需求校验通过`);
}

main();
