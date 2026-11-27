/** Unified, filterable timeline from local state transitions and real Testnet evidence. */

import { EVIDENCE, type EvidenceRecord } from "./evidence";
import type { ActivityItem } from "./activity";

export interface ActivityEntry {
  key: string;
  kind: "state" | "transaction";
  title: string;
  detail: string;
  at?: number;
  hash?: string;
}

export type ActivityFilter = "all" | "state" | "transaction";

export function protocolActivity(local: readonly ActivityItem[]): ActivityEntry[] {
  const fromLocal: ActivityEntry[] = local.map((item) => ({
    key: `state-${item.id}-${item.at}-${item.from}-${item.to}`,
    kind: "state",
    title: `Encounter #${item.id}`,
    detail: `${item.from} → ${item.to}`,
    at: item.at,
  }));
  const fromEvidence: ActivityEntry[] = EVIDENCE.map((record: EvidenceRecord) => ({
    key: `tx-${record.hash}`,
    kind: "transaction",
    title: record.feature,
    detail: record.observed,
    hash: record.hash,
  }));
  return [...fromLocal, ...fromEvidence].sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
}

export function filterActivity(entries: readonly ActivityEntry[], filter: ActivityFilter): ActivityEntry[] {
  return filter === "all" ? [...entries] : entries.filter((entry) => entry.kind === filter);
}
