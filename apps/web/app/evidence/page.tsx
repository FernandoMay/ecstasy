"use client";

import { shortAddress } from "@ecstasy/stellar";
import { EVIDENCE, explorerUrl } from "@/lib/evidence";
import Link from "next/link";

export default function EvidencePage() {
  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Evidence Center<span>Testnet · verificable por cualquiera</span>
        </h1>
        <p>
          Cada fila corresponde a una transacción real enviada a Stellar Testnet, con su hash y
          enlace público a Stellar Expert. No hay transacciones simuladas ni datos de ejemplo.
        </p>
      </section>
      <div className="card">
        <h2>Transacciones registradas</h2>
        <p className="muted small">
          {EVIDENCE.length} ejecuciones verificadas. El estado E2E con Freighter se mantiene aparte:
          Wallet signing pending.
        </p>
        <div style={{ height: 16 }} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr className="muted small">
                <th style={{ textAlign: "left", padding: 8 }}>Función</th>
                <th style={{ textAlign: "left", padding: 8 }}>Hash</th>
                <th style={{ textAlign: "left", padding: 8 }}>Esperado</th>
                <th style={{ textAlign: "left", padding: 8 }}>Observado</th>
                <th style={{ textAlign: "left", padding: 8 }}>Enlace</th>
              </tr>
            </thead>
            <tbody>
              {EVIDENCE.map((record) => (
                <tr key={record.hash} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: 8 }}>
                    <strong>{record.feature}</strong>
                    <br />
                    <span className="muted small mono">{record.functionName}</span>
                  </td>
                  <td style={{ padding: 8 }} className="mono small">{shortAddress(record.hash)}</td>
                  <td style={{ padding: 8 }} className="small">{record.expected}</td>
                  <td style={{ padding: 8 }} className="small success-text">{record.observed}</td>
                  <td style={{ padding: 8 }}>
                    <a href={explorerUrl(record.hash)} target="_blank" rel="noreferrer">
                      Ver tx ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ height: 16 }} />
        <Link className="btn" href="/encounters">
          Ver encuentros →
        </Link>
      </div>
    </>
  );
}
