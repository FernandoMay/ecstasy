import { describe, expect, it } from "vitest";
import { timelineSteps } from "../lib/encounter-timeline";

describe("encounter detail timeline", () => {
  it("shows only created as done for a fresh invitation", () => {
    const steps = timelineSteps("Created", { creatorCompleted: false, participantCompleted: false });
    expect(steps.filter((step) => step.done).map((step) => step.key)).toEqual(["created"]);
  });

  it("shows both completion flags before settlement", () => {
    const steps = timelineSteps("Completed", { creatorCompleted: true, participantCompleted: true });
    expect(steps.filter((step) => step.done).map((step) => step.key)).toEqual([
      "created",
      "accepted",
      "creator-completed",
      "participant-completed",
    ]);
  });

  it("shows every milestone as done after settlement", () => {
    const steps = timelineSteps("Settled", { creatorCompleted: true, participantCompleted: true });
    expect(steps.every((step) => step.done)).toBe(true);
  });

  it("does not mark terminal cancelled/expired as accepted", () => {
    expect(timelineSteps("Cancelled", { creatorCompleted: false, participantCompleted: false })[1]?.done).toBe(false);
    expect(timelineSteps("Expired", { creatorCompleted: false, participantCompleted: false })[1]?.done).toBe(false);
  });
});
