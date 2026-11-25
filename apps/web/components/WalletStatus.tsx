"use client";

import { shortAddress } from "@ecstasy/stellar";
import { useWallet } from "./WalletProvider";

export function WalletStatus() {
  const { address, connecting, connect, config } = useWallet();

  return (
    <div className="row">
      <span className="badge">
        <span className={config.network === "testnet" ? "status-created" : "status-settled"}>
          ●
        </span>
        <strong>{config.network}</strong>
      </span>
      {address ? (
        <span className="badge" title={address}>
          <strong>{shortAddress(address)}</strong>
        </span>
      ) : (
        <button className="btn btn-small" onClick={connect} disabled={connecting}>
          {connecting ? "Connecting…" : "Connect wallet"}
        </button>
      )}
    </div>
  );
}
