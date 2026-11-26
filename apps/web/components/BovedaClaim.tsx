"use client";

import {
  BovedaClient,
  BovedaError,
  shortAddress,
  type Receipt,
} from "@ecstasy/stellar";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "./WalletProvider";
import { VAULT_CLAIMS_KEY, addClaim } from "@/lib/vault-history";

/** Bóveda: lock 5555 XLM on Testnet and release them to the right code. */
export function BovedaClaim() {
  const { config, address, wallet, connect, clearError } = useWallet();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<{ claimed: boolean; balance: bigint } | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const readStatus = useCallback(async () => {
    try {
      const client = new BovedaClient({
        contractId: config.bovedaContractId,
        rpcUrl: config.rpcUrl,
        networkPassphrase: config.networkPassphrase,
        allowHttp: config.rpcUrl.startsWith("http://"),
      });
      const result = (await client.status()).result;
      setStatus({ claimed: result[0], balance: result[1] });
    } catch {
      setStatus(null);
    }
  }, [config]);

  useEffect(() => {
    readStatus();
  }, [readStatus]);

  async function claim() {
    if (busy || status?.claimed) return;
    setBusy(true);
    setError(null);
    clearError();
    try {
      if (!code.trim()) throw new Error("Escribe el código de la bóveda.");
      // Connect and claim in one click. `connect` returns the freshly approved
      // address so signing never uses the stale `address` from this render.
      const actor = address ?? (await connect());
      if (!actor) return;
      const bytes = await globalThis.crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(code),
      );
      const client = new BovedaClient({
        contractId: config.bovedaContractId,
        rpcUrl: config.rpcUrl,
        networkPassphrase: config.networkPassphrase,
        publicKey: actor,
        signTransaction: wallet.signTransaction,
        signAuthEntry: wallet.signAuthEntry,
        errorTypes: BovedaError,
        allowHttp: config.rpcUrl.startsWith("http://"),
      });
      const tx = await client.reclamar({
        caller: actor,
        code_hash: Buffer.from(bytes),
      });
      const sent = await tx.signAndSend();
      const result = sent.result;
      if (result.isErr()) throw new Error(result.unwrapErr().message);
      const response = sent.getTransactionResponse;
      const hash = response && "hash" in response ? String(response.hash) : "";
      const claimStatus = response && "status" in response ? String(response.status) : "PENDING";
      if (hash && typeof window !== "undefined") {
        window.localStorage.setItem(
          VAULT_CLAIMS_KEY,
          addClaim(window.localStorage.getItem(VAULT_CLAIMS_KEY), {
            hash,
            at: Date.now(),
            amountStroops: "55550000000",
          }),
        );
      }
      setReceipt({
        hash,
        status: claimStatus,
        explorerUrl: hash
          ? `https://stellar.expert/explorer/testnet/tx/${hash}`
          : "",
      });
      await readStatus();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>Bóveda · Testnet</h2>
      <p className="muted small">
        5555 XLM bloqueados en un contrato Soroban. La bóveda libera el saldo completo a quien
        presente el código correcto. Solo se puede reclamar una vez.
      </p>
      <dl className="kv" aria-live="polite" aria-busy={status === null}>
        <dt>Contrato</dt>
        <dd>{shortAddress(config.bovedaContractId)}</dd>
        <dt>Estado</dt>
        <dd className={status?.claimed ? "status-settled" : undefined}>
          {status ? (status.claimed ? "Reclamada" : "Fondada") : "leyendo…"}
        </dd>
        <dt>Saldo</dt>
        <dd>{status ? `${(Number(status.balance) / 10_000_000).toLocaleString()} XLM` : "—"}</dd>
      </dl>
      <div style={{ height: 18 }} />
      <div className="field">
        <label className="label" htmlFor="vault-code">Código</label>
        <input
          id="vault-code"
          className="input"
          value={code}
          disabled={status?.claimed || busy}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Escribe el código"
          aria-describedby="vault-code-help"
        />
      </div>
      <p id="vault-code-help" className="muted small">
        El código se comprime a SHA-256 en tu navegador; el contrato solo recibe el digest.
      </p>
      <button
        className="btn btn-primary"
        onClick={claim}
        disabled={busy || status?.claimed}
      >
        {busy ? "Reclamando…" : status?.claimed ? "Bóveda reclamada" : address ? "Reclamar XLM" : "Conectar y reclamar"}
      </button>
      {error && <div className="notice error" style={{ marginTop: 16 }}>{error}</div>}
      {receipt && (
        <div className="notice" style={{ marginTop: 16, borderLeftColor: "var(--success)" }}>
          <div className="small mono">{receipt.hash}</div>
          {receipt.explorerUrl && (
            <p className="small" style={{ marginBottom: 0, marginTop: 8 }}>
              <a href={receipt.explorerUrl} target="_blank" rel="noreferrer">
                Ver transacción en stellar.expert ↗
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
