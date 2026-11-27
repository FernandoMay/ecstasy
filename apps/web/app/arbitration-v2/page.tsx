"use client";

import { ArbitrationV2Client, ArbitrationV2Error, shortAddress } from "@ecstasy/stellar";
import { useEffect, useState } from "react";
import { useWallet } from "@/components/WalletProvider";

const TXS = [
  ["Crear caso 1", "3a6bdc8c6ef6fb6979871745dd23744b098406422b1e244bbe045f8be774b7d7"],
  ["Crear caso 2", "7915c21f1392e92b4e5039ba4aa2ed145a215b0cb36ced6ddff25aa07fdbc229"],
  ["Crear caso 3", "e6a4b351504aef70cec00c6251477e717870e68088c48b3729827dd7a75096f4"],
  ["Crear caso 4", "93a3065fbd3604c584598b4a4e0d196c2f3aefb18f9c29d1f8553a7a75f5e0e1"],
  ["Timeout split (1)", "a311cb341b3becf94af443b87f73ff3b439fc9fa91f968ce80f4d7b2c1759bb0"],
  ["Timeout refund (2)", "48e55a518f9e6d1221ba9404b3f562a8f2ab6e3f516e698dc3a27c4d7c9a0f76"],
  ["Timeout release (3)", "eb7f8e21415eb0d6c54f29462e130be6b52f769e362e7a70f6d59ec532006cb2"],
  ["Timeout split (4)", "e4a2657dda1f2d0f9a6787e5e4450ed9451a223d9851319deb80d2c6a94c0401"],
  ["Crear caso 5", "bd3b96ec477fc8e23c92564a93e9717b75c0faf6e10f785ea14a6391d485d8e3"],
  ["Resolver Release (5)", "82b53d3aaddd0a0c215fa938ccf0eb5c6fb7bbea712c5b903a6e266bcfc52ba1"],
] as const;

const OUTCOME: Record<number, string> = { 1: "Release", 2: "Refund", 3: "Split" };
const tag = (value: unknown): string =>
  typeof value === "string" ? value : (value as { tag: string }).tag;

type View = { id: string; status: string; outcome: string; amount: string };

export default function ArbitrationV2Page() {
  const { config } = useWallet();
  const [cases, setCases] = useState<View[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const client = new ArbitrationV2Client({
          contractId: config.arbitrationV2ContractId,
          rpcUrl: config.rpcUrl,
          networkPassphrase: config.networkPassphrase,
          errorTypes: ArbitrationV2Error,
          allowHttp: config.rpcUrl.startsWith("http://"),
        });
        const results = await Promise.all(
          [1n, 2n, 3n, 4n, 5n].map(async (id) => {
            const result = (await client.get({ case_id: id })).result;
            if (result.isErr()) return null;
            const value = result.unwrap();
            return {
              id: value.id.toString(),
              status: tag(value.status),
              outcome: value.outcome_code === null ? "—" : OUTCOME[Number(value.outcome_code)] ?? "—",
              amount: (Number(value.amount) / 10_000_000).toLocaleString(),
            };
          }),
        );
        setCases(results.filter((item) => item !== null) as View[]);
      } catch {
        // keep empty state
      }
    })();
  }, [config]);

  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Arbitration V2<span>Autoridad acotada y salida garantizada</span>
        </h1>
        <p>
          El resolver decide solo entre `respond_by` y `resolve_by`. Si no firma, cualquiera activa
          un `timeout` determinista según la evidencia registrada: ningún caso financiado queda
          bloqueado y ninguna salida puede ejecutarse dos veces.
        </p>
      </section>
      <div className="grid" style={{ alignItems: "start" }}>
        <div className="card">
          <h2>Casos reales</h2>
          {cases.map((item) => (
            <div key={item.id} className="muted small" style={{ marginBottom: 8 }}>
              <strong>Caso #{item.id}</strong> · {item.status} · {item.outcome} · {item.amount} XLM
            </div>
          ))}
          <h3 style={{ marginTop: 18 }}>Política de timeout</h3>
          <ul className="muted small">
            <li>Ambas evidencias → Split 50/50.</li>
            <li>Solo proponente → Refund al proponente.</li>
            <li>Solo destinatario → Release al destinatario.</li>
            <li>Sin evidencia → Refund al origen.</li>
          </ul>
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
          <p className="muted small" style={{ marginTop: 12 }}>
            Los intentos de resolver fuera de ventana fueron rechazados en simulación (#8 y #5), sin hash.
          </p>
        </div>
      </div>
    </>
  );
}
