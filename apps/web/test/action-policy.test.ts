import { describe, expect, it } from "vitest";
import { availableActions, type ActionState } from "../lib/action-policy";

const state = (overrides: Partial<ActionState>): ActionState => ({
  status: "Created",
  role: "viewer",
  ...overrides,
});

describe("action visibility policy", () => {
  it("shows consent only to the participant", () => {
    expect(availableActions(state({ role: "participant" }))).toEqual(["accept", "decline"]);
    expect(availableActions(state({ role: "creator" }))).toEqual(["cancel"]);
    expect(availableActions(state({ role: "viewer" }))).toEqual([]);
  });

  it("shows completion and cancel to both parties only while Accepted", () => {
    expect(availableActions(state({ status: "Accepted", role: "creator" }))).toEqual(["complete", "cancel"]);
    expect(availableActions(state({ status: "Accepted", role: "participant" }))).toEqual(["complete", "cancel"]);
    expect(availableActions(state({ status: "Accepted", role: "viewer" }))).toEqual([]);
  });

  it("hides settle, afterglow and expiry when not applicable", () => {
    expect(availableActions(state({ status: "Completed", role: "creator" }))).toEqual(["settle"]);
    expect(availableActions(state({ status: "Settled", role: "creator", afterglowSubmitted: true }))).toEqual([]);
    expect(availableActions(state({ status: "Settled", role: "creator" }))).toEqual(["afterglow"]);
    expect(availableActions(state({ status: "Expired", role: "viewer" }))).toEqual(["expire"]);
    expect(availableActions(state({ status: "Cancelled", role: "creator" }))).toEqual([]);
  });
});
