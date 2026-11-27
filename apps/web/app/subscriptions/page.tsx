"use client";

import { SubscriptionClient, SubscriptionError, shortAddress } from "@ecstasy/stellar";
import { useEffect, useState } from "react";
import { useWallet } from "@/components/WalletProvider";

const TXS = [
  ["Crear plan", "94f22917e9d7b17fc6f848e8acba8c8120e62e11270c1041ef69c5cdbcd81082"],
  ["Financiar periodo 1", "70cf87b78649e6214888bb621c5259ac4827f9454e56f7f640cad62e81f5f20f"],
  ["Entrega 1", "44cd999f197e3bc102ba8a7ff4c6e078a13ecf6e3d4b9efc00e4889223fba918"],
  ["Aprobar 1", "fd9fe84cfd918b423d168b6b83f0fab2726bd98e398cffd048c03856f3ac88c2"],
  ["Financiar periodo 2", "a60b62d610aa3b740d3210c8246da351d120c26629a0b8488be1315eaed33f67"],
  ["Disputar 2", "f333e06feb5b972965aed2ceeaac7c7f068e6eee4077b60b54505bce98e34f8d"],
  ["Resolver 2", "678190dbb08075ff7e17372188a0f04f6f94cf8745318154505927955edf488c"],
  ["Cancelar plan", "28acb88e04bd1e1cb96cadef528de1f4a225a407bbe87d23993884ca5c940b60"],
  ["Autorizar fuente", "5bcebdd72450be46e0257077b054cbfd6b50cc2a13e3f59caab1b9e0aa46bab3"],
  ["Registrar resultado", "acc5b2c3d8ea0e737c27316832e250619bcae8b7c520d9bc8ad0fa5e06cab646"],
  ["Enlazar ciclo", "bff926f11809348dab317956a216409f6a1016a1dba3a359b58c55b2692c1066"],
] as const;

type PeriodView = {
  id: string;
  status: string;
  amount: string;
  delivery: string;
  reason: string;
};

const tag = (value: unknown): string =>
  typeof value === "string" ? value : (value as { tag: string }).tag;

export default function SubscriptionsPage() {
  const { config } = useWallet();
  const [plan, setPlan] = useState<{ id: string; amount: string; frequency: string; cancelled: boolean } | null>(null);
  const [periods, setPeriods] = useState<PeriodView[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const client = new SubscriptionClient({
          contractId: config.subscriptionContractId,
          rpcUrl: config.rpcUrl,
          networkPassphrase: config.networkPassphrase,
          errorTypes: SubscriptionError,
          allowHttp: config.rpcUrl.startsWith("http://"),
        });
        const planResult = (await client.get_plan({ plan_id: 1n })).result;
        if (planResult.isErr()) return;
        const value = planResult.unwrap();
        setPlan({
          id: value.id.toString(),
          amount: value.amount.toLocaleString(),
          frequency: `${value.frequency}s`,
          cancelled: value.cancelled,
        });
        const historyResult = (await client.get_periods({ plan_id: 1n })).result;
        if (historyResult.isErr()) return;
        setPeriods(
          historyResult.unwrap().map((item) => ({
            id: item.period_id.toString(),
            status: tag(item.status),
            amount: item.amount.toLocaleString(),
            delivery: item.delivery_hash == null ? "—" : shortAddress(item.delivery_hash.toString("hex")),
            reason: item.reason_hash == null ? "—" : shortAddress(item.reason_hash.toString("hex")),
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
          Subscription escrow<span>Periodos financiados, nunca cobros automáticos</span>
        </h1>
        <p>
          Cada periodo se financia con una transacción firmada por el pagador. Sin depósito no hay
          obligación ejecutable, y una disputa bloquea solo su periodo.
        </p>
      </section>
      <div className="grid" style={{ alignItems: "start" }}>
        <div className="card">
          <h2>Plan #1</h2>
          {plan ? (
            <dl className="kv">
              <dt>Importe por periodo</dt><dd className="mono">{plan.amount} stroops</dd>
              <dt>Frecuencia</dt><dd className="mono">{plan.frequency}</dd>
              <dt>Estado</dt><dd>{plan.cancelled ? "Cancelado (nuevos periodos bloqueados)" : "Activo"}</dd>
            </dl>
          ) : (
            <p className="muted small">Leyendo plan del contrato…</p>
          )}
          <h3 style={{ marginTop: 16 }}>Historial de periodos</h3>
          {periods.length === 0 ? (
            <p className="muted small">Leyendo periodos…</p>
          ) : (
            <ul className="muted small" style={{ listStyle: "none", padding: 0 }}>
              {periods.map((item) => (
                <li key={item.id} style={{ marginBottom: 10, borderBottom: "1px solid #222", paddingBottom: 8 }}>
                  <strong>Periodo {item.id} · {item.status}</strong>
                  <div className="mono">{item.amount} stroops · entrega {item.delivery} · motivo {item.reason}</div>
                </li>
              ))}
            </ul>
          )}
          <p className="muted small" style={{ marginTop: 12 }}>
            Un intento de financiar el periodo 3 tras cancelar fue rechazado en simulación (Error #7), sin hash.
          </p>
        </div>
        <div className="card">
          <h2>Reconciliación e integración</h2>
          <ul className="muted small">
            <li>Dos depósitos de 1,000,000 = 2,000,000 stroops.</li>
            <li>Periodo 1 aprobado: 1,000,000 al destinatario.</li>
            <li>Periodo 2 disputado y devuelto: 1,000,000 al pagador.</li>
            <li>Saldo final del contrato: 0 stroops.</li>
          </ul>
          <p className="muted small" style={{ marginTop: 12 }}>
            El resultado se registró en el Reputation Registry (fuente autorizada) y el ciclo se enlazó en el
            Traceability Registry usando el hash real de la resolución como `settlement_tx`.
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
