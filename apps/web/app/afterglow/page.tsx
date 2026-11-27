"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FEEDBACK_KEY, parseFeedback } from "@/lib/afterglow-feedback";
import { afterglowInsights, filterFeedback } from "@/lib/afterglow-insights";

export default function AfterglowPage() {
  const [entries, setEntries] = useState(parseFeedback(null));
  const [minScore, setMinScore] = useState(0);

  useEffect(() => {
    setEntries(
      typeof window === "undefined"
        ? []
        : parseFeedback(window.localStorage.getItem(FEEDBACK_KEY)),
    );
  }, []);

  const insights = afterglowInsights(filterFeedback(entries, minScore));

  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Afterglow<span>Feedback estructurado, calculado localmente</span>
        </h1>
        <p>
          Historial de scores on-chain con contexto local opcional. Nada de esto se publica en la
          cadena: el contrato solo almacena el score 0–100 por participante.
        </p>
      </section>
      <div className="grid">
        <div className="card">
          <h2>Resumen</h2>
          <dl className="kv">
            <dt>Registros</dt><dd>{insights.count}</dd>
            <dt>Promedio</dt><dd>{insights.average ?? "—"}</dd>
          </dl>
          <div style={{ height: 14 }} />
          <label className="label" htmlFor="min-score">Score mínimo</label>
          <input
            id="min-score"
            className="input"
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(event) => setMinScore(Number(event.target.value))}
          />
        </div>
        <div className="card">
          <h2>Tags</h2>
          {Object.entries(insights.tags).length === 0 ? (
            <p className="muted small">Sin tags registrados.</p>
          ) : (
            <div className="grid">
              {Object.entries(insights.tags).map(([tag, count]) => (
                <div className="row" key={tag} style={{ justifyContent: "space-between" }}>
                  <span>{tag}</span><strong>{count}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h2>Historial</h2>
        {insights.byEncounter.length === 0 ? (
          <p className="muted small">Todavía no hay feedback guardado en este navegador.</p>
        ) : (
          <ul className="muted small" style={{ listStyle: "none", padding: 0 }}>
            {insights.byEncounter.map((item) => (
              <li key={item.encounterId} style={{ marginBottom: 10 }}>
                <Link href={`/encounters/${item.encounterId}`}>Encounter #{item.encounterId}</Link>{" "}
                · score {item.score} · {item.tags.join(", ") || "sin tags"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
