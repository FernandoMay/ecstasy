"use client";

import { DisputesClient, DisputeError, shortAddress } from "@ecstasy/stellar";
import { useEffect, useState } from "react";
import { useWallet } from "@/components/WalletProvider";

const HASHES = [
  ["Abrir", "53f923f858146249e0189f4325579aef9c552a15f4450738ef1345f27d259966"],
  ["Respuesta A", "e696eb85591644ab3142406aa6a95518a95a8d9dd257f3369318960ad9084aa8"],
  ["Respuesta B", "8f738afe3413735b16b5a9f12b7f67ae5d6b28b3ae20924064c32052793eb7fa"],
  ["Resolver", "33124458b1f233fdb688ecd99719a2dbcc1f6166c1bcd0b0d2ed0cf36ffeffea"],
] as const;

export default function DisputesPage() {
  const { config } = useWallet();
  const [dispute, setDispute] = useState<{
    id: string;
    encounterId: string;
    status: string;
    reasonHash: string;
    openerResponded: boolean;
    counterpartyResponded: boolean;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const client = new DisputesClient({
          contractId: config.disputesContractId,
          rpcUrl: config.rpcUrl,
          networkPassphrase: config.networkPassphrase,
          errorTypes: DisputeError,
          allowHttp: config.rpcUrl.startsWith("http://"),
        });
        const result = (await client.get({ dispute_id: 1n })).result;
        if (result.isErr()) return;
        const value = result.unwrap();
        setDispute({
          id: value.id.toString(),
          encounterId: value.encounter_id.toString(),
          status: typeof value.status === "string" ? value.status : value.status.tag,
          reasonHash: Buffer.from(value.reason_hash).toString("hex"),
          openerResponded: value.opener_responded,
          counterpartyResponded: value.counterparty_responded,
        });
      } catch {
        // Keep empty state; no fabricated data.
      }
    })();
  }, [config]);

  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Disputas<span>Registro neutral on-chain</span>
        </h1>
        <p>
          El contrato registra el motivo, las respuestas y el desenlace como digests. No mueve escrow
          ni decide hechos del mundo real.
        </p>
      </section>
      <div className="grid" style={{ alignItems: "start" }}>
        <div className="card">
          <h2>Disputa #{dispute?.id ?? "1"}</h2>
          {dispute ? (
            <dl className="kv">
              <dt>Encuentro</dt><dd>#{dispute.encounterId}</dd>
              <dt>Estado</dt><dd>{dispute.status}</dd>
              <dt>Motivo (hash)</dt><dd className="mono small">{shortAddress(dispute.reasonHash)}</dd>
              <dt>Respuesta A</dt><dd>{dispute.openerResponded ? "registrada" : "pendiente"}</dd>
              <dt>Respuesta B</dt><dd>{dispute.counterpartyResponded ? "registrada" : "pendiente"}</dd>
            </dl>
          ) : (
            <p className="muted small">Leyendo estado del contrato…</p>
          )}
        </div>
        <div className="card">
          <h2>Transacciones reales</h2>
          <ul className="muted small">
            {HASHES.map(([label, hash]) => (
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
