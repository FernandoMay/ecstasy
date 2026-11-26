/**
 * Client-side encrypted terms envelope. No server, no stored keys.
 *
 * Security properties: authenticated encryption (AES-GCM) with a key derived
 * from a shared passphrase (PBKDF2-SHA256). This is a convenience transport,
 * not forward secrecy: anyone with the passphrase can decrypt. Recovery is
 * only possible via the passphrase — users must share it out-of-band.
 */

import type { TermsDocument } from "@ecstasy/stellar";

export interface TermsEnvelope {
  v: 1;
  alg: "AES-GCM-256";
  kdf: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

const ITERATIONS = 120_000;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  if (!/^[0-9a-f]*$/i.test(hex) || hex.length % 2 !== 0) throw new Error("Invalid hex");
  return Uint8Array.from(hex.match(/.{2}/g) ?? [], (pair) => parseInt(pair, 16));
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return globalThis.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptTerms(
  terms: TermsDocument,
  passphrase: string,
): Promise<TermsEnvelope> {
  if (!passphrase || passphrase.length < 8) {
    throw new Error("Passphrase must be at least 8 characters");
  }
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    new TextEncoder().encode(JSON.stringify(terms)),
  );
  return {
    v: 1,
    alg: "AES-GCM-256",
    kdf: "PBKDF2-SHA256",
    iterations: ITERATIONS,
    salt: toHex(salt),
    iv: toHex(iv),
    ciphertext: toHex(new Uint8Array(ciphertext)),
  };
}

export async function decryptTerms(
  envelope: TermsEnvelope,
  passphrase: string,
): Promise<TermsDocument> {
  if (
    envelope.v !== 1 ||
    envelope.alg !== "AES-GCM-256" ||
    envelope.kdf !== "PBKDF2-SHA256" ||
    envelope.iterations !== ITERATIONS
  ) {
    throw new Error("Unsupported encrypted terms envelope");
  }
  const key = await deriveKey(passphrase, fromHex(envelope.salt));
  const plain = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromHex(envelope.iv) as BufferSource },
    key,
    fromHex(envelope.ciphertext) as BufferSource,
  );
  const value: unknown = JSON.parse(new TextDecoder().decode(plain));
  if (typeof value !== "object" || value === null || !("schema" in value)) {
    throw new Error("Decrypted document is not a terms document");
  }
  return value as TermsDocument;
}

export function envelopeToText(envelope: TermsEnvelope): string {
  return `ECSTASY-TERMS-1:${btoa(JSON.stringify(envelope))}`;
}

export function parseEnvelopeText(text: string): TermsEnvelope {
  const prefix = "ECSTASY-TERMS-1:";
  if (!text.trim().startsWith(prefix)) throw new Error("Not an ECSTASY encrypted terms envelope");
  const parsed: unknown = JSON.parse(atob(text.trim().slice(prefix.length)));
  if (typeof parsed !== "object" || parsed === null) throw new Error("Invalid envelope");
  return parsed as TermsEnvelope;
}
