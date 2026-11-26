import { describe, expect, it } from "vitest";
import { EVIDENCE, NEGATIVE_CASES, coverageMatrix, explorerUrl } from "../lib/evidence";

describe("evidence center data", () => {
  it("contains only full 64-hex real hashes", () => {
    for (const record of EVIDENCE) {
      expect(record.hash).toMatch(/^[0-9a-f]{64}$/);
      expect(explorerUrl(record.hash)).toContain("stellar.expert/explorer/testnet/tx/");
    }
  });

  it("marks coverage verified only when a full hash exists", () => {
    const matrix = coverageMatrix(EVIDENCE);
    expect(matrix.length).toBeGreaterThan(10);
    expect(matrix.every((row) => row.verified && row.hash)).toBe(true);
  });

  it("records deliberate failures with honest verification types", () => {
    expect(NEGATIVE_CASES.length).toBeGreaterThan(8);
    for (const item of NEGATIVE_CASES) {
      expect(["unit", "simulation", "transaction"]).toContain(item.verification);
      expect(item.reference.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate hashes and covers the state machine", () => {
    expect(new Set(EVIDENCE.map((item) => item.hash)).size).toBe(EVIDENCE.length);
    const names = EVIDENCE.map((item) => item.functionName);
    for (const fn of ["create_encounter", "accept_encounter", "settle_encounter", "decline_encounter", "cancel_encounter", "expire_encounter", "reclamar"]) {
      expect(names).toContain(fn);
    }
  });
});
