/** Counters derived from the local index and live contract reads. Not protocol-wide stats. */

export interface AnalyticsResult {
  total: number;
  byStatus: Record<string, number>;
  evidenceCount: number;
}

export function analytics(
  statuses: Record<string, string>,
  evidenceCount: number,
): AnalyticsResult {
  const byStatus: Record<string, number> = {};
  for (const status of Object.values(statuses)) {
    byStatus[status] = (byStatus[status] ?? 0) + 1;
  }
  return { total: Object.keys(statuses).length, byStatus, evidenceCount };
}
