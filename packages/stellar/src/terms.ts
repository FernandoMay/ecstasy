/**
 * Canonicalization and commitment for private terms.
 *
 * Only the SHA-256 digest is sent on-chain. The document itself stays in
 * the client. A hash is a commitment, not encryption: if the preimage is
 * public elsewhere, the hash gives no confidentiality.
 */

export const TERMS_SCHEMA = "ecstasy.terms/v1";

export interface TermsDocument {
  /** Must equal TERMS_SCHEMA. */
  schema: string;
  title: string;
  summary: string;
  /** Explicit, user-stated boundaries. No secrets or private keys. */
  boundaries: string[];
  /** Planned duration in minutes. */
  durationMinutes: number;
  /** Optional, deliberately coarse hint. Never a precise address. */
  locationHint?: string;
  /** ISO-8601 timestamp. */
  createdAt: string;
}

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n?/g, "\n").replace(/\n+$/, "");
}

function cleanLine(line: string): string {
  return line.replace(/[\t ]+$/, "");
}

function normalizeText(value: string): string {
  return normalizeLineEndings(value)
    .split("\n")
    .map(cleanLine)
    .join("\n")
    .normalize("NFC")
    .trim();
}

/** Deterministic UTF-8 JSON with sorted keys and normalized text. */
export function canonicalizeTerms(terms: TermsDocument): string {
  if (terms.schema !== TERMS_SCHEMA) {
    throw new Error(`Unsupported terms schema: ${terms.schema}`);
  }
  if (!Number.isInteger(terms.durationMinutes) || terms.durationMinutes < 0) {
    throw new Error("durationMinutes must be a non-negative integer");
  }
  if (!Number.isFinite(Date.parse(terms.createdAt))) {
    throw new Error("createdAt must be an ISO-8601 timestamp");
  }
  if (terms.boundaries.some((item) => typeof item !== "string")) {
    throw new Error("boundaries must be strings");
  }

  const fields: Record<string, unknown> = {
    boundaries: terms.boundaries.map(normalizeText),
    createdAt: new Date(terms.createdAt).toISOString(),
    durationMinutes: terms.durationMinutes,
    schema: terms.schema,
    summary: normalizeText(terms.summary),
    title: normalizeText(terms.title),
  };
  if (terms.locationHint !== undefined) {
    fields.locationHint = normalizeText(terms.locationHint);
  }

  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(fields).sort()) {
    sorted[key] = fields[key];
  }
  return JSON.stringify(sorted);
}

/** SHA-256 of the canonical document. Available in browsers and Node 20+. */
export async function termsDigest(terms: TermsDocument): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(canonicalizeTerms(terms));
  return new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes));
}

/** Alias kept for callers that want to be explicit about async hashing. */
export const termsDigestAsync = termsDigest;

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function fromHex(hex: string): Uint8Array {
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("Expected a 32-byte hex digest");
  }
  return Uint8Array.from(hex.match(/.{2}/g)!, (pair) => parseInt(pair, 16));
}

/** Short human-readable fingerprint shown in the UI. */
export function shortHash(hex: string): string {
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
}
