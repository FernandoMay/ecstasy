"use client";

import type { Encounter } from "@ecstasy/stellar";
import { timelineSteps } from "@/lib/encounter-timeline";

export function EncounterTimeline({ encounter }: { encounter: Encounter }) {
  const steps = timelineSteps(
    typeof encounter.status === "string" ? (encounter.status as never) : encounter.status.tag,
    {
      creatorCompleted: encounter.creator_completed,
      participantCompleted: encounter.participant_completed,
    },
  );
  return (
    <ol className="timeline" style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {steps.map((step, index) => (
        <li
          key={step.key}
          className={step.done ? "done" : undefined}
          style={{
            marginBottom: 8,
            borderLeft: `3px solid ${step.done ? "var(--success)" : "var(--border)"}`,
            paddingLeft: 10,
          }}
        >
          <span className="muted small">{index + 1}. </span>
          {step.done ? "✓ " : ""}
          {step.label}
        </li>
      ))}
    </ol>
  );
}
