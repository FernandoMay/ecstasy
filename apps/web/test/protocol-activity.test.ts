import { describe, expect, it } from "vitest";
import { filterActivity, protocolActivity } from "../lib/protocol-activity";
import { EVIDENCE } from "../lib/evidence";

describe("protocol activity", () => {
  it("merges local transitions with real evidence without duplicates", () => {
    const entries = protocolActivity([
      { id: "7", from: "Created", to: "Accepted", at: 100 },
    ]);
    expect(entries.length).toBe(EVIDENCE.length + 1);
    expect(new Set(entries.map((e) => e.key)).size).toBe(entries.length);
  });

  it("filters by kind", () => {
    const entries = protocolActivity([
      { id: "7", from: "Created", to: "Accepted", at: 100 },
    ]);
    expect(filterActivity(entries, "state")).toHaveLength(1);
    expect(filterActivity(entries, "transaction")).toHaveLength(EVIDENCE.length);
  });
});
