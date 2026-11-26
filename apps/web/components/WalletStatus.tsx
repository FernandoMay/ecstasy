"use client";

import { shortAddress } from "@ecstasy/stellar";
import { useWallet } from "./WalletProvider";

export function WalletStatus() {
  const { address, connecting, connect, disconnect, refresh, config, error } = useWallet();

  return (
    <>
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
      </div>
      {error && (
        <div className="notice error small" role="alert" style={{ marginTop: 8 }}>
          {error}
          {error.includes("Freighter") && (
            <>
              {" "}
              <a href="https://www.freighter.app/" target="_blank" rel="noreferrer">
                Instalar Freighter ↗
              </a>
            </>
          )}
        </div>
      )}
    </>
  );
}
