import { describe, expect, it } from "vitest";
import {
  decryptTerms,
  encryptTerms,
  envelopeToText,
  parseEnvelopeText,
} from "../lib/terms-envelope";
import type { TermsDocument } from "@ecstasy/stellar";

const terms: TermsDocument = {
  schema: "ecstasy.terms/v1",
  title: "Private terms",
  summary: "Line one\nLine two",
  boundaries: ["No recording"],
  durationMinutes: 60,
  locationHint: "Coarse area",
  createdAt: "2026-11-26T00:00:00.000Z",
};

describe("encrypted terms envelope", () => {
  it("round-trips through the shareable text format", async () => {
    const envelope = await encryptTerms(terms, "shared-passphrase");
    const text = envelopeToText(envelope);
    expect(text.startsWith("ECSTASY-TERMS-1:")).toBe(true);
    expect(await decryptTerms(parseEnvelopeText(text), "shared-passphrase")).toEqual(terms);
  });

  it("rejects a wrong passphrase and tampering", async () => {
    const envelope = await encryptTerms(terms, "right-passphrase");
    await expect(decryptTerms(envelope, "wrong-passphrase")).rejects.toThrow();
    const tampered = { ...envelope, ciphertext: envelope.ciphertext.slice(0, -2) + "00" };
    await expect(decryptTerms(tampered, "right-passphrase")).rejects.toThrow();
  });

  it("requires a reasonable passphrase and validates the envelope", async () => {
    await expect(encryptTerms(terms, "short")).rejects.toThrow(/8 characters/);
    expect(() => parseEnvelopeText("garbage")).toThrow();
    await expect(
      decryptTerms({ ...envelopeShape(), v: 2 as never }, "pass"),
    ).rejects.toThrow(/Unsupported/);
  });
});

function envelopeShape() {
  return {
    v: 1 as const,
    alg: "AES-GCM-256" as const,
    kdf: "PBKDF2-SHA256" as const,
    iterations: 120_000,
    salt: "00",
    iv: "00",
    ciphertext: "00",
  };
}
