const STORAGE_KEYS = {
  onboardingSeen: "tianqiong_onboarding_seen",
  firstActionHintSeen: "tianqiong_first_action_hint_seen",
  firstTaskResultHintSeen: "tianqiong_first_task_result_hint_seen",
} as const;

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function readFlag(key: string): boolean {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(key) === "1";
}

function writeFlag(key: string): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, "1");
}

export function isOnboardingSeen(): boolean {
  return readFlag(STORAGE_KEYS.onboardingSeen);
}

export function markOnboardingSeen(): void {
  writeFlag(STORAGE_KEYS.onboardingSeen);
}

export function isFirstActionHintSeen(): boolean {
  return readFlag(STORAGE_KEYS.firstActionHintSeen);
}

export function markFirstActionHintSeen(): void {
  writeFlag(STORAGE_KEYS.firstActionHintSeen);
}

export function isFirstTaskResultHintSeen(): boolean {
  return readFlag(STORAGE_KEYS.firstTaskResultHintSeen);
}

export function markFirstTaskResultHintSeen(): void {
  writeFlag(STORAGE_KEYS.firstTaskResultHintSeen);
}
