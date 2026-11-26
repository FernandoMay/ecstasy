import { Keypair, StrKey } from "@stellar/stellar-sdk";

/**
 * Operational policy for the Mission 02 payment route. Pure helpers live here
 * so they can be tested without running a server or contacting Friendbot.
 */

export const CHALLENGE_CODE = "SHIP-S97KF8";
export const PAYMENT_AMOUNT = "0.0001";

/** Fixed, server-controlled destination. Never taken from the request body. */
export const DEFAULT_DESTINATION = "GAUZSVWQY5KOFMWZA5YJEBOECWBGSZHPSADVI6G3ZB54JULLDL6IKISJ";

export const RATE_LIMIT = {
  maxRequests: 2,
  windowMs: 10 * 60 * 1000,
} as const;

export const MAX_BODY_BYTES = 1024;

/** Accept only classic Stellar account addresses (G…), not contracts. */
export function isValidStellarAccount(address: string): boolean {
  if (!StrKey.isValidEd25519PublicKey(address)) return false;
  try {
    Keypair.fromPublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/** Resolve and validate the configured destination before any external call. */
export function resolveDestination(configured?: string): string {
  const destination = (configured ?? DEFAULT_DESTINATION).trim();
  if (!isValidStellarAccount(destination)) {
    throw new Error("Configured payment destination is not a valid Stellar account address");
  }
  return destination;
}

/** The Mission 02 route exists only on Testnet. */
export function isPaymentRouteEnabled(network?: string): boolean {
  return (network ?? "testnet").trim().toLowerCase() === "testnet";
}

export function bodyTooLarge(contentLength: string | null): boolean {
  if (!contentLength) return false;
  const parsed = Number(contentLength);
  return !Number.isFinite(parsed) || parsed > MAX_BODY_BYTES;
}

/** In-memory sliding-window limiter. Serverless instances keep separate state;
 * this stops casual abuse but must be paired with edge/CDN throttling. */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly maxRequests: number = RATE_LIMIT.maxRequests,
    private readonly windowMs: number = RATE_LIMIT.windowMs,
  ) {}

  check(key: string, now: number = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter((at) => now - at < this.windowMs);
    if (recent.length >= this.maxRequests) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }

  reset(key?: string): void {
    if (key) this.hits.delete(key);
    else this.hits.clear();
  }
}

/** Minimal subset of Netlify Blobs used by the distributed limiter. */
export interface LimitStore {
  get(
    key: string,
    options: { type: "json"; consistency?: "strong" | "eventual" },
  ): Promise<unknown>;
  setJSON(key: string, data: unknown): Promise<unknown>;
}

/**
 * Distributed sliding-window limiter using Netlify Blobs. Strongly consistent
 * reads with last-write-wins updates: getWithMetadata + conditional writes
 * hang in the Next.js function runtime, while get + setJSON are verified by
 * the /api/status probe.
 */
export class SharedRateLimiter {
  constructor(
    private readonly store: LimitStore,
    private readonly maxRequests: number = RATE_LIMIT.maxRequests,
    private readonly windowMs: number = RATE_LIMIT.windowMs,
  ) {}

  async check(key: string, now: number = Date.now()): Promise<boolean> {
    const raw = await this.store.get(key, {
      type: "json",
      consistency: "strong",
    });
    const values = Array.isArray(raw) ? (raw as unknown[]) : [];
    const recent = values.filter(
      (at): at is number => typeof at === "number" && now - at < this.windowMs,
    );
    if (recent.length >= this.maxRequests) return false;

    recent.push(now);
    await this.store.setJSON(key, recent);
    return true;
  }
}

/**
 * On Netlify, use the shared store; elsewhere fall back to the in-process
 * limiter. The two implementations share the same `check(key)` shape.
 */
export async function createPaymentRateLimiter(): Promise<{
  check: (key: string) => Promise<boolean>;
  mode: "shared" | "local";
}> {
  const local = new RateLimiter();
  // Netlify populates NETLIFY_BLOBS_CONTEXT automatically in functions.
  if (Boolean(process.env.NETLIFY_BLOBS_CONTEXT)) {
    try {
      const { getStore } = await import("@netlify/blobs");
      const shared = new SharedRateLimiter(getStore("ecstasy-payment-limits"));
      let activeMode: "shared" | "local" = "shared";
      return {
        get mode() {
          return activeMode;
        },
        check: async (key: string) => {
          try {
            return await shared.check(key);
          } catch (cause) {
            activeMode = "local";
            console.warn(
              JSON.stringify({
                event: "shared_rate_limit_failed_falling_back",
                error: cause instanceof Error ? cause.message : String(cause),
              }),
            );
            return local.check(key);
          }
        },
      };
    } catch (cause) {
      console.warn(
        JSON.stringify({
          event: "shared_rate_limit_unavailable",
          error: cause instanceof Error ? cause.message : String(cause),
        }),
      );
    }
  }
  return { mode: "local", check: async (key: string) => local.check(key) };
}

/** Which limiter backend can be used in this runtime. */
export function detectRateLimitMode(
  source: Record<string, string | undefined> = process.env,
): "shared" | "local" {
  return Boolean(source.NETLIFY_BLOBS_CONTEXT) ? "shared" : "local";
}

/** Stable, secret-free telemetry headers on every payment response. */
export function rateLimitHeaders(mode: "shared" | "local"): Record<string, string> {
  return {
    "x-ecstasy-rate-limit-mode": mode,
    "x-ecstasy-blobs-context": mode === "shared" ? "present" : "absent",
  };
}
