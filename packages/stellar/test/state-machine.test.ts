import { describe, expect, it } from "vitest";
import { canTransition, isTerminal, nextStates, statusNameOf } from "../src/state-machine";

describe("encounter state machine", () => {
  it("allows only documented transitions", () => {
    expect(canTransition("Created", "Accepted")).toBe(true);
    expect(canTransition("Created", "Cancelled")).toBe(true);
    expect(canTransition("Accepted", "Completed")).toBe(true);
    expect(canTransition("Completed", "Settled")).toBe(true);
    expect(canTransition("Settled", "Completed")).toBe(false);
    expect(canTransition("Created", "Settled")).toBe(false);
    expect(canTransition("Cancelled", "Accepted")).toBe(false);
  });

  it("marks terminal states and exposes next states", () => {
    for (const terminal of ["Settled", "Cancelled", "Expired"] as const) {
      expect(isTerminal(terminal)).toBe(true);
      expect(nextStates(terminal)).toEqual([]);
    }
    expect(isTerminal("Created")).toBe(false);
  });

  it("normalises generated enum values", () => {
    expect(statusNameOf({ tag: "Completed", values: undefined })).toBe("Completed");
    expect(statusNameOf("Expired")).toBe("Expired");
  });
});
