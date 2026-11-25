import { describe, expect, it } from "vitest";
import { parseEncounterId } from "../src/encounter";

describe("encounter id validation", () => {
  it("accepts positive integer ids", () => {
    expect(parseEncounterId("1")).toBe(1n);
    expect(parseEncounterId("18446744073709551615")).toBe(18446744073709551615n);
  });

  it("rejects malformed, negative, fractional and empty ids", () => {
    for (const value of ["", "0", "-1", "1.5", "abc", "1/2", " 1 ", "1e3", "x".repeat(100)]) {
      expect(() => parseEncounterId(value)).toThrow(/Invalid encounter id/);
    }
  });
});
