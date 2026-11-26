/** Defense-in-depth: which actions the UI may show for a given actor/state.
 * The contract remains authoritative; this prevents impossible or irrelevant
 * actions from being offered before a transaction is built.
 */

import { canTransition, type StatusName } from "@ecstasy/stellar";

export type Role = "creator" | "participant" | "viewer";
export type Action =
  | "accept"
  | "decline"
  | "complete"
  | "settle"
  | "cancel"
  | "expire"
  | "afterglow";

export interface ActionState {
  status: StatusName;
  role: Role;
  creatorCompleted?: boolean;
  participantCompleted?: boolean;
  afterglowSubmitted?: boolean;
}

export function availableActions(state: ActionState): Action[] {
  const party = state.role !== "viewer";
  const actions: Action[] = [];

  if (state.status === "Created") {
    if (state.role === "participant") actions.push("accept", "decline");
    if (state.role === "creator") actions.push("cancel");
  } else if (state.status === "Accepted") {
    if (party) actions.push("complete", "cancel");
  } else if (state.status === "Completed" && party && canTransition("Completed", "Settled")) {
    actions.push("settle");
  } else if (state.status === "Settled" && party && !state.afterglowSubmitted) {
    actions.push("afterglow");
  } else if (state.status === "Expired") {
    // Permissionless maintenance: any viewer may finalize the refund.
    actions.push("expire");
  }

  return actions;
}
