import type { StatusName } from "@ecstasy/stellar";

export interface TimelineStep {
  key: string;
  label: string;
  done: boolean;
}

/** Visual milestones derived from on-chain state and completion flags. */
export function timelineSteps(
  status: StatusName,
  flags: { creatorCompleted: boolean; participantCompleted: boolean },
): TimelineStep[] {
  const advanced = ["Accepted", "Completed", "Settled"].includes(status);
  return [
    { key: "created", label: "CREATED", done: true },
    { key: "accepted", label: "ACCEPTED", done: advanced },
    { key: "creator-completed", label: "CREATOR COMPLETED", done: flags.creatorCompleted },
    { key: "participant-completed", label: "PARTICIPANT COMPLETED", done: flags.participantCompleted },
    { key: "settled", label: "SETTLED", done: status === "Settled" },
  ];
}
