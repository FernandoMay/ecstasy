import { describe, expect, it } from "vitest";
import { findChallengePayment, reconciliationStatus } from "../lib/payment-reconcile";

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

describe("reconciliation status semantics", () => {
  it("treats not-found as pending, never failed", () => {
    expect(reconciliationStatus({ recordExists: true, foundHash: null })).toBe("pending");
    expect(reconciliationStatus({ recordExists: true })).toBe("pending");
    expect(reconciliationStatus({ recordExists: false, foundHash: "h" })).toBe("unknown");
  });

  it("resolves only an explicit successful hash", () => {
    expect(reconciliationStatus({ recordExists: true, foundHash: "tx-hash" })).toBe("settled");
  });
});
