import { describe, expect, it } from "vitest";
import { assertTransactionSource } from "../src/wallet";

const ACTOR = "GAUZSVWQY5KOFMWZA5YJEBOECWBGSZHPSADVI6G3ZB54JULLDL6IKISJ";

describe("transaction source verification", () => {
  it("accepts the intended actor and an unreported source", () => {
    expect(() => assertTransactionSource(ACTOR, ACTOR)).not.toThrow();
    expect(() => assertTransactionSource(ACTOR, undefined)).not.toThrow();
  });

  it("rejects a transaction signed by another account", () => {
    expect(() =>
      assertTransactionSource(ACTOR, "GBNV3K7K7524XYPMDM2YHP3ORQVDCZ6SFUCKKLPFPKEFCHVCN6RGI2FR"),
    ).toThrow(/does not match/);
  });
});
