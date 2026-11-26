/** Strict Stellar address validation for values supplied to the service. */

import { Keypair, StrKey } from "@stellar/stellar-sdk";

/** Classic account addresses (G…) only; contracts and malformed strkeys fail. */
export function isStellarAccount(value: string): boolean {
  if (!StrKey.isValidEd25519PublicKey(value)) return false;
  try {
    Keypair.fromPublicKey(value);
    return true;
  } catch {
    return false;
  }
}

export function assertStellarAccount(value: string, label: string): void {
  if (!isStellarAccount(value)) {
    throw new Error(`${label} must be a valid Stellar account address (G…)`);
  }
}
