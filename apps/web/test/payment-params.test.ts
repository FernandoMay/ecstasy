import { describe, expect, it } from "vitest";
import { PAYMENT_PARAMS, samePaymentParams } from "../../../netlify/lib/payment-params.mjs";

describe("immutable payment parameters", () => {
  it("accepts the fixed params or an absent legacy field", () => {
    expect(samePaymentParams(PAYMENT_PARAMS)).toBe(true);
    expect(samePaymentParams(undefined)).toBe(true);
  });

  it("rejects a key replayed with a different destination, amount or memo", () => {
    expect(samePaymentParams({ ...PAYMENT_PARAMS, destination: "GFAKE" })).toBe(false);
    expect(samePaymentParams({ ...PAYMENT_PARAMS, amount: "1" })).toBe(false);
    expect(samePaymentParams({ ...PAYMENT_PARAMS, memo: "OTHER" })).toBe(false);
  });
});
