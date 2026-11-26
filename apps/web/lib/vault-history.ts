/** Local record of claims made from this browser. No secrets or code stored. */

export interface VaultClaim {
  hash: string;
  at: number;
  amountStroops: string;
}

export const VAULT_CLAIMS_KEY = "ecstasy:vault-claims";

export function parseClaims(raw: string | null): VaultClaim[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is VaultClaim =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as VaultClaim).hash === "string" &&
        /^[0-9a-f]{64}$/.test((item as VaultClaim).hash) &&
        typeof (item as VaultClaim).at === "number" &&
        typeof (item as VaultClaim).amountStroops === "string",
    );
  } catch {
    return [];
  }
}

export function addClaim(raw: string | null, claim: VaultClaim, max = 20): string {
  return JSON.stringify([claim, ...parseClaims(raw)].slice(0, max));
}
