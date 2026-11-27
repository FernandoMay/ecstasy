import { describe, expect, it } from "vitest";
import { panelV2Commitment } from "../lib/panel-v2-commitment";

describe("Panel V2 domain-separated commitment", () => {
  it("matches the on-chain Testnet vector for case 1", async () => {
    const digest = await panelV2Commitment({
      caseId: 1n,
      contractId: "CDLK3J5UYFRT3TWOVWSR6BOIKICJ5B6SOSCHMWQB44JXHPXKZPSAGEE3",
      arbitrator: "GB3E57PYF6DQ6FVYXGPXUU2LTZYTPROPICDLZ5C5MEJZOSGWMBUPMPH3",
      decision: 1,
      secretHex: "65".repeat(32),
    });
    expect(digest).toBe("25b672f3eb19502fe223c40500b2089a2cf223880f220f8b66694f64ffed2340");
  });

  it("rejects invalid decisions and malformed secrets", async () => {
    await expect(
      panelV2Commitment({
        caseId: 1n,
        contractId: "C",
        arbitrator: "G",
        decision: 9,
        secretHex: "00".repeat(32),
      }),
    ).rejects.toThrow(/Invalid decision/);
    await expect(
      panelV2Commitment({
        caseId: 1n,
        contractId: "C",
        arbitrator: "G",
        decision: 1,
        secretHex: "00",
      }),
    ).rejects.toThrow(/32 bytes/);
  });
});
