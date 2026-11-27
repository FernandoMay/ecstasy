import { describe, expect, it } from "vitest";
import { LIFECYCLE_STEPS, settlementTxUrl, toLifecycleRef } from "../src/lifecycle";

const HASH = "c011a3d30b320181bd67eca3ede85e63ecdc4d4598f5bb48db2416a1024cd460";

describe("common lifecycle reference chain", () => {
  it("defines the five canonical steps in order", () => {
    expect(LIFECYCLE_STEPS.map((step) => step.key)).toEqual([
      "agreementId",
      "escrowId",
      "caseId",
      "arbitrationId",
      "settlementTx",
    ]);
  });

  it("normalizes a chain record and builds the settlement link", () => {
    const ref = toLifecycleRef({
      agreement_id: 7n,
      escrow_id: 1n,
      case_id: 1n,
      arbitration_id: 1n,
      settlement_tx: Uint8Array.from(HASH.match(/.{2}/g)!, (pair) => parseInt(pair, 16)),
    });
    expect(ref.agreementId).toBe(7n);
    expect(ref.settlementTx).toBe(HASH);
    expect(settlementTxUrl(ref)).toBe(`https://stellar.expert/explorer/testnet/tx/${HASH}`);
  });

  it("rejects malformed settlement hashes", () => {
    expect(() =>
      toLifecycleRef({
        agreement_id: 1n,
        escrow_id: 1n,
        case_id: 1n,
        arbitration_id: 1n,
        settlement_tx: "deadbeef",
      }),
    ).toThrow(/32-byte/);
  });
});
