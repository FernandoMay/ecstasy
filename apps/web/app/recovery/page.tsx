"use client";

import { RecoveryClient, RecoveryError, shortAddress } from "@ecstasy/stellar";
import { useEffect, useState } from "react";
import { useWallet } from "@/components/WalletProvider";

type View = {
  id: string;
  status: string;
  amount: string;
  expiresAt: number;
  recipient: string;
};

const TXS = [
  ["Proponer", "0b6437ec56f6876954f2572a549e9c277fcf5ede8316bfa7980d4becddcff4f7"],
  ["Aprobar", "6eb51c0a8cc1f8f22dfa020cd58eb372c487df99c3fe84f4185b0cc68a2c89d4"],
  ["Ejecutar", "9894dc3cb47c3d2e9b7edc1861f4581710a173994f7615e51e99868bc1fbb09b"],
  ["Recuperar", "ebc2f2403341c36701940ea2ab4fc3f6679e47feace69cf40f744c73ddb81579"],
] as const;

export default function RecoveryPage() {
  const { config, address, wallet, connect } = useWallet();
  const [views, setViews] = useState<View[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  const read = async () => {
    const results = await Promise.all(
      [1n, 2n].map(async (id) => {
        try {
          const client = new RecoveryClient({
            contractId: config.recoveryContractId,
            rpcUrl: config.rpcUrl,
            networkPassphrase: config.networkPassphrase,
            errorTypes: RecoveryError,
            allowHttp: config.rpcUrl.startsWith("http://"),
          });
          const result = (await client.get({ proposal_id: id })).result;
          if (result.isErr()) return null;
          const value = result.unwrap();
          return {
            id: value.id.toString(),
            status: typeof value.status === "string" ? value.status : value.status.tag,
            amount: (Number(value.amount) / 10_000_000).toLocaleString(),
            expiresAt: Number(value.expires_at) * 1000,
            recipient: value.recipient,
          } as View;
        } catch {
          return null;
        }
      }),
    );
    setViews(results.filter((item): item is View => item !== null));
  };

  useEffect(() => {
    read();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [config]);

  async function recover(id: string) {
    if (!address) {
      await connect();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const client = new RecoveryClient({
        contractId: config.recoveryContractId,
        rpcUrl: config.rpcUrl,
        networkPassphrase: config.networkPassphrase,
        publicKey: address,
        signTransaction: wallet.signTransaction,
        signAuthEntry: wallet.signAuthEntry,
        errorTypes: RecoveryError,
        allowHttp: config.rpcUrl.startsWith("http://"),
      });
      const tx = await client.recover({ caller: address, proposal_id: BigInt(id) });
      const result = (await tx.signAndSend()).result;
      if (result.isErr()) throw new Error(result.unwrapErr().message);
      await read();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Timeout recovery<span>Si la contraparte desaparece, los fondos vuelven</span>
        </h1>
        <p>
          Depósitos XLM con fecha límite on-chain. Antes del vencimiento aplica la aprobación
          bilateral; después, cualquier cuenta puede ejecutar la recuperación al proponente.
        </p>
      </section>
      <div className="grid" style={{ alignItems: "start" }}>
        {views.map((view) => {
          const seconds = Math.max(0, Math.floor((view.expiresAt - now) / 1000));
          const canRecover = view.expiresAt <= now && ["Pending", "Approved"].includes(view.status);
          return (
            <div className="card" key={view.id}>
              <h2>Propuesta #{view.id}</h2>
              <dl className="kv">
                <dt>Estado</dt><dd>{view.status}</dd>
                <dt>Monto</dt><dd>{view.amount} XLM</dd>
                <dt>Destino</dt><dd className="mono small">{shortAddress(view.recipient)}</dd>
                <dt>Vence en</dt><dd>{seconds > 0 ? `${seconds}s` : "vencida"}</dd>
              </dl>
              {canRecover && (
                <button className="btn btn-primary btn-small" style={{ marginTop: 12 }} disabled={busy} onClick={() => recover(view.id)}>
                  Recuperar fondos
                </button>
              )}
            </div>
          );
        })}
        <div className="card">
          <h2>Transacciones reales</h2>
          <ul className="muted small">
            {TXS.map(([label, hash]) => (
              <li key={hash} style={{ marginBottom: 8 }}>
                {label}:{" "}
                <a href={`https://stellar.expert/explorer/testnet/tx/${hash}`} target="_blank" rel="noreferrer">
                  {shortAddress(hash)} ↗
                </a>
              </li>
            ))}
          </ul>
          {error && <div className="notice error">{error}</div>}
        </div>
      </div>
    </>
  );
}
