import { describe, expect, it } from "vitest";
import { panelCommitment } from "../lib/panel-commitment";

describe("panel commit-reveal digest", () => {
  it("matches the on-chain vector for case 1 / Release", async () => {
    const digest = await panelCommitment({
      caseId: 1n,
      arbitrator: "GBR5G5CEYM5NXYYYEMT7BFWIFWKC4H25FONQ4K4KYZSZS7TCKU4U6ERV",
      decision: 1,
      secretHex: "0a".repeat(32),
    });
    expect(digest).toBe("c6c81cbc6d4231eff9f31282e6b3535830e01868a207081405e0884961296aab");
  });

  it("rejects malformed secrets and decisions", async () => {
    await expect(
      panelCommitment({ caseId: 1n, arbitrator: "GX", decision: 1, secretHex: "00" }),
    ).rejects.toThrow(/32 bytes/);
    await expect(
      panelCommitment({ caseId: 1n, arbitrator: "GX", decision: 9, secretHex: "00".repeat(32) }),
    ).rejects.toThrow(/Invalid decision/);
  });
});
