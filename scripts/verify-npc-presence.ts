/**
 * 校验 NPC 行踪规则：profile 引用、地点 id、唯一 home、临时位置冲突预警。
 * 用法: npm run verify:npc-presence
 */
import { MAP_LOCATIONS } from "../src/data/locations";
import { LOCATION_SANDTABLE_AREAS } from "../src/data/locationSandtableAreas";
import { NPC_PROFILES } from "../src/data/npcProfiles";
import {
  NPC_PRESENCE_RULES,
  type NpcPresenceRule,
} from "../src/data/npcPresenceRules";
import { getLocationDisplayNameById } from "../src/game/locationDisplayName";

const VALID_LOCATION_IDS = new Set([
  ...MAP_LOCATIONS.map((location) => location.id),
  ...LOCATION_SANDTABLE_AREAS.map((area) => area.id),
]);

const PROFILE_IDS = new Set(NPC_PROFILES.map((profile) => profile.id));

function validateLocationId(locationId: string, label: string): string | undefined {
  if (!VALID_LOCATION_IDS.has(locationId)) {
    return `${label} 地点 id 不存在: ${locationId}`;
  }
  return undefined;
}

function checkPriorityWarnings(rule: NpcPresenceRule): string[] {
  const warnings: string[] = [];
  const temps = rule.temporaryLocations ?? [];
  const byPriority = new Map<number, typeof temps>();

  for (const temp of temps) {
    const priority = temp.priority ?? 99;
    const bucket = byPriority.get(priority) ?? [];
    bucket.push(temp);
    byPriority.set(priority, bucket);
  }

  for (const [priority, bucket] of byPriority) {
    if (bucket.length <= 1) continue;
    const taskSets = bucket.map((item) => (item.taskSlugs ?? []).sort().join("|"));
    const uniqueTaskSets = new Set(taskSets);
    if (uniqueTaskSets.size < bucket.length || bucket.some((item) => (item.taskSlugs?.length ?? 0) === 0)) {
      warnings.push(
        `${rule.npcId}: 优先级 ${priority} 存在 ${bucket.length} 条临时规则，任务条件可能同时满足`,
      );
    }
  }

  return warnings;
}

function main() {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenNpcIds = new Set<string>();

  console.log("=== NPC 行踪规则校验 ===\n");

  for (const rule of NPC_PRESENCE_RULES) {
    if (!PROFILE_IDS.has(rule.npcId)) {
      errors.push(`npcId 不存在于 NPC_PROFILES: ${rule.npcId}`);
    }
    if (seenNpcIds.has(rule.npcId)) {
      errors.push(`重复 npcId 规则: ${rule.npcId}`);
    }
    seenNpcIds.add(rule.npcId);

    const homeError = validateLocationId(rule.homeLocationId, `${rule.npcId} homeLocationId`);
    if (homeError) errors.push(homeError);

    for (const temp of rule.temporaryLocations ?? []) {
      const tempError = validateLocationId(
        temp.locationId,
        `${rule.npcId} temporaryLocations`,
      );
      if (tempError) errors.push(tempError);
    }

    warnings.push(...checkPriorityWarnings(rule));

    const homeName = getLocationDisplayNameById(rule.homeLocationId);
    const tempSummary =
      rule.temporaryLocations?.map(
        (temp) => `${getLocationDisplayNameById(temp.locationId)} (${temp.reason})`,
      ).join("；") || "无";

    console.log(`${rule.npcId}`);
    console.log(`  常驻: ${homeName} (${rule.homeLocationId})`);
    console.log(`  临时: ${tempSummary}`);
    console.log("");
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

  console.log(`✓ ${NPC_PRESENCE_RULES.length} 条行踪规则校验通过`);
}

main();
