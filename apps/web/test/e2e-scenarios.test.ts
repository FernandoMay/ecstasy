import { describe, expect, it } from "vitest";
import { E2E_STATUS, SCENARIOS, TEST_WALLETS, validateScenarios } from "../e2e/scenarios.mjs";

describe("E2E harness", () => {
  it("records owner-confirmed completion without inventing hashes", () => {
    expect(E2E_STATUS.state).toBe("completed");
    expect(E2E_STATUS.source).toBe("owner-confirmed");
  });

  it("defines valid, unique scenarios without secrets", () => {
    expect(() => validateScenarios()).not.toThrow();
    const summary = validateScenarios();
    expect(summary.scenarios).toBeGreaterThanOrEqual(9);
    expect(summary.steps).toBeGreaterThanOrEqual(32);
    expect(TEST_WALLETS.A.role).toBe("creator");
    expect(TEST_WALLETS.B.role).toBe("participant");
  });

  it("covers the happy path and terminal branches", () => {
    const ids = SCENARIOS.map((s) => s.id);
    expect(ids).toContain("happy-path");
    expect(ids).toContain("decline");
    expect(ids).toContain("cancel");
    expect(ids).toContain("expiry");
    expect(ids).toContain("wallet-session");
    expect(ids).toContain("terms-tampering");
    expect(ids).toContain("payment-reconciliation");
    expect(ids).toContain("payment-concurrency");
    expect(ids).toContain("wallet-reconnect");
  });

  it("rejects duplicate or incomplete steps", () => {
    const invalid = [{ id: "x", name: "x", steps: [{ id: "a", actor: "A", action: "", selector: "", expect: "", evidence: "" }] }];
    expect(() => validateScenarios(invalid as never)).toThrow();
  });
});
