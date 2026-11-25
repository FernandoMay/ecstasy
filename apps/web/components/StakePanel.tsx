"use client";

import { shortAddress } from "@ecstasy/stellar";

export function StakePanel({
  stake,
  asset,
  symbol,
}: {
  stake: bigint;
  asset: string;
  symbol: string;
}) {
  const amount = Number(stake) / 10_000_000;
  return (
    <div className="card">
      <h3>Stake</h3>
      {stake === 0n ? (
        <p className="muted small">No escrow. This is a no-stake encounter.</p>
      ) : (
        <>
          <div style={{ fontSize: 26, fontWeight: 700 }}>
            {amount.toLocaleString(undefined, { maximumFractionDigits: 7 })} {symbol}
          </div>
          <p className="muted small">
            Locked at creation. Released to the participant on settlement; refunded to the creator
            on decline, cancel or expiry.
          </p>
          <p className="muted small mono" title={asset}>
            asset · {shortAddress(asset)}
          </p>
        </>
      )}
    </div>
  );
}
