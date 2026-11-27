"use client";

import { RefundsClient, RefundError, shortAddress } from "@ecstasy/stellar";
import { useEffect, useState } from "react";
import { useWallet } from "@/components/WalletProvider";

const TXS = [
  ["Proponer", "bb1381e3faea18dde11620832b1d68f60b750485bd7eaadcfbde6e826ff2de19"],
  ["Aprobar", "f994e2eb2b8f8d9bbbf8ecdbe133587cd125bbc56d9b4426b0b0e945c47cbd01"],
  ["Ejecutar", "31b708a2a94b1b712a0cb1b0f7d7050afbb7e7677f401a07941bb9eba2c462e2"],
  ["Rechazar", "50263a74841ef999e2a93e92d28bdf3f1247828a7a892d41dc6e2485da970523"],
  ["Revocar", "50e0a196ebf94c29dbfffd2a3c71d153a7102f44ba49f72673f71ac01e6cea97"],
] as const;

type RefundView = {
  status: string;
  amount: string;
  recipient: string;
  intentHash: string;
};

export default function RefundsPage() {
  const { config, address, wallet, connect } = useWallet();
  const [view, setView] = useState<RefundView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const client = () =>
    new RefundsClient({
      contractId: config.refundsContractId,
      rpcUrl: config.rpcUrl,
      networkPassphrase: config.networkPassphrase,
      publicKey: address ?? undefined,
      signTransaction: wallet.signTransaction,
      signAuthEntry: wallet.signAuthEntry,
      errorTypes: RefundError,
      allowHttp: config.rpcUrl.startsWith("http://"),
    });

  const load = async () => {
    try {
      const result = (await new RefundsClient({
        contractId: config.refundsContractId,
        rpcUrl: config.rpcUrl,
        networkPassphrase: config.networkPassphrase,
        errorTypes: RefundError,
        allowHttp: config.rpcUrl.startsWith("http://"),
      }).get({ refund_id: 1n })).result;
      if (result.isErr()) return;
      const value = result.unwrap();
      setView({
        status: typeof value.status === "string" ? value.status : value.status.tag,
        amount: (Number(value.amount) / 10_000_000).toLocaleString(),
        recipient: value.recipient,
        intentHash: Buffer.from(value.intent_hash).toString("hex"),
      });
    } catch {
      // keep empty state
    }
  };

  useEffect(() => {
    load();
  }, [config]);

  async function act(action: "approve" | "execute") {
    if (!address) {
      await connect();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const intentHash = Buffer.from(view?.intentHash ?? "", "hex");
      const tx = await (action === "approve"
        ? client().approve({ caller: address, refund_id: 1n, intent_hash: intentHash })
        : client().execute({ caller: address, refund_id: 1n }));
      const sent = await tx.signAndSend();
      const result = sent.result;
      if (result.isErr()) throw new Error(result.unwrapErr().message);
      await load();
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
          Reembolso mutuo<span>Fondos reales, doble autorización</span>
        </h1>
        <p>
          XLM de Testnet custodiados por un contrato independiente. Solo se liberan cuando ambas
          partes autorizan la misma intención; rechazo y revocación devuelven los fondos.
        </p>
      </section>
      <div className="grid" style={{ alignItems: "start" }}>
        <div className="card">
          <h2>Refund #1</h2>
          {view ? (
            <dl className="kv">
              <dt>Estado</dt><dd>{view.status}</dd>
              <dt>Monto</dt><dd>{view.amount} XLM</dd>
              <dt>Destino</dt><dd className="mono small">{shortAddress(view.recipient)}</dd>
              <dt>Intención</dt><dd className="mono small">{shortAddress(view.intentHash)}</dd>
            </dl>
          ) : (
            <p className="muted small">Leyendo estado del contrato…</p>
          )}
          {error && <div className="notice error" style={{ marginTop: 14 }}>{error}</div>}
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn btn-small" disabled={busy} onClick={() => act("approve")}>
              Aprobar
            </button>
            <button className="btn btn-primary btn-small" disabled={busy} onClick={() => act("execute")}>
              Ejecutar refund
            </button>
          </div>
        </div>
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
        </div>
      </div>
    </>
  );
}
