"use client";

import { useState } from "react";

interface PaymentResult {
  hash: string;
  explorerUrl: string;
  memo: string;
  amount: string;
  destination: string;
  source: string;
  network: string;
}

/** Mission 02 payment, sent by the app itself through its own API route. */
export function ChallengePayment() {
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/challenge-payment", { method: "POST" });
      const payload = (await response.json()) as PaymentResult & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Payment failed");
      setResult(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h3>Pago relámpago · Testnet</h3>
      <p className="muted small">
        Payment sent by this app with memo <code className="mono">SHIP-S97KF8</code>. The source
        account is generated per request and funded by Testnet friendbot; no keys are stored.
      </p>
      <button className="btn btn-primary" onClick={pay} disabled={busy}>
        {busy ? "Sending…" : "Send challenge payment"}
      </button>
      {error && <div className="notice error" style={{ marginTop: 14 }}>{error}</div>}
      {result && (
        <div className="notice" style={{ marginTop: 14, borderLeftColor: "var(--success)" }}>
          <div className="small">
            <strong>{result.amount} XLM</strong> → <span className="mono">{result.destination}</span>
          </div>
          <div className="small">memo: <span className="mono">{result.memo}</span></div>
          <div className="small mono" style={{ marginTop: 8 }}>{result.hash}</div>
          <p style={{ marginBottom: 0, marginTop: 8 }}>
            <a href={result.explorerUrl} target="_blank" rel="noreferrer">
              View transaction on stellar.expert ↗
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
