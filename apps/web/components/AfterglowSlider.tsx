"use client";

import { useState } from "react";

export function AfterglowSlider({
  disabled,
  alreadySubmitted,
  onSubmit,
}: {
  disabled?: boolean;
  alreadySubmitted?: boolean;
  onSubmit: (score: number) => Promise<void>;
}) {
  const [score, setScore] = useState(50);
  const [busy, setBusy] = useState(false);

  return (
    <div className="card">
      <h3>Afterglow</h3>
      {alreadySubmitted && (
        <div className="notice" style={{ borderLeftColor: "var(--success)" }}>
          Your score is already recorded. One submission per participant is allowed.
        </div>
      )}
      <p className="muted small">
        One bounded score (0–100) per participant, available after settlement. This is participant
        feedback — not a safety, identity, or truth verification.
      </p>
      <div className="row">
        <input
          type="range"
          min={0}
          max={100}
          value={score}
          disabled={disabled || busy || alreadySubmitted}
          onChange={(event) => setScore(Number(event.target.value))}
          aria-label="Afterglow score"
        />
        <strong style={{ minWidth: 36, textAlign: "right" }}>{score}</strong>
      </div>
      <button
        className="btn btn-primary"
        style={{ marginTop: 14 }}
        disabled={disabled || busy || alreadySubmitted}
        onClick={async () => {
          setBusy(true);
          try {
            await onSubmit(score);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Submitting…" : "Submit afterglow"}
      </button>
    </div>
  );
}
