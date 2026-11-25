"use client";

import { statusName, type Encounter, type EncounterStatus } from "@ecstasy/stellar";

const STEPS = ["Created", "Accepted", "Completed", "Settled"] as const;

function rank(status: EncounterStatus): number {
  const name = statusName(status);
  const index = STEPS.indexOf(name as (typeof STEPS)[number]);
  if (index >= 0) return index + 1;
  return -1;
}

export function EncounterTimeline({ encounter }: { encounter: Encounter }) {
  const current = rank(encounter.status);
  return (
    <ul className="timeline">
      {STEPS.map((step, index) => (
        <li key={step} className={current >= index + 1 ? "done" : undefined}>
          {current >= index + 1 ? "✓ " : ""}
          {step}
        </li>
      ))}
      {current === -1 && <li className="done">✕ {statusName(encounter.status)}</li>}
    </ul>
  );
}
