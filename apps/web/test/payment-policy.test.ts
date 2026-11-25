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
