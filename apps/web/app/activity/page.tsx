"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ACTIVITY_KEY, parseActivity } from "@/lib/activity";
import { filterActivity, protocolActivity, type ActivityFilter } from "@/lib/protocol-activity";

export default function ActivityPage() {
  const [entries, setEntries] = useState(protocolActivity([]));
  const [filter, setFilter] = useState<ActivityFilter>("all");

  useEffect(() => {
    setEntries(
      protocolActivity(
        typeof window === "undefined" ? [] : parseActivity(window.localStorage.getItem(ACTIVITY_KEY)),
      ),
    );
  }, []);

  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Actividad del protocolo<span>Estado local + evidencia Testnet</span>
        </h1>
        <p>
          Timeline único con transiciones observadas en este navegador y transacciones reales
          verificadas en Horizon. Cada transacción lleva a su prueba pública.
        </p>
      </section>
      <div className="card">
        <div className="row" style={{ marginBottom: 16 }}>
          {(["all", "state", "transaction"] as const).map((value) => (
            <button
              key={value}
              className={filter === value ? "btn btn-small btn-primary" : "btn btn-small"}
              onClick={() => setFilter(value)}
            >
              {value === "all" ? "Todo" : value === "state" ? "Estados" : "Transacciones"}
            </button>
          ))}
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {filterActivity(entries, filter).map((entry) => (
            <li
              key={entry.key}
              style={{
                borderLeft: `3px solid ${entry.kind === "transaction" ? "var(--success)" : "var(--accent-2)"}`,
                paddingLeft: 12,
                marginBottom: 14,
              }}
            >
              <strong>{entry.title}</strong>
              <div className="muted small">{entry.detail}</div>
              {entry.hash && (
                <a
                  className="small"
                  href={`https://stellar.expert/explorer/testnet/tx/${entry.hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver transacción ↗
                </a>
              )}
            </li>
          ))}
        </ul>
        <div style={{ height: 12 }} />
        <Link className="btn btn-small" href="/evidence">Ver Evidence Center →</Link>
      </div>
    </>
  );
}
