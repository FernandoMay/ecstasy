"use client";

import {
  ArbitratorsRegistryClient,
  PanelV2Client,
  RegistryError,
  PanelV2Error,
  shortAddress,
} from "@ecstasy/stellar";
import { useEffect, useState } from "react";
import { useWallet } from "@/components/WalletProvider";

const TXS = [
  ["Crear caso", "0e401b1ed88dc3398040117c3e0f2ff69381e83bc0de9391557dfbeb7ce584cf"],
  ["Seleccionar panel", "637f1b67a3263ca97d8df967aea6cc5b0c2db17ef84aeeae372b1f1ecd8721ff"],
  ["Commit 1", "bb86aa100fc1cac49da74d14b66a2141d848debc02c0facf14b54adb7ec7e739"],
  ["Commit 2", "02802a9233dc26494450cb05e9b36a8ddbfa303ddedc1ec4f7b1b6fb3be597e3"],
  ["Commit 3", "5e4ac700e8e92f49df832f692ea678fb1e2cfddd0e74ea209d26e72ad2ee69e6"],
] as const;

const OUTCOME: Record<number, string> = { 1: "Release", 2: "Refund", 3: "Split" };
const tag = (value: unknown): string =>
  typeof value === "string" ? value : (value as { tag: string }).tag;

export default function PanelV2Page() {
  const { config } = useWallet();
  const [panel, setPanel] = useState<string[]>([]);
  const [eligible, setEligible] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const options = {
          rpcUrl: config.rpcUrl,
          networkPassphrase: config.networkPassphrase,
          allowHttp: config.rpcUrl.startsWith("http://"),
        };
        const registry = new ArbitratorsRegistryClient({
          ...options,
          contractId: config.arbitratorsRegistryContractId,
          errorTypes: RegistryError,
        });
        const panelClient = new PanelV2Client({
          ...options,
          contractId: config.panelV2ContractId,
          errorTypes: PanelV2Error,
        });
        setEligible((await registry.get_eligible()).result.length);
        const caseResult = (await panelClient.get({ case_id: 1n })).result;
        if (!caseResult.isErr()) {
          const value = caseResult.unwrap();
          setPanel(value.arbitrators.map((item) => item as string));
          setStatus(tag(value.status));
          setOutcome(value.outcome_code === null ? "—" : OUTCOME[Number(value.outcome_code)] ?? "—");
        }
      } catch {
        // keep empty state
      }
    })();
  }, [config]);

  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Panel V2<span>Independientes de verdad, no tres nombres elegidos por el pagador</span>
        </h1>
        <p>
          El pagador deposita pero <strong>no puede nombrar árbitros</strong>. El panel sale de un
          registro de elegibles atestados por un registrador, con una semilla fijada antes del voto.
          El resultado depende del quórum, no de quien ejecuta la liquidación.
        </p>
      </section>
      <div className="grid" style={{ alignItems: "start" }}>
        <div className="card">
          <h2>Arbitrators Registry</h2>
          <p className="muted small mono">{config.arbitratorsRegistryContractId}</p>
          <p className="muted small">Árbitros elegibles: {eligible ?? "—"}</p>
          <h3 style={{ marginTop: 16 }}>Panel seleccionado</h3>
          {panel.length === 0 ? (
            <p className="muted small">Leyendo panel del contrato…</p>
          ) : (
            <ul className="muted small" style={{ listStyle: "none", padding: 0 }}>
              {panel.map((arb) => (
                <li key={arb} className="mono" style={{ marginBottom: 6 }}>
                  {shortAddress(arb)}
                </li>
              ))}
            </ul>
          )}
          <p className="muted small" style={{ marginTop: 12 }}>
            Caso #1 · {status ?? "—"} · {outcome ?? "—"}
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
          <p className="muted small" style={{ marginTop: 12 }}>
            `create` no acepta parámetro de árbitros. Un controlador duplicado fue rechazado en
            simulación con Error #4, sin hash.
          </p>
        </div>
      </div>
    </>
  );
}
