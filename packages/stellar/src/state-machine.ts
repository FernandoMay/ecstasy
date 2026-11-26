/** Authoritative, client-side view of the on-chain state machine.
 * Used to hide impossible actions; the contract remains the source of truth.
 */

import type { EncounterStatus } from "./generated/ecstasy";

export type StatusName =
  | "Created"
  | "Accepted"
  | "Completed"
  | "Settled"
  | "Cancelled"
  | "Expired";

const ALLOWED: Record<StatusName, readonly StatusName[]> = {
  Created: ["Accepted", "Cancelled", "Expired"],
  Accepted: ["Completed", "Cancelled", "Expired"],
  Completed: ["Settled"],
  Settled: [],
  Cancelled: [],
  Expired: [],
};

export function statusNameOf(status: EncounterStatus): StatusName {
  return (typeof status === "string" ? status : status.tag) as StatusName;
}

export function canTransition(from: StatusName, to: StatusName): boolean {
  return ALLOWED[from].includes(to);
}

export function isTerminal(status: StatusName): boolean {
  return ALLOWED[status].length === 0;
}

export function nextStates(status: StatusName): readonly StatusName[] {
  return ALLOWED[status];
}
