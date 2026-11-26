"use client";

import type { Receipt } from "@ecstasy/stellar";
import { formatVerification } from "@/lib/receipt";
import { copyToClipboard } from "@/lib/format";

export function SettlementReceipt({
  receipt,
  encounterId,
  action = "transaction",
  contractId,
}: {
  receipt: Receipt;
  encounterId?: string;
  action?: string;
  contractId?: string;
}) {
  return (
    <div className="card">
      <h3>Settlement receipt</h3>
      <dl className="kv">
        <dt>Status</dt>
        <dd className={receipt.status === "SUCCESS" ? "success-text" : undefined}>
          {receipt.status}
        </dd>
        <dt>Tx hash</dt>
        <dd className="mono">{receipt.hash || "pending"}</dd>
      </dl>
      {receipt.explorerUrl && (
        <p style={{ marginTop: 14 }}>
          <a href={receipt.explorerUrl} target="_blank" rel="noreferrer">
            View transaction in explorer ↗
          </a>
        </p>
      )}
      {receipt.hash && (
        <button
          className="btn btn-small"
          style={{ marginTop: 8 }}
          onClick={() =>
            copyToClipboard(formatVerification({ encounterId, action, hash: receipt.hash, contractId }))
          }
        >
          Copiar verificación
        </button>
      )}
    </div>
  );
}
