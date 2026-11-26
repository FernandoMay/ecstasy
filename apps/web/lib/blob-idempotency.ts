/**
 * Shared idempotency claim using only the Netlify Blobs operations verified
 * by /api/status: `get` (strong) and plain `setJSON`. Conditional writes and
 * getWithMetadata hang in the Next.js function runtime and are not used here.
 */

interface ClaimRecord {
  status: "pending" | "settled" | "failed";
  owner?: string;
  hash?: string;
  at: number;
  correlation?: string;
}

export interface ClaimResult {
  claimed: boolean;
  record?: ClaimRecord;
}

function isRecord(value: unknown): value is ClaimRecord {
  return typeof value === "object" && value !== null && "status" in value;
}

async function store() {
  const { getStore } = await import("@netlify/blobs");
  return getStore("ecstasy-payment-idempotency");
}

export function sharedIdempotencyEnabled(source: Record<string, string | undefined> = process.env): boolean {
  return source.USE_SHARED_IDEMPOTENCY === "1";
}

/** Claim a key for this request. Only one owner survives the re-read. */
export async function claimShared(key: string, correlation: string): Promise<ClaimResult> {
  const bucket = await store();
  const existing = await bucket.get(key, { type: "json", consistency: "strong" });
  if (isRecord(existing)) return { claimed: false, record: existing };

  const owner = correlation;
  await bucket.setJSON(key, { status: "pending", owner, at: Date.now(), correlation } satisfies ClaimRecord);
  const confirmed = await bucket.get(key, { type: "json", consistency: "strong" });
  if (isRecord(confirmed) && confirmed.owner !== owner) {
    return { claimed: false, record: confirmed };
  }
  return { claimed: true };
}

export async function finishShared(key: string, hash: string): Promise<void> {
  const bucket = await store();
  await bucket.setJSON(key, {
    status: "settled",
    hash,
    at: Date.now(),
  } satisfies ClaimRecord);
}

export async function failShared(key: string, kind: string): Promise<void> {
  const bucket = await store();
  await bucket.setJSON(key, {
    status: "failed",
    at: Date.now(),
    correlation: kind,
  } satisfies ClaimRecord);
}
