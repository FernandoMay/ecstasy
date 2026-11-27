import { describe, expect, it } from "vitest";
import { addFeedback, parseFeedback } from "../lib/afterglow-feedback";

describe("structured afterglow feedback", () => {
  it("rejects malformed or out-of-range entries", () => {
    expect(parseFeedback("bad")).toEqual([]);
    expect(parseFeedback('[{"encounterId":"1","score":101,"tags":[],"submittedAt":1}]')).toEqual([]);
  });

  it("keeps one feedback record per encounter", () => {
    let raw: string | null = null;
    raw = addFeedback(raw, { encounterId: "1", score: 80, tags: ["Claridad"], submittedAt: 1 });
    raw = addFeedback(raw, { encounterId: "1", score: 90, tags: ["Respeto"], submittedAt: 2 });
    const list = parseFeedback(raw);
    expect(list).toHaveLength(1);
    expect(list[0]?.score).toBe(90);
  });
});
