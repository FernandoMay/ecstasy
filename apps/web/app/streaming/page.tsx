"use client";

import { StreamingClient, StreamError, shortAddress } from "@ecstasy/stellar";
import { useEffect, useState } from "react";
import { useWallet } from "@/components/WalletProvider";

const TXS = [
  ["Crear flujo 1", "6af36f4df534ea3fccb98dd5dbca89f862d5868dc913579b76f09f207cfc7e93"],
  ["Claim parcial 1", "618bfa9c6a5fc0d5984890aa6edce755bef00b346b205723a8bbf3ec203852b5"],
  ["Pausar", "7dabf9fbb5bbe219d747a6876f42d8c7f262591e77b351e9f37ac6727d5d8148"],
  ["Claim en pausa", "cbed6d41df81d7394199195a66f3439b6ca3d0718abe9596d14522725d4de54b"],
  ["Reanudar", "440d7633a3a486b551b6fdd7e90c7a7fe2cade307d18d38f518f2423dc8a11da"],
  ["Claim parcial 2", "029ff8940899f05d1b27e7e45231c6a0259f2a387799b5ad5274f95e5ffa472e"],
  ["Cancelar", "1cf7f41bf5293819edd311478a41b93fa408a3af2246c43b96b1f76ae7dcd74e"],
  ["Crear flujo 2", "3c6191bfa06d90341fb9d92bc4ed6279561a090ac0986f0e913673e8f823866d"],
  ["Claim total", "ca8b8965b7f6c873354178e67b3dc232e0915c3a484989c00be7876efa60c614"],
  ["Cerrar", "a9c58b7545ee6d4a64a0a83a600990a660ae2b700a1b68a7877a7ab569c71ab5"],
] as const;

type StreamView = {
  id: string;
  status: string;
  deposit: string;
  withdrawn: string;
  rate: string;
  duration: string;
  paused: string;
  claimable: string;
};

const stroops = (value: bigint) => value.toLocaleString();

export default function StreamingPage() {
  const { config } = useWallet();
  const [streams, setStreams] = useState<StreamView[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const client = new StreamingClient({
          contractId: config.streamingContractId,
          rpcUrl: config.rpcUrl,
          networkPassphrase: config.networkPassphrase,
          errorTypes: StreamError,
          allowHttp: config.rpcUrl.startsWith("http://"),
        });
        const results = await Promise.all(
          [1n, 2n].map(async (id) => {
            const streamResult = (await client.get_stream({ stream_id: id })).result;
            if (streamResult.isErr()) return null;
            const stream = streamResult.unwrap();
            const claimResult = (await client.claimable({ stream_id: id })).result;
            const status = typeof stream.status === "string" ? stream.status : stream.status.tag;
            return {
              id: stream.id.toString(),
              status,
              deposit: stroops(stream.deposit),
              withdrawn: stroops(stream.withdrawn),
              rate: stroops(stream.rate),
              duration: `${stream.duration}s`,
              paused: `${stream.paused_total}s`,
              claimable: claimResult.isErr() ? "—" : stroops(claimResult.unwrap()),
            };
          }),
        );
        setStreams(results.filter((item) => item !== null) as StreamView[]);
      } catch {
        // keep empty state
      }
    })();
  }, [config]);

  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Streaming payments<span>XLM devengado segundo a segundo</span>
        </h1>
        <p>
          Depósito en stroops, acumulación con el tiempo del ledger y retirada solo de lo devengado.
          Pausa, reanudación, cancelación y cierre con reconciliación exacta de cada stroop.
        </p>
      </section>
      <div className="grid" style={{ alignItems: "start" }}>
        <div className="card">
          <h2>Flujos reales</h2>
          {streams.length === 0 ? (
            <p className="muted small">Leyendo flujos del contrato…</p>
          ) : (
            streams.map((item) => (
              <div key={item.id} className="card" style={{ padding: 14, marginBottom: 12 }}>
                <strong>
                  Flujo #{item.id} · {item.status}
                </strong>
                <dl className="kv" style={{ marginTop: 8 }}>
                  <dt>Depósito</dt><dd className="mono">{item.deposit} stroops</dd>
                  <dt>Devengado/retirado</dt><dd className="mono">{item.withdrawn} stroops</dd>
                  <dt>Tasa</dt><dd className="mono">{item.rate}/s</dd>
                  <dt>Duración</dt><dd className="mono">{item.duration}</dd>
                  <dt>Pausa acumulada</dt><dd className="mono">{item.paused}</dd>
                  <dt>Reclamable ahora</dt><dd className="mono">{item.claimable} stroops</dd>
                </dl>
              </div>
            ))
          )}
        </div>
        <div className="card">
          <h2>Reconciliación de stroops</h2>
          <ul className="muted small">
            <li>Flujo 1: depósito 6,000,000 = claims 900,000 + liquidación al cancelar 200,000 + remanente al pagador 4,900,000.</li>
            <li>Flujo 2: depósito 3,000,000 = claim total 3,000,000 → Cierre terminal.</li>
            <li>El saldo del contrato al cancelar el flujo 1 fue 0. Las comisiones de red se pagan aparte y no alteran esta reconciliación.</li>
          </ul>
          <p className="muted small" style={{ marginTop: 12 }}>
            Un clic en &quot;claim&quot; dentro de la pausa no genera accrual nuevo; el reloj se congela en el timestamp del ledger.
          </p>
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
