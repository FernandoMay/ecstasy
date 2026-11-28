"use client";

import {
  FlowV2Client,
  FlowError,
  RoleRegistryV2Client,
  RoleError,
  shortAddress,
} from "@ecstasy/stellar";
import { useEffect, useState } from "react";
import { useWallet } from "@/components/WalletProvider";

const START = "60183196dbc3cb10d05bdd4d7f851ef07c55a3282d53ed4088ab759049af6745";
const LINKS = [
  ["vault_fund", "699bc8f53692b3b29ac311ddeeee6bfc06afa1c38b2d30676d8d25a6b81507b8"],
  ["milestone", "08d147f85995f32dd0f615b7fae937e0f735d74ff14cf4698bf4915c9640d7a8"],
  ["dispute", "507d7abd87bdd8d86c350d8997920134dddd068ad50e24801b62fcd5ee4ac220"],
  ["arbitration", "1eb6c7f08e52b434a62e6e23cc92a641668fee026379d9f075a565ba78e9e404"],
  ["panel", "62a1aba541f213d56faadb0d41629d1e4e5fc01204069277db48081c0fa51613"],
] as const;

const tag = (value: unknown): string =>
  typeof value === "string" ? value : (value as { tag: string }).tag;

type Step = { step: string; refId: string; hash: string; actor: string };

export default function FlowV2Page() {
  const { config } = useWallet();
  const [status, setStatus] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [settlement, setSettlement] = useState<string | null>(null);
  const [roles, setRoles] = useState<Array<{ role: string; holder: string; allowed: boolean }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const options = {
          rpcUrl: config.rpcUrl,
          networkPassphrase: config.networkPassphrase,
          allowHttp: config.rpcUrl.startsWith("http://"),
        };
        const flow = new FlowV2Client({
          ...options,
          contractId: config.flowV2ContractId,
          errorTypes: FlowError,
        });
        const registry = new RoleRegistryV2Client({
          ...options,
          contractId: config.roleRegistryV2ContractId,
          errorTypes: RoleError,
        });
        const f = (await flow.get_flow({ flow_id: 1n })).result;
        if (!f.isErr()) {
          const v = f.unwrap();
          setStatus(tag(v.status));
          setSettlement(v.settlement_tx == null ? null : Buffer.from(v.settlement_tx).toString("hex"));
        }
        const page = (await flow.get_steps({ flow_id: 1n, offset: 0 })).result;
        setSteps(
          page.map((s) => ({
            step: tag(s.step),
            refId: s.ref_id.toString(),
            hash: Buffer.from(s.tx_hash).toString("hex"),
            actor: s.actor as string,
          })),
        );
        const candidates = [
          ["fund_manager", "GAUZSVWQY5KOFMWZA5YJEBOECWBGSZHPSADVI6G3ZB54JULLDL6IKISJ"],
          ["registrar", "GBNV3K7K7524XYPMDM2YHP3ORQVDCZ6SFUCKKLPFPKEFCHVCN6RGI2FR"],
          ["resolver", "GB3E57PYF6DQ6FVYXGPXUU2LTZYTPROPICDLZ5C5MEJZOSGWMBUPMPH3"],
          ["admin", "GBQV7XDOMA6342BHICZGIRBDOZVTMRL7A7A3MWVL4SRP7EH37NAPO5KQ"],
        ];
        const checks = await Promise.all(
          candidates.map(async ([role, holder]) => ({
            role,
            holder,
            allowed: (await registry.has_role({ role, account: holder })).result,
          })),
        );
        setRoles(checks);
      } catch {
        // keep empty state
      }
    })();
  }, [config]);

  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Composed V2 flow<span>Vault → Milestones → Arbitration → Panel → Settlement</span>
        </h1>
        <p>
          Un solo flujo on-chain enlaza los cuatro primitives V2 con sus hashes reales. Cada paso
          fue ejecutado por una identidad con un rol distinto; la administración no puede mover
          fondos ni enlazar pasos.
        </p>
      </section>
      <div className="grid" style={{ alignItems: "start" }}>
        <div className="card">
          <h2>Flujo #{1}</h2>
          <p className="muted small mono">{config.flowV2ContractId}</p>
          <p className="muted small">
            Estado: <strong>{status ?? "—"}</strong> · Settlement:{" "}
            {settlement ? <span className="mono">{shortAddress(settlement)}</span> : "—"}
          </p>
          <h3 style={{ marginTop: 16 }}>Pasos vinculados</h3>
          {steps.length === 0 ? (
            <p className="muted small">Leyendo pasos del contrato…</p>
          ) : (
            <ol style={{ paddingLeft: 18 }}>
              {steps.map((s) => (
                <li key={s.step} className="muted small" style={{ marginBottom: 10 }}>
                  <strong>{s.step}</strong> · ref {s.refId} ·{" "}
                  <a href={`https://stellar.expert/explorer/testnet/tx/${s.hash}`} target="_blank" rel="noreferrer">
                    {shortAddress(s.hash)} ↗
                  </a>
                  <div>actor {shortAddress(s.actor)}</div>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="card">
          <h2>Autoridad delegada</h2>
          <ul className="muted small" style={{ listStyle: "none", padding: 0 }}>
            {roles.map((r) => (
              <li key={r.role} style={{ marginBottom: 8 }}>
                <strong>{r.role}</strong>: {r.allowed ? "sí" : "no"} · {shortAddress(r.holder)}
              </li>
            ))}
          </ul>
          <p className="muted small" style={{ marginTop: 12 }}>
            El intento de `start` y de `link_step` por la cuenta admin fue rechazado en simulación (#2),
            sin hash. El rol `resolver` pertenece a una clave distinta del admin.
          </p>
          <h3 style={{ marginTop: 16 }}>Transacciones base</h3>
          <ul className="muted small">
            <li>
              Inicio:{" "}
              <a href={`https://stellar.expert/explorer/testnet/tx/${START}`} target="_blank" rel="noreferrer">
                {shortAddress(START)} ↗
              </a>
            </li>
            {LINKS.map(([label, hash]) => (
              <li key={label}>
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
