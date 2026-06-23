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

type PrerequisiteTaskRef = {
  slug: string;
  prerequisiteTaskSlugs?: string[];
};

export function buildPrerequisiteTaskMap(
  tasks: PrerequisiteTaskRef[],
  overrideSlug: string,
  overridePrerequisites: string[],
): Map<string, string[]> {
  return new Map(
    tasks.map((task) => [
      task.slug,
      task.slug === overrideSlug
        ? overridePrerequisites
        : task.prerequisiteTaskSlugs || [],
    ]),
  );
}

export function findPrerequisiteCyclePath(
  rootSlug: string,
  prerequisiteMap: Map<string, string[]>,
): string[] | null {
  const stack: string[] = [];
  const onStack = new Set<string>();

  function dfs(slug: string): string[] | null {
    if (onStack.has(slug)) {
      const startIndex = stack.indexOf(slug);
      if (startIndex === -1) return [slug];
      return [...stack.slice(startIndex), slug];
    }
    onStack.add(slug);
    stack.push(slug);
    for (const prereq of prerequisiteMap.get(slug) || []) {
      const cycle = dfs(prereq);
      if (cycle) return cycle;
    }
    stack.pop();
    onStack.delete(slug);
    return null;
  }

  return dfs(rootSlug);
}

export function formatPrerequisiteCycleIssue(cyclePath: string[]): string {
  return `流程关系存在循环依赖：${cyclePath.join(" → ")}`;
}
