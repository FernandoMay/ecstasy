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
  const next: Record<string, string> = {};
  for (const [id, to] of Object.entries(current)) {
    // A transient RPC failure must not become a fake transition, nor poison
    // the baseline so the next successful read looks like "unknown → X".
    if (to === "unknown") continue;
    next[id] = to;
    const from = previous[id];
    if (from && from !== "unknown" && from !== to) {
      items.push({ id, from, to, at: now });
    }
  }
  return { items: items.slice(0, maxItems), next };
}

export function mergeActivity(raw: string | null, items: ActivityItem[], maxItems = 20): string {
  const seen = new Set<string>();
  const merged: ActivityItem[] = [];
  for (const item of [...items, ...parseActivity(raw)]) {
    const key = `${item.id}|${item.from}|${item.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return JSON.stringify(merged.slice(0, maxItems));
}
