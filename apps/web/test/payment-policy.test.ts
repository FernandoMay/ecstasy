import { describe, expect, it } from "vitest";
import {
  CHALLENGE_CODE,
  DEFAULT_DESTINATION,
  MAX_BODY_BYTES,
  RateLimiter,
  bodyTooLarge,
  isPaymentRouteEnabled,
  isValidStellarAccount,
  resolveDestination,
} from "../lib/payment-policy";

describe("payment route policy (P0.3)", () => {
  it("accepts only valid classic Stellar account addresses", () => {
    expect(isValidStellarAccount(DEFAULT_DESTINATION)).toBe(true);
    expect(isValidStellarAccount("not-an-address")).toBe(false);
    expect(isValidStellarAccount("CB7IX7KXOT7EDVNRFKN5UAT5TNNBVIAGM2IFLZIHIZXPXW7WH7I35DJV")).toBe(false);
  });

  it("ignores caller input: destination comes from validated server config", () => {
    expect(resolveDestination()).toBe(DEFAULT_DESTINATION);
    expect(resolveDestination("  GBNV3K7K7524XYPMDM2YHP3ORQVDCZ6SFUCKKLPFPKEFCHVCN6RGI2FR  ")).toBe(
      "GBNV3K7K7524XYPMDM2YHP3ORQVDCZ6SFUCKKLPFPKEFCHVCN6RGI2FR",
    );
    expect(() => resolveDestination("GFAKE")).toThrow(/valid Stellar account/);
  });

  it("is Testnet-only", () => {
    expect(isPaymentRouteEnabled(undefined)).toBe(true);
    expect(isPaymentRouteEnabled("testnet")).toBe(true);
    expect(isPaymentRouteEnabled("mainnet")).toBe(false);
    expect(isPaymentRouteEnabled("futurenet")).toBe(false);
  });

  it("caps request size and malformed content-length", () => {
    expect(bodyTooLarge(null)).toBe(false);
    expect(bodyTooLarge(String(MAX_BODY_BYTES))).toBe(false);
    expect(bodyTooLarge(String(MAX_BODY_BYTES + 1))).toBe(true);
    expect(bodyTooLarge("garbage")).toBe(true);
    expect(CHALLENGE_CODE).toBe("SHIP-S97KF8");
  });

  it("rate limits repeated calls per client", () => {
    const limiter = new RateLimiter(2, 10_000);
    expect(limiter.check("ip-1", 0)).toBe(true);
    expect(limiter.check("ip-1", 1)).toBe(true);
    expect(limiter.check("ip-1", 2)).toBe(false);
    expect(limiter.check("ip-2", 2)).toBe(true);
    expect(limiter.check("ip-1", 11_000)).toBe(true);
    limiter.reset();
    expect(limiter.check("ip-1", 11_001)).toBe(true);
  });
});

class FakeBlobStore {
  private data = new Map<string, { value: unknown; etag: string }>();
  private version = 0;

  async getWithMetadata(key: string) {
    const entry = this.data.get(key);
    return entry ? { data: entry.value, etag: entry.etag } : null;
  }

  async setJSON(key: string, value: unknown, options: { onlyIfMatch?: string; onlyIfNew?: boolean }) {
    const current = this.data.get(key);
    if (options.onlyIfNew && current) return { modified: false };
    if (options.onlyIfMatch && current?.etag !== options.onlyIfMatch) return { modified: false };
    const etag = `etag-${++this.version}`;
    this.data.set(key, { value, etag });
    return { modified: true };
  }
}

describe("distributed rate limiter (Sprint B)", () => {
  it("holds the cap across independent instances sharing a store", async () => {
    const store = new FakeBlobStore();
    const instanceA = new (await import("../lib/payment-policy")).SharedRateLimiter(store, 2, 10_000);
    const instanceB = new (await import("../lib/payment-policy")).SharedRateLimiter(store, 2, 10_000);

    const results = await Promise.all([
      instanceA.check("client-x", 0),
      instanceB.check("client-x", 0),
      instanceA.check("client-x", 0),
      instanceB.check("client-x", 0),
    ]);
    expect(results.filter(Boolean)).toHaveLength(2);
  });

  it("keeps separate keys independent", async () => {
    const store = new FakeBlobStore();
    const { SharedRateLimiter } = await import("../lib/payment-policy");
    const limiter = new SharedRateLimiter(store, 2, 10_000);
    expect(await limiter.check("client-a", 0)).toBe(true);
    expect(await limiter.check("client-b", 0)).toBe(true);
  });

  it("expires old hits and resets", async () => {
    const store = new FakeBlobStore();
    const { SharedRateLimiter } = await import("../lib/payment-policy");
    const limiter = new SharedRateLimiter(store, 1, 10_000);
    expect(await limiter.check("client-c", 0)).toBe(true);
    expect(await limiter.check("client-c", 1)).toBe(false);
    expect(await limiter.check("client-c", 11_000)).toBe(true);
  });
});

describe("rate limit telemetry", () => {
  it("detects the backend from the Netlify environment", async () => {
    const { detectRateLimitMode, rateLimitHeaders } = await import("../lib/payment-policy");
    expect(detectRateLimitMode({})).toBe("local");
    expect(detectRateLimitMode({ NETLIFY_BLOBS_CONTEXT: "xxx" })).toBe("shared");
    expect(rateLimitHeaders("local")["x-ecstasy-blobs-context"]).toBe("absent");
    expect(rateLimitHeaders("shared")["x-ecstasy-rate-limit-mode"]).toBe("shared");
  });
});

describe("rate-limit window rollover", () => {
  it("allows a new allowance after the sliding window passes", async () => {
    const store = new FakeBlobStore();
    const { SharedRateLimiter } = await import("../lib/payment-policy");
    const limiter = new SharedRateLimiter(store, 2, 1_000);

    expect(await limiter.check("rollover", 0)).toBe(true);
    expect(await limiter.check("rollover", 100)).toBe(true);
    expect(await limiter.check("rollover", 200)).toBe(false);

    // The oldest hit leaves the window at t=1000.
    expect(await limiter.check("rollover", 1_001)).toBe(true);
    expect(await limiter.check("rollover", 1_002)).toBe(false);
  });

  it("fails closed when the store rejects every conditional write", async () => {
    const conflicting = {
      getWithMetadata: async () => ({ data: [0], etag: "stale" }),
      setJSON: async () => ({ modified: false }),
    };
    const { SharedRateLimiter } = await import("../lib/payment-policy");
    const limiter = new SharedRateLimiter(conflicting as never, 3, 1_000);
    expect(await limiter.check("contended", 10)).toBe(false);
  });
});
