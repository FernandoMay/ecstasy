"use client";

import { shortAddress } from "@ecstasy/stellar";
import { useWallet } from "./WalletProvider";

export function WalletStatus() {
  const { address, connecting, connect, disconnect, refresh, config, error } = useWallet();

  return (
    <div className="row">
      <span className="badge">
        <span className={config.network === "testnet" ? "status-created" : "status-settled"}>
          ●
        </span>
        <strong>{config.network}</strong>
      </span>
      {address ? (
        <>
          <span className="badge" title={address}>
            <strong>{shortAddress(address)}</strong>
          </span>
          <button className="btn btn-small" onClick={refresh} title="Refresh account from wallet">
            Refresh
          </button>
          <button className="btn btn-small btn-danger" onClick={disconnect}>
            Disconnect
          </button>
        </>
      ) : (
        <button className="btn btn-small" onClick={connect} disabled={connecting}>
          {connecting ? "Connecting…" : "Connect wallet"}
        </button>
      )}
      {error && <span className="small" style={{ color: "var(--danger)" }} title={error}>⚠</span>}
    </div>
  );
}
