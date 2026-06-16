export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function displayProgress(value: number): number {
  return clamp(value, 0, 100);
}
