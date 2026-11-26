"use client";

import { contractUrl, shortAddress } from "@ecstasy/stellar";
import { useEffect, useState } from "react";
import { useWallet } from "./WalletProvider";

interface Status {
  network: string;
  contractId: string;
  assetContractId: string;
  assetSymbol: string;
  rpc: string;
  latestLedger?: number;
  rpcUrl: string;
}

/** Public deployment status: configuration, RPC health and explorer link. */
export function StatusPanel() {
  const { config } = useWallet();
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/status", { cache: "no-store" });
        if (!response.ok) throw new Error(`Status HTTP ${response.status}`);
        const data = (await response.json()) as Status;
        if (!cancelled) setStatus(data);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="card">
      <h3>Testnet status</h3>
      <dl className="kv" aria-live="polite" aria-busy={status === null && !error}>
        <dt>Network</dt>
        <dd>{status?.network ?? config.network}</dd>
        <dt>RPC</dt>
        <dd className={status?.rpc === "healthy" ? "success-text" : undefined}>
          {status?.rpc ?? (error ? "unavailable" : "checking…")}
          {status?.latestLedger ? ` · ledger ${status.latestLedger}` : ""}
        </dd>
        <dt>Contract</dt>
        <dd>
          <a
            href={contractUrl(config, status?.contractId ?? config.contractId)}
            target="_blank"
            rel="noreferrer"
          >
            {shortAddress(status?.contractId ?? config.contractId)}
          </a>
        </dd>
        <dt>Escrow asset</dt>
        <dd>
          {status?.assetSymbol ?? config.assetSymbol} ·{" "}
          {shortAddress(status?.assetContractId ?? config.assetContractId)}
        </dd>
      </dl>
      <p className="muted small" style={{ marginTop: 12 }}>
        Testnet only. Testnet assets have no real-world monetary value. Wallet addresses and state
        transitions are public; a hash is a commitment, not encryption.
      </p>
    </div>
  );
}
