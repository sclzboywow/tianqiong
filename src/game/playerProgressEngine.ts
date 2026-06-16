export const CHARACTER_GROWTH_LOG_PREFIX = "【角色成长】";

export function getRequiredExpForLevel(level: number): number {
  switch (level) {
    case 1:
      return 100;
    case 2:
      return 250;
    case 3:
      return 500;
    case 4:
      return 900;
    default:
      return level * level * 100;
  }
}

export function applyExpWithLevelUp(
  currentLevel: number,
  currentExp: number,
  expGain: number,
): { newLevel: number; newExp: number; levelsGained: number } {
  let level = currentLevel;
  let exp = currentExp + expGain;
  let levelsGained = 0;

  while (exp >= getRequiredExpForLevel(level)) {
    exp -= getRequiredExpForLevel(level);
    level += 1;
    levelsGained += 1;
  }

  return { newLevel: level, newExp: exp, levelsGained };
}
