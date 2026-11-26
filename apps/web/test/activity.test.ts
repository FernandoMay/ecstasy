import { describe, expect, it } from "vitest";
import { diffStatuses, mergeActivity, parseActivity } from "../lib/activity";

describe("in-app activity", () => {
  it("ignores malformed storage", () => {
    expect(parseActivity(null)).toEqual([]);
    expect(parseActivity("nope")).toEqual([]);
  });

  it("reports only real transitions and stores the new baseline", () => {
    const result = diffStatuses(
      { "1": "Created", "2": "Accepted" },
      { "1": "Settled", "2": "Accepted", "3": "Created" },
      1000,
    );
    expect(result.items).toEqual([{ id: "1", from: "Created", to: "Settled", at: 1000 }]);
    expect(result.next["3"]).toBe("Created");
  });

  it("keeps bounded history newest-first", () => {
    const raw = mergeActivity(null, [{ id: "1", from: "Created", to: "Accepted", at: 10 }], 2);
    const next = mergeActivity(raw, [{ id: "2", from: "Created", to: "Settled", at: 20 }], 2);
    expect(parseActivity(next).map((item) => item.id)).toEqual(["2", "1"]);
  });
});
