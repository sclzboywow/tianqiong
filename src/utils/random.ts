export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function rollSuccess(rate: number): boolean {
  return Math.random() * 100 < rate;
}
