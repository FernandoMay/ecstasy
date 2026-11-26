import { describe, expect, it } from "vitest";
import { assertStellarAccount, isStellarAccount } from "../src/validation";

const VALID = "GAUZSVWQY5KOFMWZA5YJEBOECWBGSZHPSADVI6G3ZB54JULLDL6IKISJ";

describe("Stellar address validation", () => {
  it("accepts valid classic accounts", () => {
    expect(isStellarAccount(VALID)).toBe(true);
    expect(() => assertStellarAccount(VALID, "participant")).not.toThrow();
  });

  it("rejects contracts, malformed strings and empty values", () => {
    for (const value of [
      "CARK3GAFTYJEGBSECO7MEDA2WVNTP7L4OJQ4PTQN7336OLJVR5ZAIZRY",
      "GFAKE",
      "",
      "  " + VALID,
      "0x1234",
    ]) {
      expect(isStellarAccount(value)).toBe(false);
      expect(() => assertStellarAccount(value, "participant")).toThrow(/valid Stellar account/);
    }
  });
});
