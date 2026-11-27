"use client";

import { ArbitrationClient, ArbitrationError, shortAddress } from "@ecstasy/stellar";
import { useEffect, useState } from "react";
import { useWallet } from "@/components/WalletProvider";

const TXS = [
  ["Depositar", "6eb11aa8a67d1a76364df514e5a355170a15f4044b5ca7143de1dcce40295554"],
  ["Argumento", "7f4b26b3d0e4b212ab58557fcb5d6dda58f53060a37610ca0c0e15d1ae701f0f"],
  ["Release", "7dde0fbf8bbabad2a10100e71792f759f6d6b35e9f306a4f79cc0394dd74854a"],
  ["Refund", "2cd356bae3452a922ed57fb134dd77de19ae5d01a45f358cef828f739354de1d"],
  ["Split", "d5ba24a810434e443c25fc201ff27d3a537dbc3fff258086b3765c09e2ed9e13"],
] as const;

const OUTCOME: Record<number, string> = { 1: "Release", 2: "Refund", 3: "Split" };

export default function ArbitrationPage() {
  const { config } = useWallet();
  const [cases, setCases] = useState<Array<{ id: string; status: string; amount: string; outcome: string }>>([]);

  useEffect(() => {
    (async () => {
      const results = await Promise.all(
        [1n, 2n, 3n].map(async (id) => {
          try {
            const client = new ArbitrationClient({
              contractId: config.arbitrationContractId,
              rpcUrl: config.rpcUrl,
              networkPassphrase: config.networkPassphrase,
              errorTypes: ArbitrationError,
              allowHttp: config.rpcUrl.startsWith("http://"),
            });
            const result = (await client.get({ case_id: id })).result;
            if (result.isErr()) return null;
            const value = result.unwrap();
            return {
              id: value.id.toString(),
              status: typeof value.status === "string" ? value.status : value.status.tag,
              amount: (Number(value.amount) / 10_000_000).toLocaleString(),
              outcome: value.outcome_code === null ? "—" : OUTCOME[Number(value.outcome_code)] ?? "—",
            };
          } catch {
            return null;
          }
        }),
      );
      setCases(results.filter((item) => item !== null) as Array<{ id: string; status: string; amount: string; outcome: string }>);
    })();
  }, [config]);

  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Escrow arbitration<span>El resolver decide el destino de XLM real</span>
        </h1>
        <p>
          Tres resultados económicos ejecutados en Testnet: liberar al destinatario, devolver al
          proponente o dividir el depósito. El resolver está designado en el contrato.
        </p>
      </section>
      <div className="grid" style={{ alignItems: "start" }}>
        <div className="card">
          <h2>Casos resueltos</h2>
          {cases.length === 0 ? (
            <p className="muted small">Leyendo casos del contrato…</p>
          ) : (
            <div className="grid">
              {cases.map((item) => (
                <div className="card" key={item.id} style={{ padding: 14 }}>
                  <strong>Caso #{item.id}</strong>
                  <div className="muted small" style={{ marginTop: 6 }}>
                    {item.status} · {item.amount} XLM · {item.outcome}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="muted small" style={{ marginTop: 12 }}>
            Un segundo intento de resolución fue rechazado en simulación (Error #3), sin hash.
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
