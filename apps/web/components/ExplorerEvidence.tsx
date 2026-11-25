"use client";

import { contractUrl, shortAddress, transactionUrl } from "@ecstasy/stellar";
import { useWallet } from "./WalletProvider";

export function ExplorerEvidence({
  contractId,
  txHash,
}: {
  contractId?: string;
  txHash?: string;
}) {
  const { config } = useWallet();
  const id = contractId ?? config.contractId;
  return (
    <div className="card">
      <h3>Explorer evidence</h3>
      <dl className="kv">
        <dt>Network</dt>
        <dd>{config.network}</dd>
        <dt>Contract</dt>
        <dd>
          {id ? (
            <a href={contractUrl(config, id)} target="_blank" rel="noreferrer">
              {shortAddress(id)}
            </a>
          ) : (
            "not configured"
          )}
        </dd>
        <dt>Transaction</dt>
        <dd>
          {txHash ? (
            <a href={transactionUrl(config, txHash)} target="_blank" rel="noreferrer">
              {shortAddress(txHash)}
            </a>
          ) : (
            "submit an action to produce a hash"
          )}
        </dd>
      </dl>
      <p className="muted small">
        Evidence is a public state transition, not proof that a private, off-chain event happened.
      </p>
    </div>
  );
}
