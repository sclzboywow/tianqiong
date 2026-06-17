export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function rollSuccess(rate: number): boolean {
  if (process.env.CHAPTER1_FLOW_TEST === "1") return true;
  return Math.random() * 100 < rate;
}
