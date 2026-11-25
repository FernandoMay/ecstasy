"use client";

import type { Receipt } from "@ecstasy/stellar";

export function SettlementReceipt({ receipt }: { receipt: Receipt }) {
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
    </div>
  );
}
