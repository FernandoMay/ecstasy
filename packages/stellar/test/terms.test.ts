import { describe, expect, it } from "vitest";
import {
  canonicalizeTerms,
  fromHex,
  shortHash,
  TERMS_SCHEMA,
  termsDigest,
  toHex,
  type TermsDocument,
} from "../src/terms";

const base: TermsDocument = {
  schema: TERMS_SCHEMA,
  title: "A private agreement",
  summary: "First line\r\nSecond line   ",
  boundaries: ["No recording", "Respect the agreed time"],
  durationMinutes: 60,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("canonicalizeTerms", () => {
  it("is deterministic under key reordering and line-ending changes", () => {
    const reordered = {
      createdAt: base.createdAt,
      durationMinutes: base.durationMinutes,
      boundaries: base.boundaries,
      summary: "First line\nSecond line",
      title: base.title,
      schema: TERMS_SCHEMA,
    };
    expect(canonicalizeTerms(base)).toBe(canonicalizeTerms(reordered));
  });

  it("changes the commitment when one term changes", async () => {
    const first = toHex(await termsDigest(base));
    const second = toHex(await termsDigest({ ...base, durationMinutes: 61 }));
    expect(first).not.toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rejects an unsupported schema and malformed inputs", () => {
    expect(() => canonicalizeTerms({ ...base, schema: "v2" })).toThrow(/schema/);
    expect(() => canonicalizeTerms({ ...base, durationMinutes: -1 })).toThrow(/duration/);
    expect(() => canonicalizeTerms({ ...base, createdAt: "not-a-date" })).toThrow(/ISO/);
  });

  it("hex helpers round-trip and produce a short fingerprint", async () => {
    const hex = toHex(await termsDigest(base));
    expect(toHex(fromHex(hex))).toBe(hex);
    expect(shortHash(hex)).toBe(`${hex.slice(0, 8)}…${hex.slice(-6)}`);
    expect(() => fromHex("00")).toThrow(/32-byte/);
  });
});
