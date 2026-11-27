/**
 * Common cross-contract reference chain for ECSTASY.
 *
 * agreement_id → escrow_id → case_id → arbitration_id → settlement_tx
 *
 * Every surface reads the same on-chain `ChainRecord` from the traceability
 * contract instead of reconstructing relationships from separate screens.
 */

export interface LifecycleRef {
  agreementId: bigint;
  escrowId: bigint;
  caseId: bigint;
  arbitrationId: bigint;
  /** 64-char lowercase hex of the real settlement transaction hash. */
  settlementTx: string;
}

export const LIFECYCLE_STEPS = [
  { key: "agreementId", label: "Acuerdo", contract: "ecstasy" },
  { key: "escrowId", label: "Escrow", contract: "milestones" },
  { key: "caseId", label: "Caso", contract: "panel" },
  { key: "arbitrationId", label: "Arbitraje", contract: "arbitration" },
  { key: "settlementTx", label: "Liquidación", contract: "stellar" },
] as const;

/** Normalize a generated `ChainRecord` (BigInts + BytesN wrapper) into a display ref. */
export function toLifecycleRef(record: {
  agreement_id: bigint;
  escrow_id: bigint;
  case_id: bigint;
  arbitration_id: bigint;
  settlement_tx: Uint8Array | string;
}): LifecycleRef {
  const settlementTx =
    typeof record.settlement_tx === "string"
      ? record.settlement_tx
      : Array.from(record.settlement_tx, (b) => b.toString(16).padStart(2, "0")).join("");
  if (!/^[0-9a-f]{64}$/.test(settlementTx)) {
    throw new Error("settlement_tx must be a 32-byte transaction hash");
  }
  return {
    agreementId: record.agreement_id,
    escrowId: record.escrow_id,
    caseId: record.case_id,
    arbitrationId: record.arbitration_id,
    settlementTx,
  };
}

export function settlementTxUrl(ref: LifecycleRef): string {
  return `https://stellar.expert/explorer/testnet/tx/${ref.settlementTx}`;
}
