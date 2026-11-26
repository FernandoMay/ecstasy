"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HISTORY_KEY, parseHistory } from "@/lib/encounter-history";
import { analytics, type AnalyticsResult } from "@/lib/analytics";
import { EVIDENCE } from "@/lib/evidence";
import { statusNameOf } from "@ecstasy/stellar";
import { useWallet } from "@/components/WalletProvider";

export default function AnalyticsPage() {
  const { service } = useWallet();
  const [result, setResult] = useState<AnalyticsResult>(analytics({}, EVIDENCE.length));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const refs = parseHistory(
        typeof window === "undefined" ? null : window.localStorage.getItem(HISTORY_KEY),
      );
      const pairs = await Promise.all(
        refs.map(async (ref) => {
          try {
            const encounter = await service.read(BigInt(ref.id));
            return [ref.id, statusNameOf(encounter.status)] as const;
          } catch {
            return [ref.id, "unknown"] as const;
          }
        }),
      );
      if (!cancelled) setResult(analytics(Object.fromEntries(pairs), EVIDENCE.length));
    })();
    return () => {
      cancelled = true;
    };
  }, [service]);

  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Analítica<span>Datos observados, no estimados</span>
        </h1>
        <p>
          Contadores derivados del índice local de encuentros y de lecturas reales al contrato. No
          son estadísticas globales del protocolo ni métricas simuladas.
        </p>
      </section>
      <div className="grid">
        <div className="card">
          <h2>Encuentros observados</h2>
          <p style={{ fontSize: 32, fontWeight: 700 }}>{result.total}</p>
          <p className="muted small">en este navegador, con estado leído on-chain</p>
        </div>
        <div className="card">
          <h2>Evidencia Testnet</h2>
          <p style={{ fontSize: 32, fontWeight: 700 }}>{result.evidenceCount}</p>
          <p className="muted small">transacciones reales documentadas</p>
          <Link className="btn btn-small" href="/evidence">Ver evidencia →</Link>
        </div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h2>Por estado</h2>
        {Object.entries(result.byStatus).length === 0 ? (
          <p className="muted small">Sin encuentros registrados todavía.</p>
        ) : (
          <div className="grid">
            {Object.entries(result.byStatus).map(([status, count]) => (
              <div key={status} className="row" style={{ justifyContent: "space-between" }}>
                <span className={`badge status-${status.toLowerCase()}`}>{status}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
