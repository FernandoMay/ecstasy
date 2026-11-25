import {
  TERMS_SCHEMA,
  canonicalizeTerms,
  termsDigest,
  toHex,
  type TermsDocument,
} from "@ecstasy/stellar";

/** Raw values of the private-terms form. */
export interface TermsFormFields {
  title: string;
  summary: string;
  boundariesText: string;
  durationMinutes: string;
  locationHint: string;
}

/** The exact document, its canonical form and the digest sent on-chain. */
export interface TermsCommitment {
  terms: TermsDocument;
  canonical: string;
  hex: string;
}

/**
 * Build the terms document from the *current* form values. No cached values
 * are ever reused: a preview is only a display snapshot, never the source of
 * truth for a submission.
 */
export function termsFromFields(fields: TermsFormFields, createdAt: string): TermsDocument {
  const minutes = Number(fields.durationMinutes);
  if (!Number.isInteger(minutes) || minutes < 0) {
    throw new Error("Expiry must be a non-negative whole number of minutes");
  }
  return {
    schema: TERMS_SCHEMA,
    title: fields.title,
    summary: fields.summary,
    boundaries: fields.boundariesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    durationMinutes: minutes,
    ...(fields.locationHint.trim() ? { locationHint: fields.locationHint.trim() } : {}),
    createdAt,
  };
}

/** Recompute the commitment from the current form values every time. */
export async function commitmentForFields(
  fields: TermsFormFields,
  createdAt: string,
): Promise<TermsCommitment> {
  const terms = termsFromFields(fields, createdAt);
  return {
    terms,
    canonical: canonicalizeTerms(terms),
    hex: toHex(await termsDigest(terms)),
  };
}

export function commitmentBytes(hex: string): Uint8Array {
  if (!/^[0-9a-f]{64}$/.test(hex)) throw new Error("Expected a 32-byte hex digest");
  return Uint8Array.from(hex.match(/.{2}/g)!.map((pair) => parseInt(pair, 16)));
}
