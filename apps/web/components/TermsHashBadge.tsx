"use client";

import { shortHash, toHex } from "@ecstasy/stellar";

export function TermsHashBadge({ hash }: { hash: Uint8Array | Buffer }) {
  const hex = toHex(new Uint8Array(hash));
  return (
    <span className="badge" title={`SHA-256 commitment: ${hex}`}>
      terms <strong>{shortHash(hex)}</strong>
    </span>
  );
}
