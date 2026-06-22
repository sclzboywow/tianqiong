export function suggestRiskEventSlug(
  nodeSlug: string,
  reservedSlugs: Iterable<string>,
): string {
  const taken = new Set(reservedSlugs);
  const base = `event_${nodeSlug}`;
  if (!taken.has(base)) return base;
  let index = 2;
  while (taken.has(`${base}_${index}`)) index += 1;
  return `${base}_${index}`;
}
