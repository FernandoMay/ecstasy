/** In-app activity derived from public on-chain status changes only. */

export interface ActivityItem {
  id: string;
  from: string;
  to: string;
  at: number;
}

export const ACTIVITY_KEY = "ecstasy:activity";

export function parseActivity(raw: string | null): ActivityItem[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is ActivityItem =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as ActivityItem).id === "string" &&
        typeof (item as ActivityItem).from === "string" &&
        typeof (item as ActivityItem).to === "string" &&
        typeof (item as ActivityItem).at === "number",
    );
  } catch {
    return [];
  }
}

/** Returns newly observed transitions plus the state to persist. */
export function diffStatuses(
  previous: Record<string, string>,
  current: Record<string, string>,
  now: number = Date.now(),
  maxItems = 20,
): { items: ActivityItem[]; next: Record<string, string> } {
  const items: ActivityItem[] = [];
  for (const [id, to] of Object.entries(current)) {
    const from = previous[id];
    if (from && from !== to && to !== "unknown") {
      items.push({ id, from, to, at: now });
    }
  }
  return { items, next: { ...previous, ...current } };
}

export function mergeActivity(raw: string | null, items: ActivityItem[], maxItems = 20): string {
  return JSON.stringify([...items, ...parseActivity(raw)].slice(0, maxItems));
}
