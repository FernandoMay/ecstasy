import { describe, expect, it } from "vitest";
import { reconcile } from "../lib/reconciliation";

describe("three-layer reconciliation", () => {
  it("reports consistent when all layers agree", () => {
    expect(reconcile({ local: "Settled", contract: "Settled", horizon: "SUCCESS" }).state).toBe("consistent");
  });

  it("reports divergent on a mismatch", () => {
    expect(reconcile({ local: "Accepted", contract: "Settled", horizon: "SUCCESS" }).state).toBe("divergent");
  });

  it("never claims consistency with missing evidence", () => {
    expect(reconcile({ local: "Settled", contract: "Settled" }).state).toBe("incomplete");
    expect(reconcile({ local: "Settled", contract: "Settled", horizon: "PENDING" }).state).toBe("incomplete");
    expect(reconcile({}).state).toBe("incomplete");
  });
});
