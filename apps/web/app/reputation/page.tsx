"use client";

import {
  LIFECYCLE_STEPS,
  PanelClient,
  PanelError,
  ReputationClient,
  ReputationError,
  TraceabilityClient,
  TraceError,
  shortAddress,
  settlementTxUrl,
  toLifecycleRef,
  type LifecycleRef,
} from "@ecstasy/stellar";
import { useEffect, useState } from "react";
import { useWallet } from "@/components/WalletProvider";

const TXS = [
  ["Autorizar fuente", "07e715e8f71922cdec105d8494027ff1f4c5b63cc29c580694e2b70b3e644da0"],
  ["Registro árbitro 1", "4530b6247ae15b6f668638903dcce054b2b6f7a913cb7e003127c71f9d75a764"],
  ["Registro árbitro 2", "84974f588d5533ffb3e8d200541de8d9d942e76ab180bef7285186c84fdf6310"],
  ["Resultado del caso", "c9ec7ae231791af261e705f1c213128b1496bad6903ab9e8e7404f85368e443d"],
  ["Participación 1", "b517c1ed4e0aa966b5f15bc3a0cd3f603f94a1c8744af309639760500f216ca7"],
  ["Participación 2", "50c4f635e3f3f42bd1eac643211c4bd996275b6a808a4abd384edc76470a95b9"],
  ["Suspensión temporal", "2b304c53ae7a39b85744ba52cf6eca9c80dfacda9571bd142c04caa8689b6859"],
  ["Enlace del ciclo", "f6401f41e3d5300f467876b13077ac4c833ee43eccd1522f6c993c2feae5dbef"],
] as const;

type ArbitratorView = {
  address: string;
  cases: number;
  votes: number;
  suspendedUntil: string;
  eligible: boolean;
};

function clientOptions(config: ReturnType<typeof useWallet>["config"]) {
  return {
    rpcUrl: config.rpcUrl,
    networkPassphrase: config.networkPassphrase,
    allowHttp: config.rpcUrl.startsWith("http://"),
  };
}

export default function ReputationPage() {
  const { config } = useWallet();
  const [arbitrators, setArbitrators] = useState<ArbitratorView[]>([]);
  const [chain, setChain] = useState<LifecycleRef | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const panel = new PanelClient({
          contractId: config.panelContractId,
          errorTypes: PanelError,
          ...clientOptions(config),
        });
        const reputation = new ReputationClient({
          contractId: config.reputationContractId,
          errorTypes: ReputationError,
          ...clientOptions(config),
        });
        const traceability = new TraceabilityClient({
          contractId: config.traceabilityContractId,
          errorTypes: TraceError,
          ...clientOptions(config),
        });

        const caseResult = (await panel.get({ case_id: 1n })).result;
        if (!caseResult.isErr()) {
          const panelCase = caseResult.unwrap();
          const profiles = await Promise.all(
            panelCase.arbitrators.map(async (arb) => {
              const address = arb as string;
              const profileResult = (await reputation.get_profile({ subject: address })).result;
              const eligible = (await reputation.get_eligibility({ subject: address })).result;
              if (profileResult.isErr()) return null;
              const profile = profileResult.unwrap();
              return {
                address,
                cases: Number(profile.cases_recorded),
                votes: Number(profile.votes_recorded),
                suspendedUntil:
                  profile.suspended_until === 0n
                    ? "—"
                    : new Date(Number(profile.suspended_until) * 1000).toLocaleString(),
                eligible,
              };
            }),
          );
          setArbitrators(profiles.filter((item): item is ArbitratorView => item !== null));

          const chainResult = (await traceability.get_chain({ agreement_id: panelCase.agreement_id })).result;
          if (!chainResult.isErr()) setChain(toLifecycleRef(chainResult.unwrap()));
        }
      } catch {
        // keep empty state
      } finally {
        setLoaded(true);
      }
    })();
  }, [config]);

  const chainValues = chain
    ? [chain.agreementId.toString(), chain.escrowId.toString(), chain.caseId.toString(), chain.arbitrationId.toString(), shortAddress(chain.settlementTx)]
    : [];

  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Reputación y trazabilidad<span>Hechos verificables, no puntuaciones</span>
        </h1>
        <p>
          Registro on-chain de participación y resultados ligados a un `case_id` y a su contrato de
          origen. Votar con la mayoría no demuestra la verdad: aquí no hay rankings ni juicios
          subjetivos.
        </p>
      </section>
      <div className="grid" style={{ alignItems: "start" }}>
        <div className="card">
          <h2>Árbitros del panel</h2>
          {!loaded ? (
            <p className="muted small">Leyendo perfiles del contrato…</p>
          ) : arbitrators.length === 0 ? (
            <p className="muted small">No hay perfiles registrados.</p>
          ) : (
            <ul className="muted small" style={{ listStyle: "none", padding: 0 }}>
              {arbitrators.map((item) => (
                <li key={item.address} style={{ marginBottom: 12, borderBottom: "1px solid #222", paddingBottom: 10 }}>
                  <div className="mono">{shortAddress(item.address)}</div>
                  <div>
                    Casos: {item.cases} · Votos: {item.votes} · Elegible: {item.eligible ? "sí" : "no"}
                  </div>
                  <div>Suspendido hasta: {item.suspendedUntil}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h2>Ciclo de vida del acuerdo</h2>
          {chain ? (
            <>
              <div className="grid" style={{ gap: 8 }}>
                {LIFECYCLE_STEPS.map((step, index) => (
                  <div key={step.key} className="muted small">
                    <strong>{step.label}</strong>:{" "}
                    {step.key === "settlementTx" ? (
                      <a href={settlementTxUrl(chain)} target="_blank" rel="noreferrer">
                        {chainValues[index]} ↗
                      </a>
                    ) : (
                      <span className="mono">{chainValues[index]}</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="muted small" style={{ marginTop: 12 }}>
                Cadena leída del contrato de trazabilidad y vinculada al caso real del panel.
              </p>
            </>
          ) : (
            <p className="muted small">{loaded ? "Sin cadena registrada." : "Leyendo cadena…"}</p>
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
