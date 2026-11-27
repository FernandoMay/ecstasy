"use client";

import { MilestonesClient, MilestoneError, shortAddress } from "@ecstasy/stellar";
import { useEffect, useState } from "react";
import { useWallet } from "@/components/WalletProvider";

const TXS = [
  ["Crear", "18a681274cd9e8c47d1040a63db60b99b15b0d56651b27ac477f5175f63b5be8"],
  ["Evidencia", "0cfcbde2948e9eac8bb495461647485b9ad38436aa649ce27cebf063f97a4066"],
  ["Aprobar", "c17a91fa0db82b7c1a26cd7d53b877537c35896d249259810b5fe9eb0a64bc6c"],
  ["Disputar", "4e38f6a27c5eca04fe090bfcbf0f2a4a8e9ddada8a2974e38465fda8b3bd93e0"],
  ["Resolver", "37a2e1176eb0b2e260aa2176fdc06a9a2769231e6647088f4910505f12bd4af8"],
  ["Recuperar", "479ddc98ee23ebf67c12bcaca4d2aedcd9f9229b3534eb2b68080b937e0c05ff"],
] as const;

type MilestoneView = { amount: string; status: string; deadline: string };

export default function MilestonesPage() {
  const { config } = useWallet();
  const [milestones, setMilestones] = useState<MilestoneView[]>([]);
  const [total, setTotal] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const client = new MilestonesClient({
          contractId: config.milestonesContractId,
          rpcUrl: config.rpcUrl,
          networkPassphrase: config.networkPassphrase,
          errorTypes: MilestoneError,
          allowHttp: config.rpcUrl.startsWith("http://"),
        });
        const result = (await client.get({ agreement_id: 1n })).result;
        if (result.isErr()) return;
        const value = result.unwrap();
        setTotal((Number(value.total) / 10_000_000).toLocaleString());
        setMilestones(
          value.milestones.map((item) => ({
            amount: (Number(item.amount) / 10_000_000).toLocaleString(),
            status: typeof item.status === "string" ? item.status : item.status.tag,
            deadline: new Date(Number(item.deadline) * 1000).toLocaleString(),
          })),
        );
      } catch {
        // keep empty state
      }
    })();
  }, [config]);

  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Milestone escrow<span>Paga por entregables, no de una sola vez</span>
        </h1>
        <p>
          XLM reales en custodia, liberados por hito. Un hito disputado o recuperado no afecta el
          dinero de los demás.
        </p>
      </section>
      <div className="grid" style={{ alignItems: "start" }}>
        <div className="card">
          <h2>Acuerdo #1</h2>
          <p className="muted small">Depósito total: {total ?? "—"} XLM</p>
          <div style={{ height: 12 }} />
          {milestones.length === 0 ? (
            <p className="muted small">Leyendo hitos del contrato…</p>
          ) : (
            <ol style={{ paddingLeft: 18 }}>
              {milestones.map((item, index) => (
                <li key={index} style={{ marginBottom: 12 }}>
                  <strong>
                    Hito {index}: {item.amount} XLM · {item.status}
                  </strong>
                  <div className="muted small">Vence: {item.deadline}</div>
                </li>
              ))}
            </ol>
          )}
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
