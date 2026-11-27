"use client";

import { PanelClient, PanelError, shortAddress } from "@ecstasy/stellar";
import { useEffect, useState } from "react";
import { panelCommitment } from "@/lib/panel-commitment";
import { useWallet } from "@/components/WalletProvider";

const TXS = [
  ["Crear caso", "98263acb250b3e82bd2d38f0a13adf6bdf83f525b3d0f22ee7059275e825a602"],
  ["Commit", "171f1028138ea691fba69ac80252b281b1551b6595672e05cd621d38a296bef2"],
  ["Quórum 2/3", "c011a3d30b320181bd67eca3ede85e63ecdc4d4598f5bb48db2416a1024cd460"],
] as const;

export default function PanelArbitrationPage() {
  const { config, address, wallet, connect } = useWallet();
  const [view, setView] = useState<{
    status: string;
    outcome: string;
    arbitrators: string[];
  } | null>(null);
  const [secret, setSecret] = useState("0a".repeat(32));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const client = new PanelClient({
        contractId: config.panelContractId,
        rpcUrl: config.rpcUrl,
        networkPassphrase: config.networkPassphrase,
        errorTypes: PanelError,
        allowHttp: config.rpcUrl.startsWith("http://"),
      });
      const result = (await client.get({ case_id: 1n })).result;
      if (result.isErr()) return;
      const value = result.unwrap();
      setView({
        status: typeof value.status === "string" ? value.status : value.status.tag,
        outcome: value.outcome_code === null ? "—" : ["—", "Release", "Refund", "Split"][Number(value.outcome_code)] ?? "—",
        arbitrators: value.arbitrators.map((item) => item as string),
      });
    } catch {
      // keep empty state
    }
  };

  useEffect(() => {
    load();
  }, [config]);

  async function vote(kind: "commit" | "reveal") {
    if (!address) {
      await connect();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const client = new PanelClient({
        contractId: config.panelContractId,
        rpcUrl: config.rpcUrl,
        networkPassphrase: config.networkPassphrase,
        publicKey: address,
        signTransaction: wallet.signTransaction,
        signAuthEntry: wallet.signAuthEntry,
        errorTypes: PanelError,
        allowHttp: config.rpcUrl.startsWith("http://"),
      });
      const commitment = await panelCommitment({
        caseId: 1n,
        arbitrator: address,
        decision: 1,
        secretHex: secret,
      });
      const tx =
        kind === "commit"
          ? await client.commit({ caller: address, case_id: 1n, commitment: Buffer.from(commitment, "hex") })
          : await client.reveal({
              caller: address,
              case_id: 1n,
              decision: 1,
              secret: Buffer.from(secret, "hex"),
            });
      const result = (await tx.signAndSend()).result;
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
          Panel de arbitraje<span>Commit-reveal, quórum 2 de 3</span>
        </h1>
        <p>
          Tres árbitros designados por las partes comprometen su voto y lo revelan después. Dos
          votos coincidentes ejecutan la liquidación. No se afirma descentralización ni honestidad
          del panel.
        </p>
      </section>
      <div className="grid" style={{ alignItems: "start" }}>
        <div className="card">
          <h2>Caso #1</h2>
          {view ? (
            <>
              <dl className="kv">
                <dt>Estado</dt><dd>{view.status}</dd>
                <dt>Resultado</dt><dd>{view.outcome}</dd>
              </dl>
              <h3 style={{ marginTop: 16 }}>Árbitros</h3>
              <ul className="muted small">
                {view.arbitrators.map((arb) => (
                  <li key={arb} className="mono">{shortAddress(arb)}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="muted small">Leyendo estado del contrato…</p>
          )}
          <div className="field" style={{ marginTop: 16 }}>
            <label className="label" htmlFor="panel-secret">Secreto (hex, 32 bytes)</label>
            <input id="panel-secret" className="input mono" value={secret} onChange={(event) => setSecret(event.target.value)} />
          </div>
          <div className="row">
            <button className="btn btn-small" disabled={busy} onClick={() => vote("commit")}>Comprometer voto</button>
            <button className="btn btn-primary btn-small" disabled={busy} onClick={() => vote("reveal")}>Revelar voto</button>
          </div>
          {error && <div className="notice error" style={{ marginTop: 12 }}>{error}</div>}
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
