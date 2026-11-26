import { describe, expect, it } from "vitest";
import { findChallengePayment } from "../lib/payment-reconcile";

describe("Horizon reconciliation", () => {
  it("finds only successful challenge payments", () => {
    expect(
      findChallengePayment([
        { hash: "failed", successful: false, memo: "SHIP-S97KF8", memo_type: "text" },
        { hash: "other", successful: true, memo: "HELLO", memo_type: "text" },
        { hash: "found", successful: true, memo: "SHIP-S97KF8", memo_type: "text" },
      ]),
    ).toBe("found");
  });

  it("returns null when no confirmed payment exists", () => {
    expect(findChallengePayment([])).toBeNull();
    expect(findChallengePayment([{ hash: "x", successful: true }])).toBeNull();
  });
});
