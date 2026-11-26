"use client";

import { BovedaClient, BovedaError, shortAddress } from "@ecstasy/stellar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { VAULT_CLAIMS_KEY, parseClaims } from "@/lib/vault-history";
import { useWallet } from "@/components/WalletProvider";

export default function VaultPage() {
  const { config } = useWallet();
  const [status, setStatus] = useState<{ claimed: boolean; balance: bigint } | null>(null);
  const [claims, setClaims] = useState<ReturnType<typeof parseClaims>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setClaims(parseClaims(window.localStorage.getItem(VAULT_CLAIMS_KEY)));
    }
    (async () => {
      try {
        const client = new BovedaClient({
          contractId: config.bovedaContractId,
          rpcUrl: config.rpcUrl,
          networkPassphrase: config.networkPassphrase,
          errorTypes: BovedaError,
          allowHttp: config.rpcUrl.startsWith("http://"),
        });
        const result = (await client.status()).result;
        setStatus({ claimed: result[0], balance: result[1] });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    })();
  }, [config]);

  const state = !status ? "unknown" : status.claimed ? "claimed" : status.balance > 0n ? "available" : "empty";

  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Bóveda<span>{state === "available" ? "Fondada y disponible" : state}</span>
        </h1>
        <p>
          Estado de la bóveda leído directamente desde Soroban, con el historial de reclamaciones
          registrado en este navegador.
        </p>
      </section>
      <div className="grid" style={{ alignItems: "start" }}>
        <div className="card">
          <h2>Estado on-chain</h2>
          <dl className="kv">
            <dt>Contrato</dt>
            <dd className="mono">{shortAddress(config.bovedaContractId)}</dd>
            <dt>Estado</dt>
            <dd>{state}</dd>
            <dt>Saldo</dt>
            <dd>{status ? `${(Number(status.balance) / 10_000_000).toLocaleString()} XLM` : "—"}</dd>
          </dl>
          {error && <div className="notice error" style={{ marginTop: 14 }}>{error}</div>}
          <div style={{ height: 14 }} />
          <Link className="btn btn-primary" href="/boveda">Ir a reclamar →</Link>
        </div>
        <div className="card">
          <h2>Reclamaciones desde este navegador</h2>
          {claims.length === 0 ? (
            <p className="muted small">Aún no se registraron reclamaciones locales.</p>
          ) : (
            <ul className="muted small">
              {claims.map((claim) => (
                <li key={claim.hash} style={{ marginBottom: 8 }}>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${claim.hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {shortAddress(claim.hash)}
                  </a>{" "}
                  · {new Date(claim.at).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
