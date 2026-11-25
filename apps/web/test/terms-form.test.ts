import { describe, expect, it } from "vitest";
import {
  commitmentBytes,
  commitmentForFields,
  termsFromFields,
  type TermsFormFields,
} from "../lib/terms-form";

const CREATED_AT = "2026-11-25T04:00:00.000Z";
const fields: TermsFormFields = {
  title: "A private agreement",
  summary: "Line one\r\nLine two",
  boundariesText: "No recording\nRespect the agreed time",
  durationMinutes: "60",
  locationHint: "",
};

describe("terms form commitment (P0.1)", () => {
  it("preview → no edit → submit preserves the same digest", async () => {
    const preview = await commitmentForFields(fields, CREATED_AT);
    const submit = await commitmentForFields(fields, CREATED_AT);
    expect(submit.hex).toBe(preview.hex);
    expect(submit.canonical).toBe(preview.canonical);
  });

  it("preview → edit one field → submit commits the new visible terms", async () => {
    const preview = await commitmentForFields(fields, CREATED_AT);
    const edited = { ...fields, durationMinutes: "61" };
    const submit = await commitmentForFields(edited, CREATED_AT);

    expect(submit.hex).not.toBe(preview.hex);
    expect(termsFromFields(edited, CREATED_AT).durationMinutes).toBe(61);

    // The digest is the hash of exactly the document shown to the participant.
    const { canonicalizeTerms } = await import("@ecstasy/stellar");
    expect(submit.canonical).toBe(canonicalizeTerms(submit.terms));
    expect(commitmentBytes(submit.hex)).toHaveLength(32);
  });

  it("editing any term field changes the commitment", async () => {
    const variants: TermsFormFields[] = [
      { ...fields, title: "Different title" },
      { ...fields, summary: "Different summary" },
      { ...fields, boundariesText: "Different boundary" },
      { ...fields, locationHint: "Coarse hint" },
      { ...fields, durationMinutes: "30" },
    ];
    const base = (await commitmentForFields(fields, CREATED_AT)).hex;
    for (const variant of variants) {
      expect((await commitmentForFields(variant, CREATED_AT)).hex).not.toBe(base);
    }
  });

  it("rejects malformed values before building a document", () => {
    expect(() => termsFromFields({ ...fields, durationMinutes: "1.5" }, CREATED_AT)).toThrow();
    expect(() => termsFromFields({ ...fields, durationMinutes: "-1" }, CREATED_AT)).toThrow();
  });
});
