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
  private data = new Map<string, unknown>();

  async get(key: string) {
    return this.data.get(key) ?? null;
  }

  async setJSON(key: string, value: unknown) {
    this.data.set(key, value);
    return {};
  }
}

describe("distributed rate limiter (Sprint B)", () => {
  it("holds the cap across sequential calls from independent instances", async () => {
    const store = new FakeBlobStore();
    const { SharedRateLimiter } = await import("../lib/payment-policy");
    const instanceA = new SharedRateLimiter(store, 2, 10_000);
    const instanceB = new SharedRateLimiter(store, 2, 10_000);

    expect(await instanceA.check("client-x", 0)).toBe(true);
    expect(await instanceB.check("client-x", 10)).toBe(true);
    expect(await instanceA.check("client-x", 20)).toBe(false);
    expect(await instanceB.check("client-x", 30)).toBe(false);
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

});
