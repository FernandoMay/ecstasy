import { describe, expect, it } from "vitest";
import { afterglowInsights, filterFeedback } from "../lib/afterglow-insights";
import type { AfterglowFeedback } from "../lib/afterglow-feedback";

const feedback: AfterglowFeedback[] = [
  { encounterId: "1", score: 80, tags: ["Claridad", "Respeto"], submittedAt: 1 },
  { encounterId: "2", score: 100, tags: ["Claridad"], submittedAt: 2 },
];

describe("afterglow insights", () => {
  it("computes averages and tag counts from real stored data", () => {
    const result = afterglowInsights(feedback);
    expect(result.count).toBe(2);
    expect(result.average).toBe(90);
    expect(result.tags).toEqual({ Claridad: 2, Respeto: 1 });
    expect(result.byEncounter[0]?.encounterId).toBe("1");
  });

  it("handles empty history", () => {
    expect(afterglowInsights([])).toEqual({ count: 0, average: null, tags: {}, byEncounter: [] });
  });

  it("filters by minimum score", () => {
    expect(filterFeedback(feedback, 90).map((f) => f.encounterId)).toEqual(["2"]);
  });
});
