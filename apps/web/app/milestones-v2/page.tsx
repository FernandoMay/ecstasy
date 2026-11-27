"use client";

import { MilestonesV2Client, MilestoneV2Error, shortAddress } from "@ecstasy/stellar";
import { useEffect, useState } from "react";
import { useWallet } from "@/components/WalletProvider";

const TXS = [
  ["Crear acuerdo 1", "72fa8f001214b6625cd01b9f5677467419b27b561a8a79f3ff059e2f6ebb8ff3"],
  ["Entrega m0", "b802aa3fb3b0cb905e2f5facfa69ae43ae4ab289c5c91cc5904405dd8c98a69e"],
  ["Aprobar m0", "5355cee396e57013bbf7eeda916009bd826efee1a4757c73665284f1f3b7542a"],
  ["Entrega m1", "701e199ec350ae38549cea36ae0ea79a0c96707b8970d7e52d52d44a0349a61e"],
  ["Disputar m1", "aaee99d52515838c3c6ad5a1c185ecd0a623cf5c841df043bc485d3fa2c4c729"],
  ["Resolver m1", "da60f72cdef229c3136a9eb3eaf771464a04367e625e2633a78abeec4aeba9c0"],
  ["Recuperar m2", "4ed1c4c0915dc1ee7c5b65dcea4f028611a4e4951ac98d3838d05433eb6bc352"],
  ["Crear acuerdo 2", "041d4cc35bcdcbf5ef1762986118d13ddcf3e131f16cfa3b0b7d037c5ba3b510"],
  ["Disputar acuerdo 2", "0b7d101de3061e628b6a95ddfdb8fdae48755039cc4c62b44d4dcc29a80532cd"],
] as const;

type View = {
  id: string;
  status: string;
  milestones: Array<{ amount: string; status: string; deadline: string }>;
};

const tag = (value: unknown): string =>
  typeof value === "string" ? value : (value as { tag: string }).tag;

export default function MilestonesV2Page() {
  const { config } = useWallet();
  const [views, setViews] = useState<View[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const client = new MilestonesV2Client({
          contractId: config.milestonesV2ContractId,
          rpcUrl: config.rpcUrl,
          networkPassphrase: config.networkPassphrase,
          errorTypes: MilestoneV2Error,
          allowHttp: config.rpcUrl.startsWith("http://"),
        });
        const results = await Promise.all(
          [1n, 2n].map(async (id) => {
            const result = (await client.get({ agreement_id: id })).result;
            if (result.isErr()) return null;
            const value = result.unwrap();
            return {
              id: value.id.toString(),
              status: value.milestones.length > 0 ? "activo" : "—",
              milestones: value.milestones.map((item) => ({
                amount: (Number(item.amount) / 10_000_000).toLocaleString(),
                status: tag(item.status),
                deadline: new Date(Number(item.deadline) * 1000).toLocaleString(),
              })),
            };
          }),
        );
        setViews(results.filter((item) => item !== null) as View[]);
      } catch {
        // keep empty state
      }
    })();
  }, [config]);

  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Milestones V2<span>SEC-02 cerrado: disputa nunca se recupera</span>
        </h1>
        <p>
          Contrato nuevo y aislado. Un hito disputado queda congelado: ninguna llamada permisionless
          puede convertirlo en recuperado. Hay salida legítima para cada estado, con el tiempo del
          ledger y reconciliación exacta en stroops.
        </p>
      </section>
      <div className="grid" style={{ alignItems: "start" }}>
        <div className="card">
          <h2>Contrato V2</h2>
          <p className="muted small mono">{config.milestonesV2ContractId}</p>
          <ul className="muted small">
            <li>Acuerdo 1: aprobado · resuelto · recuperado (3 XLM reconciliados).</li>
            <li>Acuerdo 2: `Disputed` con saldo 1 XLM; `recover` rechazado en simulación con Error #10.</li>
            <li>`settle_after_deadline` paga entregas no aprobadas; `timeout_refund` libera disputas sin resolver.</li>
          </ul>
          {views.map((item) => (
            <div key={item.id} style={{ marginTop: 16 }}>
              <strong>Acuerdo #{item.id}</strong>
              <ol style={{ paddingLeft: 18, marginTop: 8 }}>
                {item.milestones.map((m, index) => (
                  <li key={index} className="muted small" style={{ marginBottom: 6 }}>
                    {m.amount} XLM · <span className="mono">{m.status}</span> · vence {m.deadline}
                  </li>
                ))}
              </ol>
            </div>
          ))}
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
            El intento de `recover` sobre un hito disputado fue rechazado en simulación (#10), sin hash.
          </p>
        </div>
      </div>
    </>
  );
}
