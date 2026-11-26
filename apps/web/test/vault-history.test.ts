import { describe, expect, it } from "vitest";
import { addClaim, parseClaims } from "../lib/vault-history";

describe("vault claim history", () => {
  it("ignores malformed records", () => {
    expect(parseClaims("bad")).toEqual([]);
    expect(parseClaims('[{"hash":"abc","at":1,"amountStroops":"1"}]')).toEqual([]);
  });

  it("keeps newest first and bounded", () => {
    let raw: string | null = null;
    for (let i = 0; i < 5; i += 1) {
      raw = addClaim(raw, { hash: "a".repeat(63) + i, at: i, amountStroops: "100" }, 3);
    }
    const claims = parseClaims(raw);
    expect(claims).toHaveLength(3);
    expect(claims[0]?.at).toBe(4);
  });
});
