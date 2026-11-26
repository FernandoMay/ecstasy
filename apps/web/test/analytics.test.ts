import { describe, expect, it } from "vitest";
import { analytics } from "../lib/analytics";

describe("analytics", () => {
  it("counts only observed statuses", () => {
    const result = analytics({ "1": "Settled", "2": "Accepted", "3": "Settled" }, 18);
    expect(result.total).toBe(3);
    expect(result.byStatus).toEqual({ Settled: 2, Accepted: 1 });
    expect(result.evidenceCount).toBe(18);
  });

  it("handles an empty index", () => {
    expect(analytics({}, 0)).toEqual({ total: 0, byStatus: {}, evidenceCount: 0 });
  });
});
